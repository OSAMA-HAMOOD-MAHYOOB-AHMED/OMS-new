using Dapper;
using Oms.Api.Data;

namespace Oms.Api.Invoicing;

public sealed class InvoiceService(IDbConnectionFactory db, InvoiceRepository invoices, IEmailSender emailSender)
{
    public async Task GenerateAndSend(string orderID, string email)
    {
        var body = await BuildInvoiceBody(orderID);
        var subject = $"Invoice for Order {orderID}";

        await invoices.Create(orderID, email, subject, body);
        await emailSender.Send(email, subject, body);
    }

    private async Task<string> BuildInvoiceBody(string orderID)
    {
        const string headerSql = """
            SELECT
              o.orderID AS OrderID,
              o.orderDate AS OrderDate,
              o.totalPrice AS TotalPrice,
              o.orderStatus AS OrderStatus,
              o.paymentMethod AS PaymentMethod,
              o.creditStatus AS CreditStatus,
              u.name AS CustomerName,
              u.email AS Email,
              u.address AS Address
            FROM `Order` o
            JOIN `User` u ON u.email = o.email
            WHERE o.orderID = @orderID
            LIMIT 1;
            """;

        const string itemsSql = """
            SELECT
              oi.productID AS ProductID,
              p.name AS Name,
              oi.quantity AS Quantity,
              oi.subtotal AS Subtotal
            FROM Order_Item oi
            JOIN Product p ON p.productID = oi.productID
            WHERE oi.orderID = @orderID
            ORDER BY p.name ASC;
            """;

        using var conn = db.Create();
        var header = await conn.QuerySingleOrDefaultAsync<dynamic>(headerSql, new { orderID });
        if (header is null) return $"Invoice for {orderID}\n\n(Unable to load order details.)";

        var items = (await conn.QueryAsync<dynamic>(itemsSql, new { orderID })).ToList();

        var lines = new List<string>
        {
            "Al-Wakeel Al-Shamel OMS",
            $"Invoice: {orderID}",
            $"Date: {header.OrderDate:u}",
            $"Customer: {header.CustomerName} ({header.Email})",
            $"Address: {header.Address}",
            "",
            $"Payment: {header.PaymentMethod}  CreditStatus: {header.CreditStatus ?? "—"}",
            $"OrderStatus: {header.OrderStatus}",
            "",
            "Items:"
        };

        foreach (var it in items)
            lines.Add($"- {it.Name} x{it.Quantity} = {Convert.ToDecimal(it.Subtotal):0.00}");

        lines.Add("");
        lines.Add($"Total: {Convert.ToDecimal(header.TotalPrice):0.00}");
        return string.Join('\n', lines);
    }
}

