using System.Security.Claims;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Data;

namespace Oms.Api.Invoicing;

[ApiController]
[Route("api/invoices")]
[Authorize]
public sealed class InvoiceController(IDbConnectionFactory db, InvoiceService invoices) : ControllerBase
{
    [HttpGet("{orderID}")]
    public async Task<ActionResult<InvoiceSummaryResponse>> GetByOrder([FromRoute] string orderID)
    {
        var email = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();

        var isAdmin = User.IsInRole(Oms.Api.Models.UserRole.Admin);

        const string sql = """
            SELECT
              invoiceID AS InvoiceId,
              orderID AS OrderId,
              email AS Email,
              subject AS Subject,
              createdAt AS CreatedAt
            FROM Invoice
            WHERE orderID = @orderID
              AND (@isAdmin = 1 OR email = @email)
            ORDER BY invoiceID DESC
            LIMIT 1;
            """;

        using var conn = db.Create();
        var row = await conn.QuerySingleOrDefaultAsync<InvoiceMetaRow>(sql, new { orderID, email, isAdmin = isAdmin ? 1 : 0 });
        if (row is null) return NotFound();

        var data = await invoices.LoadDocumentData(orderID);
        if (data is null) return NotFound();

        return Ok(new InvoiceSummaryResponse(
            row.InvoiceId,
            data.OrderId,
            row.Subject,
            data.CustomerName,
            data.CustomerEmail,
            data.OrderDate,
            data.TotalPrice,
            data.PaymentMethod,
            data.PaymentStatus,
            data.OrderStatus,
            data.TransactionReference,
            data.ShippingCarrier,
            data.ShippingService,
            data.ShippingCost,
            data.ShippingCostLabel,
            data.ShippingEstimatedDelivery,
            data.ShippingTrackingNumber,
            data.Items,
            row.CreatedAt));
    }

    [HttpGet("{orderID}/pdf")]
    public async Task<IActionResult> DownloadPdf(
        [FromRoute] string orderID,
        [FromQuery] string? currencyCode = null,
        [FromQuery] decimal? rate = null)
    {
        var email = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();

        var isAdmin = User.IsInRole(Oms.Api.Models.UserRole.Admin);

        const string sql = """
            SELECT 1
            FROM Invoice
            WHERE orderID = @orderID
              AND (@isAdmin = 1 OR email = @email)
            LIMIT 1;
            """;

        using var conn = db.Create();
        var allowed = await conn.QuerySingleOrDefaultAsync<int?>(sql, new { orderID, email, isAdmin = isAdmin ? 1 : 0 });
        if (allowed is null) return NotFound();

        var pdf = await invoices.GeneratePdf(orderID, currencyCode ?? "USD", rate ?? 1m);
        return File(pdf, "application/pdf", $"invoice-{orderID}.pdf");
    }

    private sealed class InvoiceMetaRow
    {
        public long InvoiceId { get; init; }
        public required string OrderId { get; init; }
        public required string Email { get; init; }
        public required string Subject { get; init; }
        public DateTime CreatedAt { get; init; }
    }
}
