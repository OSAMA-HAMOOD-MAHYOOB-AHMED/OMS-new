using System.Security.Claims;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Data;

namespace Oms.Api.Invoicing;

[ApiController]
[Route("api/invoices")]
[Authorize]
public sealed class InvoiceController(IDbConnectionFactory db) : ControllerBase
{
    [HttpGet("{orderID}")]
    public async Task<ActionResult<object>> GetByOrder([FromRoute] string orderID)
    {
        var email = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();

        // Customer can only access own invoices; Admin can access any.
        var isAdmin = User.IsInRole(Oms.Api.Models.UserRole.Admin);

        const string sql = """
            SELECT
              invoiceID AS InvoiceID,
              orderID AS OrderID,
              email AS Email,
              subject AS Subject,
              body AS Body,
              createdAt AS CreatedAt
            FROM Invoice
            WHERE orderID = @orderID
              AND (@isAdmin = 1 OR email = @email)
            ORDER BY invoiceID DESC
            LIMIT 1;
            """;

        using var conn = db.Create();
        var row = await conn.QuerySingleOrDefaultAsync<dynamic>(sql, new { orderID, email, isAdmin = isAdmin ? 1 : 0 });
        if (row is null) return NotFound();
        return Ok(row);
    }
}

