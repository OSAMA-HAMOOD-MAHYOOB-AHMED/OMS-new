namespace Oms.Api.Models;

public static class UserRole
{
    public const string Customer = "Customer";
    public const string RetailSalesperson = "Retail Salesperson";
    public const string WarehouseManager = "Warehouse Manager";

    public static readonly IReadOnlySet<string> All =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            Customer,
            RetailSalesperson,
            WarehouseManager
        };
}

