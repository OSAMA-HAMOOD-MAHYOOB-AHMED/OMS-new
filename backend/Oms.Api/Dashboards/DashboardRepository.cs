using Dapper;
using Oms.Api.Data;

namespace Oms.Api.Dashboards;

public sealed class DashboardRepository(IDbConnectionFactory db)
{
    public async Task<SalesDashboardResponse> Sales()
    {
        using var conn = db.Create();

        const string totals = """
            SELECT
              COUNT(*) AS TotalOrders,
              SUM(CASE WHEN paymentMethod = 'Cash' THEN totalPrice ELSE 0 END) AS CashRevenue,
              SUM(CASE WHEN paymentMethod = 'Cash' THEN 1 ELSE 0 END) AS CashOrders
            FROM "Order";
            """;

        const string recent = """
            SELECT
              orderID AS OrderID,
              orderDate AS OrderDate,
              totalPrice AS TotalPrice,
              orderStatus AS OrderStatus,
              paymentMethod AS PaymentMethod,
              email AS Email
            FROM "Order"
            ORDER BY orderDate DESC
            LIMIT 10;
            """;

        var t = await conn.QuerySingleAsync<(int TotalOrders, decimal? CashRevenue, int CashOrders)>(totals);
        var rec = (await conn.QueryAsync<RecentOrderRow>(recent)).ToList();

        return new SalesDashboardResponse
        {
            TotalOrders = t.TotalOrders,
            CashRevenue = t.CashRevenue ?? 0m,
            CashOrders = t.CashOrders,
            RecentOrders = rec
        };
    }

    public async Task<WarehouseDashboardResponse> Warehouse(int lowStockThreshold = 10)
    {
        using var conn = db.Create();

        const string low = """
            SELECT
              productID AS ProductID,
              name AS Name,
              stockLevel AS StockLevel
            FROM Product
            WHERE stockLevel <= @threshold
            ORDER BY stockLevel ASC, name ASC
            LIMIT 20;
            """;

        const string activity = """
            SELECT
              a.auditID AS AuditID,
              a.inventoryID AS InventoryID,
              i.productID AS ProductID,
              p.name AS ProductName,
              a.action AS Action,
              a.deltaQuantity AS DeltaQuantity,
              a.note AS Note,
              a.createdAt AS CreatedAt
            FROM Inventory_Audit a
            JOIN Inventory i ON i.inventoryID = a.inventoryID
            JOIN Product p ON p.productID = i.productID
            ORDER BY a.auditID DESC
            LIMIT 15;
            """;

        var lowRows = (await conn.QueryAsync<LowStockRow>(low, new { threshold = lowStockThreshold })).ToList();
        var feed = (await conn.QueryAsync<InventoryAuditFeedRow>(activity)).ToList();

        return new WarehouseDashboardResponse
        {
            LowStock = lowRows,
            RecentInventoryActivity = feed
        };
    }
}

