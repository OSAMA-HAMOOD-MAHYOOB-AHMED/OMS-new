namespace Oms.Api.Models;

public sealed class ProductRow
{
    public required string ProductID { get; init; }
    public required string Name { get; init; }
    public required string Category { get; init; }
    public decimal Price { get; init; }
    public int StockLevel { get; init; }
    public string? Description { get; init; }
    public string? ImageUrl { get; init; }
}

