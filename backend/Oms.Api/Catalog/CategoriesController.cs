using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Oms.Api.Catalog;

[ApiController]
[Route("api/categories")]
public sealed class CategoriesController(CategoryRepository categories) : ControllerBase
{
    /// <summary>The store's category list with product counts (public).</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<CategoryRow>>> List() => Ok(await categories.List());
}
