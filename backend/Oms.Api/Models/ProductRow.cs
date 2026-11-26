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

    /// <summary>Original price, shown crossed out when it is above <see cref="Price"/> (product on sale).</summary>
    public decimal? CompareAtPrice { get; init; }
    /// <summary>Specifications, one "Label: value" per line.</summary>
    public string? Specs { get; init; }
    public DateTime CreatedAt { get; init; }
    public decimal Rating { get; init; }
    public int ReviewCount { get; init; }
    /// <summary>Units sold in orders that were not cancelled (for "best selling").</summary>
    public int SoldCount { get; init; }
    /// <summary>Extra gallery photos (URLs), in the admin's order. The main photo is <see cref="ImageUrl"/>.</summary>
    public string[] Gallery { get; init; } = [];
    /// <summary>Photo ids matching <see cref="Gallery"/> (for deleting and reordering).</summary>
    public long[] GalleryIds { get; init; } = [];
}

