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
              description AS Description
            FROM Product
            ORDER BY name ASC;
            """;
        using var conn = db.Create();
        await OpenAsync(conn);
        return (await conn.QueryAsync<ProductRow>(sql)).ToList();
    }

    public async Task UpsertProduct(ProductUpsertRequest req)
    {
        const string sql = """
            INSERT INTO Product (productID, name, category, price, stockLevel, description)
            VALUES (@productID, @name, @category, @price, @stockLevel, @description)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              category = VALUES(category),
              price = VALUES(price),
              stockLevel = VALUES(stockLevel),
              description = VALUES(description);
            """;
        using var conn = db.Create();
        await OpenAsync(conn);
        await conn.ExecuteAsync(sql, new
        {
            productID = req.ProductID,
            name = req.Name,
            category = req.Category,
            price = req.Price,
            stockLevel = req.StockLevel,
            description = req.Description
        });
    }

    public async Task DeleteProduct(string productID)
    {
        using var conn = db.Create();
        await OpenAsync(conn);
        const string sql = "DELETE FROM Product WHERE productID = @productID;";
        await conn.ExecuteAsync(sql, new { productID });
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
            FROM `User`
            WHERE role = 'Customer'
              AND (@q IS NULL OR email LIKE CONCAT('%', @q, '%') OR name LIKE CONCAT('%', @q, '%'))
            ORDER BY name ASC
            LIMIT 200;
            """;

        using var conn = db.Create();
        await OpenAsync(conn);
        return (await conn.QueryAsync<AdminCustomerRow>(sql, new { q = string.IsNullOrWhiteSpace(q) ? null : q })).ToList();
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
            FROM `Order` o
            GROUP BY DATE(o.orderDate)
            ORDER BY Day DESC
            LIMIT @dailyLimit;
            """;

        const string statusSql = """
            SELECT
              o.orderStatus AS OrderStatus,
              COUNT(*) AS Orders,
              SUM(o.totalPrice) AS Revenue
            FROM `Order` o
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

