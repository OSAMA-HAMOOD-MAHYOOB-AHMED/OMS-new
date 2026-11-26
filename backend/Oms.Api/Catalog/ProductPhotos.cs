using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Data;
using Oms.Api.Models;

namespace Oms.Api.Catalog;

public sealed record ProductPhotoOrderRequest(IReadOnlyList<long>? PhotoIds);

/// <summary>
/// Extra product photos for the gallery (the main photo stays product.imageurl). Stored in Postgres
/// like the main photo, because the hosting disk is wiped on every deploy.
/// </summary>
public sealed class ProductPhotoRepository(IDbConnectionFactory db)
{
    public const int MaxPhotos = 10;

    public static async Task EnsureSchemaAsync(WebApplication app)
    {
        var factory = app.Services.GetRequiredService<IDbConnectionFactory>();
        using var conn = factory.Create();
        await conn.ExecuteAsync("""
            CREATE TABLE IF NOT EXISTS product_photo (
              photoid BIGSERIAL PRIMARY KEY,
              productid VARCHAR(50) NOT NULL REFERENCES product(productid) ON DELETE CASCADE,
              contenttype VARCHAR(50) NOT NULL,
              data BYTEA NOT NULL,
              sortorder INT NOT NULL DEFAULT 0,
              createdat TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS ix_product_photo_product ON product_photo (productid, sortorder);
            """);
    }

    public static string UrlFor(string productId, long photoId) =>
        $"/api/products/{Uri.EscapeDataString(productId)}/photos/{photoId}";

    /// <summary>Adds a photo at the end. Returns its id, null if the product is missing, or -1 when full.</summary>
    public async Task<long?> Add(string productId, string contentType, byte[] data)
    {
        using var conn = db.Create();
        var exists = await conn.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM product WHERE productid = @productId;", new { productId });
        if (exists == 0) return null;
        var count = await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM product_photo WHERE productid = @productId;", new { productId });
        if (count >= MaxPhotos) return -1;

        return await conn.ExecuteScalarAsync<long>("""
            INSERT INTO product_photo (productid, contenttype, data, sortorder)
            VALUES (@productId, @contentType, @data,
                    COALESCE((SELECT MAX(sortorder) + 1 FROM product_photo WHERE productid = @productId), 0))
            RETURNING photoid;
            """, new { productId, contentType, data });
    }

    public async Task<(string ContentType, byte[] Data)?> Get(string productId, long photoId)
    {
        using var conn = db.Create();
        return await conn.QueryFirstOrDefaultAsync<(string ContentType, byte[] Data)?>(
            "SELECT contenttype AS ContentType, data AS Data FROM product_photo WHERE productid = @productId AND photoid = @photoId;",
            new { productId, photoId });
    }

    public async Task<bool> Delete(string productId, long photoId)
    {
        using var conn = db.Create();
        return await conn.ExecuteAsync(
            "DELETE FROM product_photo WHERE productid = @productId AND photoid = @photoId;", new { productId, photoId }) > 0;
    }

    /// <summary>Saves the order the admin arranged (ids not listed keep their place after the listed ones).</summary>
    public async Task Reorder(string productId, IReadOnlyList<long> photoIds)
    {
        using var conn = db.Create();
        for (var i = 0; i < photoIds.Count; i++)
        {
            await conn.ExecuteAsync(
                "UPDATE product_photo SET sortorder = @i WHERE productid = @productId AND photoid = @id;",
                new { i, productId, id = photoIds[i] });
        }
    }
}

[ApiController]
public sealed class ProductPhotosController(ProductPhotoRepository photos) : ControllerBase
{
    [HttpGet("api/products/{productId}/photos/{photoId:long}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get([FromRoute] string productId, [FromRoute] long photoId)
    {
        var photo = await photos.Get(productId, photoId);
        if (photo is null) return NotFound();
        // A photo never changes under the same id (a new upload gets a new id), so cache it for long.
        Response.Headers.CacheControl = "public, max-age=2592000, immutable";
        return File(photo.Value.Data, photo.Value.ContentType);
    }

    [HttpPost("api/admin/products/{productId}/photos")]
    [Authorize(Roles = UserRole.Admin)]
    [RequestSizeLimit(ProductImageRepository.MaxBytes + 512 * 1024)]
    public async Task<IActionResult> Add([FromRoute] string productId, IFormFile? file)
    {
        if (file is null || file.Length == 0) return BadRequest("Choose a photo to upload.");
        if (file.Length > ProductImageRepository.MaxBytes) return BadRequest("The photo is too large. The maximum size is 5 MB.");

        byte[] data;
        using (var ms = new MemoryStream())
        {
            await file.CopyToAsync(ms);
            data = ms.ToArray();
        }
        var contentType = ProductImageRepository.DetectImageType(data);
        if (contentType is null) return BadRequest("Only JPEG, PNG or WebP photos are allowed.");

        var id = await photos.Add(productId, contentType, data);
        if (id is null) return NotFound("Product not found.");
        if (id == -1) return BadRequest($"A product can have up to {ProductPhotoRepository.MaxPhotos} extra photos.");
        return Ok(new { photoId = id, url = ProductPhotoRepository.UrlFor(productId, id.Value) });
    }

    [HttpDelete("api/admin/products/{productId}/photos/{photoId:long}")]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<IActionResult> Delete([FromRoute] string productId, [FromRoute] long photoId) =>
        await photos.Delete(productId, photoId) ? NoContent() : NotFound();

    [HttpPut("api/admin/products/{productId}/photos/order")]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<IActionResult> Reorder([FromRoute] string productId, [FromBody] ProductPhotoOrderRequest req)
    {
        if (req.PhotoIds is null || req.PhotoIds.Count > ProductPhotoRepository.MaxPhotos) return BadRequest("Invalid photo order.");
        await photos.Reorder(productId, req.PhotoIds);
        return NoContent();
    }
}
