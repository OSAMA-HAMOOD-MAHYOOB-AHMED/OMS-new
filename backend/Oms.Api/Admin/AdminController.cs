using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Catalog;
using Oms.Api.Dashboards;
using Oms.Api.Models;

namespace Oms.Api.Admin;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = UserRole.Admin)]
public sealed class AdminController(AdminRepository admin, DashboardRepository dashboards, ProductImageRepository images) : ControllerBase
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

        if (req.Price < 0)
            return BadRequest("Price can't be negative.");

        if (req.StockLevel < 0)
            return BadRequest("Stock level can't be negative.");

        await admin.UpsertProduct(req);
        return NoContent();
    }

    /// <summary>Upload a product photo (JPEG, PNG or WebP, up to 5 MB) as multipart field "file".</summary>
    [HttpPost("products/{productID}/image")]
    [RequestSizeLimit(ProductImageRepository.MaxBytes + 512 * 1024)]
    public async Task<IActionResult> UploadProductImage([FromRoute] string productID, IFormFile? file)
    {
        if (file is null || file.Length == 0)
            return BadRequest("Choose a photo to upload.");
        if (file.Length > ProductImageRepository.MaxBytes)
            return BadRequest("The photo is too large. The maximum size is 5 MB.");

        byte[] data;
        using (var ms = new MemoryStream())
        {
            await file.CopyToAsync(ms);
            data = ms.ToArray();
        }

        // Trust the file's bytes, not the name or the type the client sent.
        var contentType = ProductImageRepository.DetectImageType(data);
        if (contentType is null)
            return BadRequest("Only JPEG, PNG or WebP photos are allowed.");

        var url = await images.Save(productID, contentType, data);
        return url is null ? NotFound("Product not found.") : Ok(new { imageUrl = url });
    }

    [HttpDelete("products/{productID}")]
    public async Task<IActionResult> DeleteProduct([FromRoute] string productID)
    {
        var result = await admin.DeleteProduct(productID);
        return result switch
        {
            AdminRepository.DeleteProductResult.NotFound => NotFound("Product not found."),
            AdminRepository.DeleteProductResult.HasOrders => Conflict(
                "This product appears in existing orders, so it can't be deleted. Set its stock to 0 to stop selling it."),
            _ => NoContent()
        };
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

