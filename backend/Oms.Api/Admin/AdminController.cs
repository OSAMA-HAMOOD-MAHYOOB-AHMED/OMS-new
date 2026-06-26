using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Dashboards;
using Oms.Api.Models;

namespace Oms.Api.Admin;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = UserRole.Admin)]
public sealed class AdminController(AdminRepository admin, DashboardRepository dashboards) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<SalesDashboardResponse>> Dashboard()
    {
        // Reuse sales dashboard response for basic admin dashboard.
        var res = await dashboards.Sales();
        return Ok(res);
    }

    [HttpGet("products")]
    public async Task<ActionResult<IReadOnlyList<ProductRow>>> Products()
    {
        var rows = await admin.ListProducts();
        return Ok(rows);
    }

    [HttpPost("products")]
    public async Task<IActionResult> UpsertProduct([FromBody] ProductUpsertRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.ProductID) ||
            string.IsNullOrWhiteSpace(req.Name) ||
            string.IsNullOrWhiteSpace(req.Category))
            return BadRequest("Missing fields.");

        await admin.UpsertProduct(req);
        return NoContent();
    }

    [HttpDelete("products/{productID}")]
    public async Task<IActionResult> DeleteProduct([FromRoute] string productID)
    {
        await admin.DeleteProduct(productID);
        return NoContent();
    }

    [HttpGet("customers")]
    public async Task<ActionResult<IReadOnlyList<AdminCustomerRow>>> Customers([FromQuery] string? q = null)
    {
        var rows = await admin.ListCustomers(q);
        return Ok(rows);
    }

    [HttpPatch("orders/{orderID}/status")]
    [Authorize(Roles = $"{UserRole.Admin},{UserRole.RetailSalesperson},{UserRole.WarehouseManager}")]
    public async Task<IActionResult> UpdateOrderStatus([FromRoute] string orderID, [FromBody] UpdateOrderStatusRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Status) || !OrderStatus.Valid.Contains(req.Status))
            return BadRequest($"Invalid status. Valid values: {string.Join(", ", OrderStatus.Valid)}");

        var found = await admin.UpdateOrderStatus(orderID, req.Status);
        if (!found) return NotFound("Order not found.");
        return NoContent();
    }

    [HttpGet("reports/sales")]
    public async Task<ActionResult<AdminSalesReportResponse>> SalesReport([FromQuery] int dailyLimit = 60)
    {
        var res = await admin.SalesReport(dailyLimit);
        return Ok(res);
    }
}

