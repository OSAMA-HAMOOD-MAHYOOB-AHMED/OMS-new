namespace Oms.Api.Inventory;

public sealed class InventoryRow
{
    public required string InventoryID { get; init; }
    public required string ProductID { get; init; }
    public required string ProductName { get; init; }
    public required string Location { get; init; }
    public int QuantityAvailable { get; init; }
    public int QuantityReserved { get; init; }
    public DateTime? LastCheckupDate { get; init; }
}

public sealed record ReceiveStockRequest(string ProductID, int Quantity, string? Note);

public sealed record CheckupRequest(string InventoryID, string? Note);

public sealed record InventoryAuditRow(
    long AuditID,
    string InventoryID,
    string Action,
    int DeltaQuantity,
    string? Note,
    DateTime CreatedAt
);

