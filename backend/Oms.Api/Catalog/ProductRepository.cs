using Dapper;
using Oms.Api.Data;
using Oms.Api.Models;

namespace Oms.Api.Catalog;

public sealed class ProductRepository(IDbConnectionFactory db)
{
    public async Task<IReadOnlyList<ProductRow>> List()
    {
        const string sql = """
            SELECT
              productID AS ProductID,
              name AS Name,
              category AS Category,
              price AS Price,
              stockLevel AS StockLevel,
              description AS Description,
              imageUrl AS ImageUrl
            FROM Product
            ORDER BY name ASC;
            """;

        using var conn = db.Create();
        var rows = await conn.QueryAsync<ProductRow>(sql);
        return rows.ToList();
    }

    public async Task<ProductRow?> Get(string productID)
    {
        const string sql = """
            SELECT
              productID AS ProductID,
              name AS Name,
              category AS Category,
              price AS Price,
              stockLevel AS StockLevel,
              description AS Description,
              imageUrl AS ImageUrl
            FROM Product
            WHERE productID = @productID
            LIMIT 1;
            """;

        using var conn = db.Create();
        return await conn.QuerySingleOrDefaultAsync<ProductRow>(sql, new { productID });
    }
}

