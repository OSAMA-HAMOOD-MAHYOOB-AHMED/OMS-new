namespace Oms.Api.Orders;

public static class ShippingInfo
{
    public const string Carrier = "FedEx";
    public const string Service = "FedEx Express";
    public const decimal Cost = 0m;
    public const string CostLabel = "Free";
    public const string EstimatedDelivery = "3–5 business days";

    public static string TrackingNumber(string orderId)
    {
        var compact = new string(orderId.Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();
        if (compact.Length == 0) compact = "000000";
        var tail = compact.Length > 10 ? compact[^10..] : compact;
        return $"FDX{tail}";
    }
}
