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
              p.productID AS ProductID,
              name AS Name,
              category AS Category,
              price AS Price,
              stockLevel AS StockLevel,
              description AS Description,
              imageUrl AS ImageUrl,
              compareatprice AS CompareAtPrice,
              specs AS Specs,
              createdat AS CreatedAt,
              COALESCE(r.rating, 0) AS Rating,
              COALESCE(r.reviews, 0) AS ReviewCount,
              COALESCE(s.sold, 0) AS SoldCount,
              ARRAY(
                SELECT COALESCE(ph.externalurl, '/api/products/' || p.productid || '/photos/' || ph.photoid)
                FROM product_photo ph WHERE ph.productid = p.productid
                ORDER BY ph.sortorder, ph.photoid
              ) AS Gallery,
              ARRAY(
                SELECT ph.photoid FROM product_photo ph WHERE ph.productid = p.productid
                ORDER BY ph.sortorder, ph.photoid
              ) AS GalleryIds
            FROM Product p
            LEFT JOIN (
              SELECT productid, ROUND(AVG(rating)::numeric, 1) AS rating, COUNT(*)::int AS reviews
              FROM product_review GROUP BY productid
            ) r ON r.productid = p.productid
            LEFT JOIN (
              SELECT oi.productid, SUM(oi.quantity)::int AS sold
              FROM order_item oi JOIN "Order" o ON o.orderid = oi.orderid
              WHERE o.orderstatus NOT ILIKE 'cancel%'
              GROUP BY oi.productid
            ) s ON s.productid = p.productid
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
              p.productID AS ProductID,
              name AS Name,
              category AS Category,
              price AS Price,
              stockLevel AS StockLevel,
              description AS Description,
              imageUrl AS ImageUrl,
              compareatprice AS CompareAtPrice,
              specs AS Specs,
              createdat AS CreatedAt,
              COALESCE(r.rating, 0) AS Rating,
              COALESCE(r.reviews, 0) AS ReviewCount,
              COALESCE(s.sold, 0) AS SoldCount,
              ARRAY(
                SELECT COALESCE(ph.externalurl, '/api/products/' || p.productid || '/photos/' || ph.photoid)
                FROM product_photo ph WHERE ph.productid = p.productid
                ORDER BY ph.sortorder, ph.photoid
              ) AS Gallery,
              ARRAY(
                SELECT ph.photoid FROM product_photo ph WHERE ph.productid = p.productid
                ORDER BY ph.sortorder, ph.photoid
              ) AS GalleryIds
            FROM Product p
            LEFT JOIN (
              SELECT productid, ROUND(AVG(rating)::numeric, 1) AS rating, COUNT(*)::int AS reviews
              FROM product_review GROUP BY productid
            ) r ON r.productid = p.productid
            LEFT JOIN (
              SELECT oi.productid, SUM(oi.quantity)::int AS sold
              FROM order_item oi JOIN "Order" o ON o.orderid = oi.orderid
              WHERE o.orderstatus NOT ILIKE 'cancel%'
              GROUP BY oi.productid
            ) s ON s.productid = p.productid
            WHERE p.productID = @productID
            LIMIT 1;
            """;

        using var conn = db.Create();
        return await conn.QuerySingleOrDefaultAsync<ProductRow>(sql, new { productID });
    }
}

