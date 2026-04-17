using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Catalog;

namespace Oms.Api.Orders;

[ApiController]
[Route("api/orders")]
public sealed class OrdersController(ProductRepository products, OrderRepository orders) : ControllerBase
{
    [HttpPost("checkout")]
    [Authorize(Roles = "Customer")]
    public async Task<ActionResult<CheckoutResponse>> Checkout([FromBody] CheckoutRequest req)
    {
        if (!string.Equals(req.PaymentMethod, "Cash", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Phase 1 supports only Cash checkout.");

        if (req.Items is null || req.Items.Count == 0)
            return BadRequest("Cart is empty.");

        var email = User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? User.FindFirstValue("sub")
                    ?? User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized();

        var expanded = new List<(string ProductID, string ProductName, decimal Price, int Quantity)>();
        foreach (var i in req.Items)
        {
            if (i.Quantity <= 0) return BadRequest("Invalid quantity.");
            var p = await products.Get(i.ProductID);
            if (p is null) return BadRequest($"Unknown product: {i.ProductID}");
            expanded.Add((p.ProductID, p.Name, p.Price, i.Quantity));
        }

        try
        {
            var orderID = await orders.CreateCashOrder(email, expanded);
            return Ok(new CheckoutResponse(orderID));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("mine")]
    [Authorize(Roles = "Customer")]
    public async Task<ActionResult<IReadOnlyList<OrderResponse>>> Mine()
    {
        var email = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized();

        var rows = await orders.ListMine(email);
        return Ok(rows);
    }
}

