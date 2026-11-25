using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Models;

namespace Oms.Api.Catalog;

[ApiController]
[Route("api/products")]
public sealed class ProductsController(ProductRepository products, ProductImageRepository images) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<ProductRow>>> List()
    {
        var rows = await products.List();
        return Ok(rows);
    }

    [HttpGet("{productID}")]
    [AllowAnonymous]
    public async Task<ActionResult<ProductRow>> Get([FromRoute] string productID)
    {
        var row = await products.Get(productID);
        return row is null ? NotFound() : Ok(row);
    }

    /// <summary>Product photo uploaded by the admin (public, cacheable; the URL carries a version).</summary>
    [HttpGet("{productID}/image")]
    [AllowAnonymous]
    public async Task<IActionResult> Image([FromRoute] string productID)
    {
        var img = await images.Get(productID);
        if (img is null) return NotFound();
        Response.Headers.CacheControl = "public, max-age=604800";
        return File(img.Value.Data, img.Value.ContentType);
    }
}
