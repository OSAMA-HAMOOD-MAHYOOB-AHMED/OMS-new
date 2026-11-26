using System.Security.Claims;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Data;

namespace Oms.Api.Invoicing;

[ApiController]
[Route("api/invoices")]
[Authorize]
public sealed class InvoiceController(IDbConnectionFactory db, InvoiceService invoices, InvoiceRepository invoiceRecords) : ControllerBase
{
    [HttpGet("{orderID}")]
    public async Task<ActionResult<InvoiceSummaryResponse>> GetByOrder([FromRoute] string orderID)
    {
        var row = await FindOrCreateInvoice(orderID);
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
            row.CreatedAt,
            data.Discount,
            data.CouponCode));
    }

    [HttpGet("{orderID}/pdf")]
    public async Task<IActionResult> DownloadPdf(
        [FromRoute] string orderID,
        [FromQuery] string? currencyCode = null,
        [FromQuery] decimal? rate = null)
    {
        var row = await FindOrCreateInvoice(orderID);
        if (row is null) return NotFound();

        var pdf = await invoices.GeneratePdf(orderID, currencyCode ?? "USD", rate ?? 1m);
        return File(pdf, "application/pdf", $"invoice-{orderID}.pdf");
    }

    /// <summary>
    /// The invoice record for an order the signed-in customer owns (any order for the admin).
    /// Access follows the order itself: orders whose invoice record was never saved (for example
    /// when sending the invoice failed at checkout) get one now instead of showing "not found".
    /// </summary>
    private async Task<InvoiceMetaRow?> FindOrCreateInvoice(string orderID)
    {
        var email = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email)) return null;
        var isAdmin = User.IsInRole(Oms.Api.Models.UserRole.Admin);

        using var conn = db.Create();
        var owner = await conn.QuerySingleOrDefaultAsync<string?>(
            """SELECT email FROM "Order" WHERE orderID = @orderID LIMIT 1;""", new { orderID });
        if (owner is null) return null;
        if (!isAdmin && !string.Equals(owner, email, StringComparison.OrdinalIgnoreCase)) return null;

        const string findSql = """
            SELECT
              invoiceID AS InvoiceId,
              orderID AS OrderId,
              email AS Email,
              subject AS Subject,
              createdAt AS CreatedAt
            FROM Invoice
            WHERE orderID = @orderID
            ORDER BY invoiceID DESC
            LIMIT 1;
            """;
        var row = await conn.QuerySingleOrDefaultAsync<InvoiceMetaRow>(findSql, new { orderID });
        if (row is not null) return row;

        var data = await invoices.LoadDocumentData(orderID);
        if (data is null) return null;
        var subject = $"Invoice for Order {orderID}";
        await invoiceRecords.Create(orderID, owner, subject, InvoiceService.BuildTextSummary(data));
        return await conn.QuerySingleOrDefaultAsync<InvoiceMetaRow>(findSql, new { orderID });
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
