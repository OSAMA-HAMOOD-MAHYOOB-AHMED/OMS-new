using Dapper;
using Oms.Api.Data;
using Oms.Api.Orders;

namespace Oms.Api.Invoicing;

public sealed class InvoiceService(
    IDbConnectionFactory db,
    InvoiceRepository invoices,
    InvoicePdfGenerator pdfGenerator,
    IEmailSender emailSender)
{
    public async Task GenerateAndSend(string orderID, string email)
    {
        var data = await LoadDocumentData(orderID)
                   ?? throw new InvalidOperationException($"Order {orderID} not found.");

        var body = BuildTextSummary(data);
        var subject = $"Invoice for Order {orderID}";

        await invoices.Create(orderID, email, subject, body);
        await emailSender.Send(email, subject, body);
    }

    public async Task<(string Body, byte[] Pdf)> GenerateAndStore(string orderID, string email)
    {
        var data = await LoadDocumentData(orderID)
                   ?? throw new InvalidOperationException($"Order {orderID} not found.");

        var body = BuildTextSummary(data);
        var subject = $"Invoice for Order {orderID}";
        var pdf = pdfGenerator.Generate(data);

        await invoices.Create(orderID, email, subject, body);
        return (body, pdf);
    }

    public async Task<byte[]> GeneratePdf(string orderID, string currencyCode = "USD", decimal exchangeRate = 1m)
    {
        var data = await LoadDocumentData(orderID)
                   ?? throw new InvalidOperationException($"Order {orderID} not found.");
        return pdfGenerator.Generate(data, currencyCode, exchangeRate);
    }

    public async Task<InvoiceDocumentData?> LoadDocumentData(string orderID)
    {
        const string headerSql = """
            SELECT
              o.orderID AS OrderId,
              o.orderDate AS OrderDate,
              o.totalPrice AS TotalPrice,
              o.orderStatus AS OrderStatus,
              o.paymentMethod AS PaymentMethod,
              o.paymentStatus AS PaymentStatus,
              u.name AS CustomerName,
              u.email AS CustomerEmail,
              u.phoneNumber AS CustomerPhone,
              u.address AS CustomerAddress
            FROM "Order" o
            JOIN "User" u ON u.email = o.email
            WHERE o.orderID = @orderID
            LIMIT 1;
            """;

        const string itemsSql = """
            SELECT
              oi.productID AS ProductId,
              p.name AS Name,
              oi.quantity AS Quantity,
              oi.subtotal AS Subtotal
            FROM Order_Item oi
            JOIN Product p ON p.productID = oi.productID
            WHERE oi.orderID = @orderID
            ORDER BY p.name ASC;
            """;

        const string txnSql = """
            SELECT note AS Note
            FROM Inventory_Audit
            WHERE note LIKE CONCAT('Order ', @orderID, '%')
            ORDER BY auditID ASC
            LIMIT 1;
            """;

        using var conn = db.Create();
        var header = await conn.QuerySingleOrDefaultAsync<InvoiceHeaderRow>(headerSql, new { orderID });
        if (header is null) return null;

        var itemRows = (await conn.QueryAsync<InvoiceItemRow>(itemsSql, new { orderID })).ToList();
        var txnNote = await conn.QuerySingleOrDefaultAsync<string?>(txnSql, new { orderID });

        var items = itemRows.Select(i =>
        {
            var qty = Math.Max(i.Quantity, 1);
            var unit = i.Subtotal / qty;
            return new InvoiceLineItem(i.ProductId, i.Name, i.Quantity, unit, i.Subtotal);
        }).ToList();

        return new InvoiceDocumentData(
            header.OrderId,
            header.OrderDate,
            header.TotalPrice,
            header.OrderStatus,
            header.PaymentMethod,
            header.PaymentStatus,
            ExtractTransactionReference(txnNote),
            header.CustomerName,
            header.CustomerEmail,
            header.CustomerPhone,
            header.CustomerAddress,
            ShippingInfo.Carrier,
            ShippingInfo.Service,
            ShippingInfo.Cost,
            ShippingInfo.CostLabel,
            ShippingInfo.EstimatedDelivery,
            ShippingInfo.TrackingNumber(header.OrderId),
            items);
    }

    public static string BuildTextSummary(InvoiceDocumentData data)
    {
        var lines = new List<string>
        {
            "Al-Wakeel Al-Shamel OMS",
            $"Invoice: {data.OrderId}",
            $"Date: {data.OrderDate:u}",
            $"Customer: {data.CustomerName} ({data.CustomerEmail})",
            $"Phone: {data.CustomerPhone}",
            $"Address: {data.CustomerAddress}",
            "",
            $"Payment Method: {data.PaymentMethod}",
            $"Payment Status: {data.PaymentStatus ?? "—"}",
            $"Order Status: {data.OrderStatus}",
        };

        if (!string.IsNullOrWhiteSpace(data.TransactionReference))
            lines.Add($"Transaction: {data.TransactionReference}");

        lines.Add("");
        lines.Add($"Shipping: {data.ShippingCarrier} {data.ShippingService} ({data.ShippingCostLabel})");
        lines.Add($"Estimated delivery: {data.ShippingEstimatedDelivery}");
        lines.Add($"Tracking number: {data.ShippingTrackingNumber}");

        lines.Add("");
        lines.Add("Items:");
        foreach (var it in data.Items)
            lines.Add($"- {it.Name} ({it.ProductId}) x{it.Quantity} @ ${it.UnitPrice:F2} = ${it.Subtotal:F2}");

        lines.Add("");
        lines.Add($"Total: ${data.TotalPrice:F2}");
        return string.Join('\n', lines);
    }

    private static string? ExtractTransactionReference(string? auditNote)
    {
        if (string.IsNullOrWhiteSpace(auditNote)) return null;
        var open = auditNote.LastIndexOf('(');
        var close = auditNote.LastIndexOf(')');
        if (open < 0 || close <= open) return null;
        var value = auditNote[(open + 1)..close].Trim();
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    private sealed class InvoiceHeaderRow
    {
        public required string OrderId { get; init; }
        public DateTime OrderDate { get; init; }
        public decimal TotalPrice { get; init; }
        public required string OrderStatus { get; init; }
        public required string PaymentMethod { get; init; }
        public string? PaymentStatus { get; init; }
        public required string CustomerName { get; init; }
        public required string CustomerEmail { get; init; }
        public required string CustomerPhone { get; init; }
        public required string CustomerAddress { get; init; }
    }

    private sealed class InvoiceItemRow
    {
        public required string ProductId { get; init; }
        public required string Name { get; init; }
        public int Quantity { get; init; }
        public decimal Subtotal { get; init; }
    }
}
