using System.Data;
using Dapper;
using Oms.Api.Data;

namespace Oms.Api.Catalog;

public sealed record CategoryRow(string Name, string? NameAr, int ProductCount);

/// <summary>
/// Product categories managed by the admin (English name + optional Arabic name).
/// Products keep the category name in product.category; this table is the list the store shows.
/// </summary>
public sealed class CategoryRepository(IDbConnectionFactory db)
{
    public enum DeleteResult { Deleted, NotFound, HasProducts, MoveTargetMissing }

    public static async Task EnsureSchemaAsync(WebApplication app)
    {
        var factory = app.Services.GetRequiredService<IDbConnectionFactory>();
        using var conn = factory.Create();
        await conn.ExecuteAsync("""
            CREATE TABLE IF NOT EXISTS category (
              name VARCHAR(100) PRIMARY KEY,
              namear VARCHAR(100) NULL,
              createdat TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            -- Every category already used by a product must be in the list.
            INSERT INTO category (name)
            SELECT DISTINCT category FROM product WHERE category IS NOT NULL AND category <> ''
            ON CONFLICT (name) DO NOTHING;

            -- Arabic names for the store's original categories (only where none is set yet).
            UPDATE category SET namear = CASE
                WHEN lower(name) LIKE '%power%' THEN 'باور بانك'
                WHEN lower(name) LIKE '%charg%' THEN 'الشواحن'
                WHEN lower(name) LIKE '%ear%' OR lower(name) LIKE '%head%' THEN 'السماعات'
                WHEN lower(name) LIKE '%case%' OR lower(name) LIKE '%cover%' THEN 'الكفرات'
                ELSE namear END
            WHERE namear IS NULL;
            """);
    }

    public async Task<IReadOnlyList<CategoryRow>> List()
    {
        using var conn = db.Create();
        var rows = await conn.QueryAsync<CategoryRow>("""
            SELECT c.name AS Name, c.namear AS NameAr, COUNT(p.productid)::int AS ProductCount
            FROM category c
            LEFT JOIN product p ON p.category = c.name
            GROUP BY c.name, c.namear
            ORDER BY c.name;
            """);
        return rows.ToList();
    }

    /// <summary>Adds a category. Returns false if one with the same name (any letter case) exists.</summary>
    public async Task<bool> Add(string name, string? nameAr)
    {
        using var conn = db.Create();
        var exists = await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM category WHERE lower(name) = lower(@name);", new { name });
        if (exists > 0) return false;
        await conn.ExecuteAsync(
            "INSERT INTO category (name, namear) VALUES (@name, @nameAr);", new { name, nameAr });
        return true;
    }

    public async Task<bool> UpdateArabicName(string name, string? nameAr)
    {
        using var conn = db.Create();
        var n = await conn.ExecuteAsync(
            "UPDATE category SET namear = @nameAr WHERE name = @name;", new { name, nameAr });
        return n > 0;
    }

    /// <summary>Makes sure a product's category is in the list (used when products are saved).</summary>
    public static Task EnsureExists(IDbConnection conn, string name, IDbTransaction? tx = null) =>
        conn.ExecuteAsync("INSERT INTO category (name) VALUES (@name) ON CONFLICT (name) DO NOTHING;", new { name }, tx);

    /// <summary>
    /// Deletes a category. If products still use it, they are moved to <paramref name="moveTo"/>;
    /// without a target the delete is refused.
    /// </summary>
    public async Task<(DeleteResult Result, int ProductCount)> Delete(string name, string? moveTo)
    {
        using var conn = db.Create();
        conn.Open();
        using var tx = conn.BeginTransaction(IsolationLevel.ReadCommitted);

        var exists = await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM category WHERE name = @name;", new { name }, tx);
        if (exists == 0)
        {
            tx.Rollback();
            return (DeleteResult.NotFound, 0);
        }

        var count = await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM product WHERE category = @name;", new { name }, tx);

        if (count > 0)
        {
            if (string.IsNullOrWhiteSpace(moveTo) || moveTo == name)
            {
                tx.Rollback();
                return (DeleteResult.HasProducts, count);
            }
            var targetExists = await conn.ExecuteScalarAsync<int>(
                "SELECT COUNT(1) FROM category WHERE name = @moveTo;", new { moveTo }, tx);
            if (targetExists == 0)
            {
                tx.Rollback();
                return (DeleteResult.MoveTargetMissing, count);
            }
            await conn.ExecuteAsync(
                "UPDATE product SET category = @moveTo WHERE category = @name;", new { moveTo, name }, tx);
        }

        await conn.ExecuteAsync("DELETE FROM category WHERE name = @name;", new { name }, tx);
        tx.Commit();
        return (DeleteResult.Deleted, count);
    }
}
