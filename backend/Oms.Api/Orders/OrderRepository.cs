using System.Data;
using Dapper;
using Oms.Api.Data;
using Oms.Api.Dashboards;

namespace Oms.Api.Orders;

public sealed class OrderRepository(IDbConnectionFactory db)
{
    public async Task<string> CreateCashOrder(
        string customerEmail,
        IReadOnlyList<(string ProductID, string ProductName, decimal Price, int Quantity)> items)
    {
        var orderID = $"ORD-{Guid.NewGuid():N}".ToUpperInvariant();
        var now = DateTime.UtcNow;

        var total = items.Sum(i => i.Price * i.Quantity);

        using var conn = db.Create();
        if (conn is System.Data.Common.DbConnection dbc)
            await dbc.OpenAsync();
        else
            conn.Open();

        using var tx = conn.BeginTransaction();

        // Lock inventory rows to avoid races
        const string invSql = """
            SELECT inventoryID AS InventoryID, productID AS ProductID, quantityAvailable AS QuantityAvailable
            FROM Inventory
            WHERE productID = @productID
            FOR UPDATE;
            """;

        foreach (var item in items)
        {
            var inv = await conn.QuerySingleOrDefaultAsync<(string InventoryID, string ProductID, int QuantityAvailable)>(
                invSql, new { productID = item.ProductID }, tx);

            if (inv.InventoryID is null)
            {
                tx.Rollback();
                throw new InvalidOperationException($"No inventory row for product {item.ProductID}.");
            }

            if (inv.QuantityAvailable < item.Quantity)
            {
                tx.Rollback();
                throw new InvalidOperationException($"Insufficient stock for product {item.ProductID}.");
            }

            const string updateInv = """
                UPDATE Inventory
                SET quantityAvailable = quantityAvailable - @qty
                WHERE inventoryID = @inventoryID;
                """;
            await conn.ExecuteAsync(updateInv, new { qty = item.Quantity, inventoryID = inv.InventoryID }, tx);

            const string updateProduct = """
                UPDATE Product
                SET stockLevel = GREATEST(stockLevel - @qty, 0)
                WHERE productID = @productID;
                """;
            await conn.ExecuteAsync(updateProduct, new { qty = item.Quantity, productID = item.ProductID }, tx);

            const string audit = """
                INSERT INTO Inventory_Audit (inventoryID, action, deltaQuantity, note, createdAt)
                VALUES (@inventoryID, 'DEDUCT', @delta, @note, @createdAt);
                """;
            await conn.ExecuteAsync(audit, new
            {
                inventoryID = inv.InventoryID,
                delta = -item.Quantity,
                note = $"Order {orderID}",
                createdAt = now
            }, tx);
        }

        const string insertOrder = """
            INSERT INTO "Order" (orderID, email, orderDate, totalPrice, orderStatus, paymentMethod, creditStatus)
            VALUES (@orderID, @email, @orderDate, @totalPrice, 'Shipped', 'Cash', NULL);
            """;
        await conn.ExecuteAsync(insertOrder, new
        {
            orderID,
            email = customerEmail,
            orderDate = now,
            totalPrice = total
        }, tx);

        const string insertItem = """
            INSERT INTO Order_Item (orderID, productID, quantity, subtotal)
            VALUES (@orderID, @productID, @quantity, @subtotal);
            """;

        foreach (var item in items)
        {
            await conn.ExecuteAsync(insertItem, new
            {
                orderID,
                productID = item.ProductID,
                quantity = item.Quantity,
                subtotal = item.Price * item.Quantity
            }, tx);
        }

        tx.Commit();
        return orderID;
    }

    public async Task<string> CreateOnlineOrder(
        string customerEmail,
        string paymentMethod,
        string paymentStatus,
        string? transactionId,
        IReadOnlyList<(string ProductID, string ProductName, decimal Price, int Quantity)> items)
    {
        var orderID = $"ORD-{Guid.NewGuid():N}".ToUpperInvariant();
        var now = DateTime.UtcNow;
        var total = items.Sum(i => i.Price * i.Quantity);

        using var conn = db.Create();
        if (conn is System.Data.Common.DbConnection dbc)
            await dbc.OpenAsync();
        else
            conn.Open();

        using var tx = conn.BeginTransaction();

        const string invSql = """
            SELECT inventoryID AS InventoryID, productID AS ProductID, quantityAvailable AS QuantityAvailable
            FROM Inventory
            WHERE productID = @productID
            FOR UPDATE;
            """;

        foreach (var item in items)
        {
            var inv = await conn.QuerySingleOrDefaultAsync<(string InventoryID, string ProductID, int QuantityAvailable)>(
                invSql, new { productID = item.ProductID }, tx);

            if (inv.InventoryID is null)
            {
                tx.Rollback();
                throw new InvalidOperationException($"No inventory row for product {item.ProductID}.");
            }

            if (inv.QuantityAvailable < item.Quantity)
            {
                tx.Rollback();
                throw new InvalidOperationException($"Insufficient stock for product {item.ProductID}.");
            }

            const string updateInv = """
                UPDATE Inventory
                SET quantityAvailable = quantityAvailable - @qty
                WHERE inventoryID = @inventoryID;
                """;
            await conn.ExecuteAsync(updateInv, new { qty = item.Quantity, inventoryID = inv.InventoryID }, tx);

            const string updateProduct = """
                UPDATE Product
                SET stockLevel = GREATEST(stockLevel - @qty, 0)
                WHERE productID = @productID;
                """;
            await conn.ExecuteAsync(updateProduct, new { qty = item.Quantity, productID = item.ProductID }, tx);

            const string audit = """
                INSERT INTO Inventory_Audit (inventoryID, action, deltaQuantity, note, createdAt)
                VALUES (@inventoryID, 'DEDUCT', @delta, @note, @createdAt);
                """;
            await conn.ExecuteAsync(audit, new
            {
                inventoryID = inv.InventoryID,
                delta = -item.Quantity,
                note = $"Order {orderID} ({transactionId ?? paymentMethod})",
                createdAt = now
            }, tx);
        }

        const string insertOrder = """
            INSERT INTO "Order" (orderID, email, orderDate, totalPrice, orderStatus, paymentMethod, paymentStatus, creditStatus)
            VALUES (@orderID, @email, @orderDate, @totalPrice, 'Shipped', @paymentMethod, @paymentStatus, NULL);
            """;
        await conn.ExecuteAsync(insertOrder, new
        {
            orderID,
            email = customerEmail,
            orderDate = now,
            totalPrice = total,
            paymentMethod,
            paymentStatus
        }, tx);

        const string insertItem = """
            INSERT INTO Order_Item (orderID, productID, quantity, subtotal)
            VALUES (@orderID, @productID, @quantity, @subtotal);
            """;

        foreach (var item in items)
        {
            await conn.ExecuteAsync(insertItem, new
            {
                orderID,
                productID = item.ProductID,
                quantity = item.Quantity,
                subtotal = item.Price * item.Quantity
            }, tx);
        }

        tx.Commit();
        return orderID;
    }

    public async Task<IReadOnlyList<OrderResponse>> ListMine(string email)
    {
        const string sqlOrders = """
            SELECT
              o.orderID AS OrderID,
              o.orderDate AS OrderDate,
              o.totalPrice AS TotalPrice,
              o.orderStatus AS OrderStatus,
              o.paymentMethod AS PaymentMethod,
              o.paymentStatus AS PaymentStatus,
              o.creditStatus AS CreditStatus
            FROM "Order" o
            WHERE o.email = @email
            ORDER BY o.orderDate DESC;
            """;

        const string sqlItems = """
            SELECT
              oi.orderID AS OrderID,
              oi.productID AS ProductID,
              p.name AS Name,
              oi.quantity AS Quantity,
              oi.subtotal AS Subtotal
            FROM Order_Item oi
            JOIN Product p ON p.productID = oi.productID
            WHERE oi.orderID = ANY(@orderIDs)
            ORDER BY p.name ASC;
            """;

        using var conn = db.Create();
        var headers = (await conn.QueryAsync<OrderHeaderRow>(sqlOrders, new { email })).ToList();
        if (headers.Count == 0) return Array.Empty<OrderResponse>();

        var items = (await conn.QueryAsync<(string OrderID, string ProductID, string Name, int Quantity, decimal Subtotal)>(
            sqlItems, new { orderIDs = headers.Select(o => o.OrderID).ToArray() }))
            .ToList();

        var grouped = items.GroupBy(i => i.OrderID).ToDictionary(
            g => g.Key,
            g => (IReadOnlyList<OrderItemResponse>)g.Select(x => new OrderItemResponse(x.ProductID, x.Name, x.Quantity, x.Subtotal)).ToList()
        );

        return headers.Select(h => new OrderResponse
        {
            OrderID = h.OrderID,
            OrderDate = h.OrderDate,
            TotalPrice = h.TotalPrice,
            OrderStatus = h.OrderStatus,
            PaymentMethod = h.PaymentMethod,
            PaymentStatus = h.PaymentStatus,
            CreditStatus = h.CreditStatus,
            ShippingTrackingNumber = ShippingInfo.TrackingNumber(h.OrderID),
            Items = grouped.TryGetValue(h.OrderID, out var its) ? its : Array.Empty<OrderItemResponse>()
        }).ToList();
    }

    public async Task<IReadOnlyList<RecentOrderRow>> ListAllOrders(int limit = 50)
    {
        const string sql = """
            SELECT
              orderID AS OrderID,
              orderDate AS OrderDate,
              totalPrice AS TotalPrice,
              orderStatus AS OrderStatus,
              paymentMethod AS PaymentMethod,
              email AS Email
            FROM "Order"
            ORDER BY orderDate DESC
            LIMIT @limit;
            """;

        using var conn = db.Create();
        var rows = await conn.QueryAsync<RecentOrderRow>(sql, new { limit });
        return rows.ToList();
    }

}

