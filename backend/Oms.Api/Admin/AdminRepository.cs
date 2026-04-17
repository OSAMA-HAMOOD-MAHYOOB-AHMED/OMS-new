using Dapper;
using Oms.Api.Data;
using Oms.Api.Models;

namespace Oms.Api.Admin;

public sealed class AdminRepository(IDbConnectionFactory db)
{
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
        return (await conn.QueryAsync<AdminCustomerRow>(sql, new { q = string.IsNullOrWhiteSpace(q) ? null : q })).ToList();
    }
}

