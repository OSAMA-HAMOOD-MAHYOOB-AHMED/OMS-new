namespace Oms.Api.Orders;

public sealed record CheckoutItem(string ProductID, int Quantity);

public sealed record CheckoutRequest(
    string PaymentMethod,
    IReadOnlyList<CheckoutItem> Items,
    Oms.Api.Payments.PaymentDetails? PaymentDetails
);

public sealed record CheckoutResponse(
    string OrderID,
    decimal TotalPrice,
    string PaymentMethod,
    string? TransactionId,
    string ShippingCarrier,
    string ShippingService,
    decimal ShippingCost,
    string ShippingCostLabel,
    string ShippingEstimatedDelivery,
    string ShippingTrackingNumber
);

public sealed record OrderItemResponse(string ProductID, string Name, int Quantity, decimal Subtotal);

public sealed class OrderResponse
{
    public required string OrderID { get; init; }
    public DateTime OrderDate { get; init; }
    public decimal TotalPrice { get; init; }
    public required string OrderStatus { get; init; }
    public required string PaymentMethod { get; init; }
    public string? PaymentStatus { get; init; }
    public string? CreditStatus { get; init; }
    public string ShippingCarrier { get; init; } = ShippingInfo.Carrier;
    public string ShippingService { get; init; } = ShippingInfo.Service;
    public decimal ShippingCost { get; init; } = ShippingInfo.Cost;
    public string ShippingCostLabel { get; init; } = ShippingInfo.CostLabel;
    public string ShippingEstimatedDelivery { get; init; } = ShippingInfo.EstimatedDelivery;
    public string ShippingTrackingNumber { get; init; } = "";
    public required IReadOnlyList<OrderItemResponse> Items { get; init; }
}

internal sealed class OrderHeaderRow
{
    public required string OrderID { get; init; }
    public DateTime OrderDate { get; init; }
    public decimal TotalPrice { get; init; }
    public required string OrderStatus { get; init; }
    public required string PaymentMethod { get; init; }
    public string? PaymentStatus { get; init; }
    public string? CreditStatus { get; init; }
}

