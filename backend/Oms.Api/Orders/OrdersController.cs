using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Catalog;
using Oms.Api.Dashboards;
using Oms.Api.Invoicing;

namespace Oms.Api.Orders;

[ApiController]
[Route("api/orders")]
public sealed class OrdersController(ProductRepository products, OrderRepository orders, InvoiceService invoices) : ControllerBase
{
    [HttpPost("checkout")]
    [Authorize(Roles = "Customer")]
    public async Task<ActionResult<CheckoutResponse>> Checkout([FromBody] CheckoutRequest req)
    {
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
            string orderID;

            if (string.Equals(req.PaymentMethod, "Cash", StringComparison.OrdinalIgnoreCase))
                orderID = await orders.CreateCashOrder(email, expanded);
            else if (string.Equals(req.PaymentMethod, "Credit", StringComparison.OrdinalIgnoreCase))
                orderID = await orders.CreateCreditOrder(email, expanded);
            else
                return BadRequest("Invalid payment method. Use Cash or Credit.");

            await invoices.GenerateAndSend(orderID, email);
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

    [HttpGet]
    [Authorize(Roles = "Retail Salesperson")]
    public async Task<ActionResult<IReadOnlyList<RecentOrderRow>>> ListAll([FromQuery] int limit = 50)
    {
        var rows = await orders.ListAllOrders(Math.Clamp(limit, 1, 200));
        return Ok(rows);
    }

    [HttpPost("status")]
    [Authorize(Roles = "Retail Salesperson")]
    public async Task<IActionResult> UpdateStatus([FromBody] UpdateOrderStatusRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.OrderID) || string.IsNullOrWhiteSpace(req.OrderStatus))
            return BadRequest("Missing fields.");

        try
        {
            await orders.UpdateStatus(req.OrderID, req.OrderStatus);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("credit/decision")]
    [Authorize(Roles = "Retail Salesperson")]
    public async Task<IActionResult> CreditDecision([FromBody] CreditDecisionRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.OrderID))
            return BadRequest("Missing orderID.");

        try
        {
            if (req.Approve)
                await orders.SetCreditStatus(req.OrderID, "Approved", "Placed");
            else
                await orders.SetCreditStatus(req.OrderID, "Rejected", "Credit Rejected");

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}

