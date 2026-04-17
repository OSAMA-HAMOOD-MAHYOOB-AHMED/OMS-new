using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Oms.Api.Dashboards;

[ApiController]
[Route("api/dashboard")]
public sealed class DashboardController(DashboardRepository dashboards) : ControllerBase
{
    [HttpGet("sales")]
    [Authorize(Roles = "Retail Salesperson")]
    public async Task<ActionResult<SalesDashboardResponse>> Sales()
    {
        var res = await dashboards.Sales();
        return Ok(res);
    }

    [HttpGet("warehouse")]
    [Authorize(Roles = "Warehouse Manager")]
    public async Task<ActionResult<WarehouseDashboardResponse>> Warehouse([FromQuery] int lowStockThreshold = 10)
    {
        var res = await dashboards.Warehouse(lowStockThreshold);
        return Ok(res);
    }
}

