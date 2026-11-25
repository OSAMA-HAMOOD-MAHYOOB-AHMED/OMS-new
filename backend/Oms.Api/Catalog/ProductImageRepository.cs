using System.Data;
using Dapper;
using Oms.Api.Data;

namespace Oms.Api.Catalog;

/// <summary>
/// Product photos uploaded by the admin. Stored in Postgres (not on disk) because the
/// hosting disk is wiped on every deploy/restart. Served at /api/products/{id}/image.
/// </summary>
public sealed class ProductImageRepository(IDbConnectionFactory db)
{
    public const int MaxBytes = 5 * 1024 * 1024;

    public static async Task EnsureSchemaAsync(WebApplication app)
    {
        var db = app.Services.GetRequiredService<IDbConnectionFactory>();
        using var conn = db.Create();
        await conn.ExecuteAsync("""
            CREATE TABLE IF NOT EXISTS product_image (
              productid VARCHAR(50) PRIMARY KEY REFERENCES product(productid) ON DELETE CASCADE,
              contenttype VARCHAR(50) NOT NULL,
              data BYTEA NOT NULL,
              updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """);
    }

    /// <summary>Returns "image/jpeg" | "image/png" | "image/webp" from the file's magic bytes, or null.</summary>
    public static string? DetectImageType(ReadOnlySpan<byte> b)
    {
        if (b.Length >= 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF) return "image/jpeg";
        if (b.Length >= 8 && b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47 &&
            b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) return "image/png";
        if (b.Length >= 12 && b[0] == (byte)'R' && b[1] == (byte)'I' && b[2] == (byte)'F' && b[3] == (byte)'F' &&
            b[8] == (byte)'W' && b[9] == (byte)'E' && b[10] == (byte)'B' && b[11] == (byte)'P') return "image/webp";
        return null;
    }

    public static string ImageUrlFor(string productID, long version) =>
        $"/api/products/{Uri.EscapeDataString(productID)}/image?v={version}";

    /// <summary>Saves the photo and points the product at it. Returns the new image URL, or null if the product doesn't exist.</summary>
    public async Task<string?> Save(string productID, string contentType, byte[] data)
    {
        using var conn = db.Create();
        conn.Open();
        using var tx = conn.BeginTransaction(IsolationLevel.ReadCommitted);

        var exists = await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM product WHERE productid = @productID;", new { productID }, tx);
        if (exists == 0)
        {
            tx.Rollback();
            return null;
        }

        await conn.ExecuteAsync("""
            INSERT INTO product_image (productid, contenttype, data, updatedat)
            VALUES (@productID, @contentType, @data, NOW())
            ON CONFLICT (productid) DO UPDATE SET
              contenttype = EXCLUDED.contenttype,
              data = EXCLUDED.data,
              updatedat = NOW();
            """, new { productID, contentType, data }, tx);

        // A new version number in the URL makes browsers and the app fetch the new photo.
        var url = ImageUrlFor(productID, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
        await conn.ExecuteAsync(
            "UPDATE product SET imageurl = @url WHERE productid = @productID;", new { url, productID }, tx);

        tx.Commit();
        return url;
    }

    public async Task<(string ContentType, byte[] Data)?> Get(string productID)
    {
        using var conn = db.Create();
        var row = await conn.QueryFirstOrDefaultAsync<(string ContentType, byte[] Data)?>(
            "SELECT contenttype AS ContentType, data AS Data FROM product_image WHERE productid = @productID;",
            new { productID });
        return row;
    }
}
