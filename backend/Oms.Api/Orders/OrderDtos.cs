namespace Oms.Api.Orders;

public sealed record CheckoutItem(string ProductID, int Quantity);

public sealed record CheckoutRequest(string PaymentMethod, IReadOnlyList<CheckoutItem> Items);

public sealed record CheckoutResponse(string OrderID);

public sealed record OrderItemResponse(string ProductID, string Name, int Quantity, decimal Subtotal);

public sealed class OrderResponse
{
    public required string OrderID { get; init; }
    public DateTime OrderDate { get; init; }
    public decimal TotalPrice { get; init; }
    public required string OrderStatus { get; init; }
    public required string PaymentMethod { get; init; }
    public string? CreditStatus { get; init; }
    public required IReadOnlyList<OrderItemResponse> Items { get; init; }
}

internal sealed class OrderHeaderRow
{
    public required string OrderID { get; init; }
    public DateTime OrderDate { get; init; }
    public decimal TotalPrice { get; init; }
    public required string OrderStatus { get; init; }
    public required string PaymentMethod { get; init; }
    public string? CreditStatus { get; init; }
}

