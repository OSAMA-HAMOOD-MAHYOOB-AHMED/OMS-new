using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Oms.Api.Inventory;

[ApiController]
[Route("api/inventory")]
[Authorize(Roles = "Warehouse Manager")]
public sealed class InventoryController(InventoryRepository inventory) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<InventoryRow>>> List()
    {
        var rows = await inventory.List();
        return Ok(rows);
    }

    [HttpPost("receive")]
    public async Task<IActionResult> Receive([FromBody] ReceiveStockRequest req)
    {
        try
        {
            await inventory.ReceiveStock(req.ProductID, req.Quantity, req.Note);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("checkup")]
    public async Task<IActionResult> Checkup([FromBody] CheckupRequest req)
    {
        try
        {
            await inventory.Checkup(req.InventoryID, req.Note);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{inventoryID}/audit")]
    public async Task<ActionResult<IReadOnlyList<InventoryAuditRow>>> Audit([FromRoute] string inventoryID, [FromQuery] int limit = 25)
    {
        var rows = await inventory.Audit(inventoryID, Math.Clamp(limit, 1, 200));
        return Ok(rows);
    }
}

