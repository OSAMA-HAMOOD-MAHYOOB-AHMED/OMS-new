namespace Oms.Api.Invoicing;

public sealed record InvoiceLineItem(
    string ProductId,
    string Name,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal
);

public sealed record InvoiceDocumentData(
    string OrderId,
    DateTime OrderDate,
    decimal TotalPrice,
    string OrderStatus,
    string PaymentMethod,
    string? PaymentStatus,
    string? TransactionReference,
    string CustomerName,
    string CustomerEmail,
    string CustomerPhone,
    string CustomerAddress,
    string ShippingCarrier,
    string ShippingService,
    decimal ShippingCost,
    string ShippingCostLabel,
    string ShippingEstimatedDelivery,
    string ShippingTrackingNumber,
    IReadOnlyList<InvoiceLineItem> Items
);

public sealed record InvoiceSummaryResponse(
    long InvoiceId,
    string OrderId,
    string Subject,
    string CustomerName,
    string Email,
    DateTime OrderDate,
    decimal TotalPrice,
    string PaymentMethod,
    string? PaymentStatus,
    string OrderStatus,
    string? TransactionReference,
    string ShippingCarrier,
    string ShippingService,
    decimal ShippingCost,
    string ShippingCostLabel,
    string ShippingEstimatedDelivery,
    string ShippingTrackingNumber,
    IReadOnlyList<InvoiceLineItem> Items,
    DateTime CreatedAt
);
