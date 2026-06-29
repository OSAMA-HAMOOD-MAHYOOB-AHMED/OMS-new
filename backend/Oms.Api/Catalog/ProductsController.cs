using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Models;

namespace Oms.Api.Catalog;

[ApiController]
[Route("api/products")]
public sealed class ProductsController(ProductRepository products) : ControllerBase
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
}

