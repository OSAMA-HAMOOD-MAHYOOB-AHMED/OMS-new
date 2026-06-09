using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Auth;
using Oms.Api.Catalog;
using Oms.Api.Dashboards;
using Oms.Api.Invoicing;
using Oms.Api.Models;
using Oms.Api.Payments;

namespace Oms.Api.Orders;

[ApiController]
[Route("api/orders")]
public sealed class OrdersController(
    ProductRepository products,
    OrderRepository orders,
    UserRepository users,
    InvoiceService invoices,
    NotificationService notifications,
    PaymentService payments) : ControllerBase
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

        var user = await users.GetByEmail(email);
        if (user is null)
            return Unauthorized();

        if (!user.EmailVerified)
            return BadRequest("Please verify your email before placing an order. Check your inbox or resend the verification link from your profile.");

        var expanded = new List<(string ProductID, string ProductName, decimal Price, int Quantity)>();
        foreach (var i in req.Items)
        {
            if (i.Quantity <= 0) return BadRequest("Invalid quantity.");
            var p = await products.Get(i.ProductID);
            if (p is null) return BadRequest($"Unknown product: {i.ProductID}");
            expanded.Add((p.ProductID, p.Name, p.Price, i.Quantity));
        }

        var total = expanded.Sum(i => i.Price * i.Quantity);

        try
        {
            string orderID;
            string? transactionId = null;

            if (string.Equals(req.PaymentMethod, "Cash", StringComparison.OrdinalIgnoreCase))
            {
                orderID = await orders.CreateCashOrder(email, expanded);
            }
            else if (string.Equals(req.PaymentMethod, "CreditCard", StringComparison.OrdinalIgnoreCase))
            {
                var paymentResult = await payments.ProcessAsync(req.PaymentMethod, req.PaymentDetails ?? new PaymentDetails(null, null), total);
                if (!paymentResult.Success)
                    return BadRequest(paymentResult.ErrorMessage ?? "Payment failed.");

                transactionId = paymentResult.TransactionId;
                orderID = await orders.CreateOnlineOrder(
                    email,
                    req.PaymentMethod,
                    "Completed",
                    paymentResult.TransactionId,
                    expanded);

                var (invoiceBody, invoicePdf) = await invoices.GenerateAndStore(orderID, email);
                await notifications.SendOrderConfirmationWithInvoiceAsync(
                    email, user.Name, orderID, total, req.PaymentMethod, paymentResult.TransactionId, invoiceBody, invoicePdf);

                return Ok(BuildCheckoutResponse(orderID, total, req.PaymentMethod, transactionId));
            }
            else
            {
                return BadRequest("Invalid payment method. Use CreditCard or Cash.");
            }

            var (cashInvoiceBody, cashInvoicePdf) = await invoices.GenerateAndStore(orderID, email);
            await notifications.SendOrderConfirmationWithInvoiceAsync(
                email, user.Name, orderID, total, req.PaymentMethod, null, cashInvoiceBody, cashInvoicePdf);

            return Ok(BuildCheckoutResponse(orderID, total, req.PaymentMethod, transactionId));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private static CheckoutResponse BuildCheckoutResponse(string orderID, decimal total, string paymentMethod, string? transactionId) =>
        new(
            orderID,
            total,
            paymentMethod,
            transactionId,
            ShippingInfo.Carrier,
            ShippingInfo.Service,
            ShippingInfo.Cost,
            ShippingInfo.CostLabel,
            ShippingInfo.EstimatedDelivery,
            ShippingInfo.TrackingNumber(orderID));

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
    [Authorize(Roles = $"{UserRole.RetailSalesperson},{UserRole.Admin}")]
    public async Task<ActionResult<IReadOnlyList<RecentOrderRow>>> ListAll([FromQuery] int limit = 50)
    {
        var rows = await orders.ListAllOrders(Math.Clamp(limit, 1, 200));
        return Ok(rows);
    }

}
