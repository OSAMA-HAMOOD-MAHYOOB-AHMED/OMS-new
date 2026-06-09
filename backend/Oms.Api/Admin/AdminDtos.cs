namespace Oms.Api.Admin;

public sealed record ProductUpsertRequest(
    string ProductID,
    string Name,
    string Category,
    decimal Price,
    int StockLevel,
    string? Description,
    string? ImageUrl
);

public sealed record AdminCustomerRow(string Email, string Name, string PhoneNumber, string Address, string Role);

public sealed record AdminSalesDailyRow(DateTime Day, long Orders, decimal Revenue, decimal AvgValue);

public sealed record AdminOrderStatusBreakdownRow(string OrderStatus, long Orders, decimal Revenue);

public sealed record AdminSalesReportResponse(
    IReadOnlyList<AdminSalesDailyRow> Daily,
    IReadOnlyList<AdminOrderStatusBreakdownRow> StatusBreakdown);

