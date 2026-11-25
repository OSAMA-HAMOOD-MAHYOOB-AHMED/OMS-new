using Dapper;
using Oms.Api.Data;
using Oms.Api.Models;
using System.Data.Common;

namespace Oms.Api.Admin;

public sealed class AdminRepository(IDbConnectionFactory db)
{
    private static async Task OpenAsync(System.Data.IDbConnection conn)
    {
        if (conn is DbConnection dbc)
            await dbc.OpenAsync();
        else
            conn.Open();
    }

    public async Task<IReadOnlyList<ProductRow>> ListProducts()
    {
        const string sql = """
            SELECT
              productID AS ProductID,
              name AS Name,
              category AS Category,
              price AS Price,
              stockLevel AS StockLevel,
              description AS Description,
              imageUrl AS ImageUrl,
              compareatprice AS CompareAtPrice,
              specs AS Specs,
              createdat AS CreatedAt
            FROM Product
            ORDER BY name ASC;
            """;
        using var conn = db.Create();
        await OpenAsync(conn);
        return (await conn.QueryAsync<ProductRow>(sql)).ToList();
    }

    // Saves the product and keeps its Inventory row in step with stockLevel, the
    // same way stock receipts and orders update both tables. A new product gets
    // an Inventory row so it can be ordered and appears in the warehouse screens.
    public async Task UpsertProduct(ProductUpsertRequest req)
    {
        const string upsertProduct = """
            INSERT INTO Product (productID, name, category, price, stockLevel, description, imageUrl, compareatprice, specs)
            VALUES (@productID, @name, @category, @price, @stockLevel, @description, @imageUrl, @compareAtPrice, @specs)
            ON CONFLICT (productID) DO UPDATE SET
              name = EXCLUDED.name,
              category = EXCLUDED.category,
              price = EXCLUDED.price,
              stockLevel = EXCLUDED.stockLevel,
              description = EXCLUDED.description,
              imageUrl = EXCLUDED.imageUrl,
              -- Not sent (older app versions) keeps the current value; 0 / "" clears it.
              compareatprice = CASE WHEN @keepCompare THEN Product.compareatprice ELSE EXCLUDED.compareatprice END,
              specs = CASE WHEN @keepSpecs THEN Product.specs ELSE EXCLUDED.specs END;
            """;

        const string lockInventory = """
            SELECT inventoryID AS InventoryID, quantityAvailable AS QuantityAvailable
            FROM Inventory
            WHERE productID = @productID
            ORDER BY inventoryID
            LIMIT 1
            FOR UPDATE;
            """;

        const string insertInventory = """
            INSERT INTO Inventory (inventoryID, productID, location, quantityAvailable, quantityReserved, lastCheckupDate)
            VALUES (@inventoryID, @productID, 'Warehouse A', @qty, 0, NOW());
            """;

        const string updateInventory = """
            UPDATE Inventory SET quantityAvailable = @qty WHERE inventoryID = @inventoryID;
            """;

        const string audit = """
            INSERT INTO Inventory_Audit (inventoryID, action, deltaQuantity, note, createdAt)
            VALUES (@inventoryID, @action, @delta, @note, @createdAt);
            """;

        using var conn = db.Create();
        await OpenAsync(conn);
        using var tx = conn.BeginTransaction();

        // A product's category always appears in the category list.
        await Oms.Api.Catalog.CategoryRepository.EnsureExists(conn, req.Category, tx);

        await conn.ExecuteAsync(upsertProduct, new
        {
            productID = req.ProductID,
            name = req.Name,
            category = req.Category,
            price = req.Price,
            stockLevel = req.StockLevel,
            description = req.Description,
            imageUrl = req.ImageUrl,
            // Only a price above the selling price makes the product "on sale".
            compareAtPrice = req.CompareAtPrice is { } c && c > req.Price ? c : (decimal?)null,
            specs = string.IsNullOrWhiteSpace(req.Specs) ? null : req.Specs.Trim(),
            keepCompare = req.CompareAtPrice is null,
            keepSpecs = req.Specs is null
        }, tx);

        var inv = await conn.QuerySingleOrDefaultAsync<(string InventoryID, int QuantityAvailable)>(
            lockInventory, new { productID = req.ProductID }, tx);

        if (inv.InventoryID is null)
        {
            var inventoryID = $"INV-{req.ProductID}";
            await conn.ExecuteAsync(insertInventory, new { inventoryID, productID = req.ProductID, qty = req.StockLevel }, tx);
            await conn.ExecuteAsync(audit, new
            {
                inventoryID,
                action = "CREATE",
                delta = req.StockLevel,
                note = "Product added by admin",
                createdAt = DateTime.UtcNow
            }, tx);
        }
        else if (inv.QuantityAvailable != req.StockLevel)
        {
            await conn.ExecuteAsync(updateInventory, new { inventoryID = inv.InventoryID, qty = req.StockLevel }, tx);
            await conn.ExecuteAsync(audit, new
            {
                inventoryID = inv.InventoryID,
                action = "ADJUST",
                delta = req.StockLevel - inv.QuantityAvailable,
                note = "Stock level set by admin",
                createdAt = DateTime.UtcNow
            }, tx);
        }

        tx.Commit();
    }

    public enum DeleteProductResult { Deleted, NotFound, HasOrders }

    // Removes a product together with its inventory rows and their history.
    // Products that appear in any order are kept, because invoices and order
    // history still reference them.
    public async Task<DeleteProductResult> DeleteProduct(string productID)
    {
        using var conn = db.Create();
        await OpenAsync(conn);
        using var tx = conn.BeginTransaction();

        var exists = await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM Product WHERE productID = @productID;", new { productID }, tx);
        if (exists == 0)
        {
            tx.Rollback();
            return DeleteProductResult.NotFound;
        }

        var orderLines = await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM Order_Item WHERE productID = @productID;", new { productID }, tx);
        if (orderLines > 0)
        {
            tx.Rollback();
            return DeleteProductResult.HasOrders;
        }

        await conn.ExecuteAsync("""
            DELETE FROM Inventory_Audit
            WHERE inventoryID IN (SELECT inventoryID FROM Inventory WHERE productID = @productID);
            """, new { productID }, tx);
        await conn.ExecuteAsync("DELETE FROM Inventory WHERE productID = @productID;", new { productID }, tx);
        await conn.ExecuteAsync("DELETE FROM Product WHERE productID = @productID;", new { productID }, tx);

        tx.Commit();
        return DeleteProductResult.Deleted;
    }

    public async Task<IReadOnlyList<AdminCustomerRow>> ListCustomers(string? q)
    {
        const string sql = """
            SELECT
              email AS Email,
              name AS Name,
              phoneNumber AS PhoneNumber,
              address AS Address,
              role AS Role
            FROM "User"
            WHERE role = 'Customer'
              AND (@q IS NULL OR email LIKE CONCAT('%', @q, '%') OR name LIKE CONCAT('%', @q, '%'))
            ORDER BY name ASC
            LIMIT 200;
            """;

        using var conn = db.Create();
        await OpenAsync(conn);
        return (await conn.QueryAsync<AdminCustomerRow>(sql, new { q = string.IsNullOrWhiteSpace(q) ? null : q })).ToList();
    }

    public async Task<bool> UpdateOrderStatus(string orderID, string status)
    {
        const string sql = """
            UPDATE "Order" SET orderStatus = @status WHERE orderID = @orderID;
            """;
        using var conn = db.Create();
        await OpenAsync(conn);
        var rows = await conn.ExecuteAsync(sql, new { orderID, status });
        return rows > 0;
    }

    public async Task<AdminSalesReportResponse> SalesReport(int dailyLimit = 60)
    {
        dailyLimit = Math.Clamp(dailyLimit, 7, 120);

        const string dailySql = """
            SELECT
              DATE(o.orderDate) AS Day,
              COUNT(*) AS Orders,
              SUM(o.totalPrice) AS Revenue,
              CASE
                WHEN COUNT(*) = 0 THEN 0
                ELSE SUM(o.totalPrice) / COUNT(*)
              END AS AvgValue
            FROM "Order" o
            GROUP BY DATE(o.orderDate)
            ORDER BY Day DESC
            LIMIT @dailyLimit;
            """;

        const string statusSql = """
            SELECT
              o.orderStatus AS OrderStatus,
              COUNT(*) AS Orders,
              SUM(o.totalPrice) AS Revenue
            FROM "Order" o
            GROUP BY o.orderStatus
            ORDER BY Orders DESC, o.orderStatus ASC;
            """;

        using var conn = db.Create();
        await OpenAsync(conn);

        var daily = (await conn.QueryAsync<AdminSalesDailyRow>(dailySql, new { dailyLimit })).ToList();
        var status = (await conn.QueryAsync<AdminOrderStatusBreakdownRow>(statusSql)).ToList();

        return new AdminSalesReportResponse(daily, status);
    }
}

