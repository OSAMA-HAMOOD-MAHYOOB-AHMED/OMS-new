namespace Oms.Api.Admin;

public sealed record ProductUpsertRequest(
    string ProductID,
    string Name,
    string Category,
    decimal Price,
    int StockLevel,
    string? Description
);

public sealed record AdminCustomerRow(string Email, string Name, string PhoneNumber, string Address, string Role);

