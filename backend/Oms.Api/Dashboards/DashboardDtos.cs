namespace Oms.Api.Dashboards;

public sealed class SalesDashboardResponse
{
    public int TotalOrders { get; init; }
    public decimal CashRevenue { get; init; }
    public int CashOrders { get; init; }
    public IReadOnlyList<RecentOrderRow> RecentOrders { get; init; } = Array.Empty<RecentOrderRow>();
}

public sealed class WarehouseDashboardResponse
{
    public IReadOnlyList<LowStockRow> LowStock { get; init; } = Array.Empty<LowStockRow>();
    public IReadOnlyList<InventoryAuditFeedRow> RecentInventoryActivity { get; init; } = Array.Empty<InventoryAuditFeedRow>();
}

public sealed class RecentOrderRow
{
    public required string OrderID { get; init; }
    public DateTime OrderDate { get; init; }
    public decimal TotalPrice { get; init; }
    public required string OrderStatus { get; init; }
    public required string PaymentMethod { get; init; }
    public required string Email { get; init; }
}

public sealed class LowStockRow
{
    public required string ProductID { get; init; }
    public required string Name { get; init; }
    public int StockLevel { get; init; }
}

public sealed class InventoryAuditFeedRow
{
    public long AuditID { get; init; }
    public required string InventoryID { get; init; }
    public required string ProductID { get; init; }
    public required string ProductName { get; init; }
    public required string Action { get; init; }
    public int DeltaQuantity { get; init; }
    public string? Note { get; init; }
    public DateTime CreatedAt { get; init; }
}

