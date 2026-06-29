using Dapper;
using Oms.Api.Data;

namespace Oms.Api.Catalog;

public static class ProductSeeder
{
    private sealed record SeedProduct(
        string ProductID, string Name, string Category,
        decimal Price, int StockLevel, string Description);

    private static readonly SeedProduct[] Products =
    [
        // Chargers
        new("CHR-001", "Anker Nano 65W USB-C GaN Charger",
            "Charger", 24.99m, 45,
            "Compact 65W GaN charger supports USB-C Power Delivery. Charges laptops, tablets, and phones. Foldable plug for easy travel."),

        new("CHR-002", "Samsung 45W Super Fast Charger Adapter",
            "Charger", 21.99m, 60,
            "Official Samsung 45W adapter with USB-C port. Compatible with Galaxy S and Note series. Supports Super Fast Charging 2.0."),

        new("CHR-003", "Belkin 20W USB-C Power Delivery Charger",
            "Charger", 14.99m, 80,
            "20W USB-C wall charger with Power Delivery. Fast charges iPhone 12 and later from 0 to 50% in 30 minutes."),

        new("CHR-004", "Baseus 100W GaN Pro 4-Port Charger",
            "Charger", 39.99m, 30,
            "4-port GaN charger (2x USB-C, 2x USB-A) delivering up to 100W total. Charge a laptop, tablet, and two phones simultaneously."),

        new("CHR-005", "Apple 20W USB-C Power Adapter",
            "Charger", 19.99m, 50,
            "Original Apple 20W USB-C adapter for fast charging iPhone and iPad. Works with USB-C to Lightning and USB-C cables."),

        // Earphones
        new("EAR-001", "Samsung Galaxy Buds2 Pro",
            "Earphones", 149.99m, 25,
            "Premium wireless earbuds with Intelligent ANC, 360° Audio, and ergonomic fit. Up to 8 hours battery with ANC on."),

        new("EAR-002", "Anker Soundcore Life P3 Active Noise Cancelling Earbuds",
            "Earphones", 49.99m, 40,
            "Hybrid active noise cancellation with 3 adjustable levels. 11mm drivers for deep bass. IPX5 water resistant. 35-hour total playtime."),

        new("EAR-003", "JBL Tune 230NC TWS Earbuds",
            "Earphones", 59.99m, 35,
            "True adaptive noise cancellation with JBL Pure Bass Sound. 4-mic clear call technology. Up to 40 hours total playtime."),

        new("EAR-004", "Sony WF-C700N Wireless Noise Cancelling Earbuds",
            "Earphones", 99.99m, 20,
            "Sony's digital noise cancellation with 360° Audio support. Comfortable open-fit design. Up to 15 hours battery life."),

        new("EAR-005", "Xiaomi Redmi Buds 4 Pro TWS Earphones",
            "Earphones", 39.99m, 55,
            "Active noise cancellation up to 43dB. 10mm dynamic drivers with Hi-Res Audio. Bluetooth 5.3. IPX4 splash resistant."),

        // Power Banks
        new("PWR-001", "Anker 20000mAh PowerCore Slim Power Bank",
            "Power Bank", 45.99m, 30,
            "20000mAh high-capacity slim design. Dual USB-A ports + USB-C input/output. PowerIQ technology for fast charging. Charges iPhone 15 over 4 times."),

        new("PWR-002", "Baseus 30000mAh Power Bank 65W",
            "Power Bank", 54.99m, 25,
            "30000mAh massive capacity with 65W max output. Charges laptops, tablets, and phones. Built-in USB-C cable. LED power display."),

        new("PWR-003", "Xiaomi Mi 10000mAh Power Bank 3",
            "Power Bank", 19.99m, 70,
            "Compact 10000mAh power bank with dual USB-A and USB-C ports. 22.5W fast charging. Pocket-sized lightweight aluminum body."),

        new("PWR-004", "Belkin 10000mAh Boost Charge Power Bank",
            "Power Bank", 34.99m, 45,
            "10000mAh with USB-C and USB-A ports. Pass-through charging lets you charge the bank and a device simultaneously. Soft-touch finish."),

        new("PWR-005", "RAVPower 26800mAh 90W Power Bank",
            "Power Bank", 59.99m, 20,
            "90W USB-C output charges laptops and MacBooks at full speed. 26800mAh capacity. Three simultaneous outputs. Smart power distribution."),

        // Phone Cases
        new("CAS-001", "Spigen Ultra Hybrid Case for iPhone 15",
            "Phone Case", 14.99m, 60,
            "Military-grade drop protection with crystal-clear back. Raised bezels protect screen and camera. Easy access to all ports and buttons."),

        new("CAS-002", "OtterBox Defender Series for Samsung Galaxy S24",
            "Phone Case", 49.99m, 25,
            "Multi-layer protection with port covers to block dust and debris. Built-in screen protector. Includes belt-clip holster doubles as kickstand."),

        new("CAS-003", "ESR Air Armor Case for iPhone 15 Pro",
            "Phone Case", 12.99m, 75,
            "Shockproof bumper corners with clear back panel. MagSafe compatible. Yellowing-resistant polycarbonate keeps your case looking new."),

        new("CAS-004", "Ringke Fusion Case for Samsung Galaxy S24+",
            "Phone Case", 15.99m, 50,
            "Crystal clear PC back with TPU bumper. Includes scratch-resistant back panel. Compatible with wireless charging. Camera lens protection."),

        new("CAS-005", "Caseology Vault Case for iPhone 15 Pro Max",
            "Phone Case", 19.99m, 45,
            "Military-grade drop protection with textured grip pattern. Dual-layer protection. MagSafe compatible. Available in matte black and graphite."),
    ];

    public static async Task SeedAsync(WebApplication app)
    {
        const int maxAttempts = 30;
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                using var scope = app.Services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<IDbConnectionFactory>();
                using var conn = db.Create();

                const string sql = """
                    INSERT INTO Product (productID, name, category, price, stockLevel, description, imageUrl)
                    VALUES (@ProductID, @Name, @Category, @Price, @StockLevel, @Description, NULL)
                    ON CONFLICT (productID) DO NOTHING;
                    """;

                foreach (var p in Products)
                    await conn.ExecuteAsync(sql, p);

                app.Logger.LogInformation("Products seeded ({Count} catalog items).", Products.Length);
                return;
            }
            catch (Exception ex)
            {
                if (attempt >= maxAttempts)
                {
                    app.Logger.LogError(ex, "Product seed failed after {Max} attempts.", maxAttempts);
                    throw;
                }
                app.Logger.LogWarning(ex, "Product seed attempt {Attempt}/{Max} failed; retrying...", attempt, maxAttempts);
                await Task.Delay(TimeSpan.FromSeconds(1));
            }
        }
    }
}
