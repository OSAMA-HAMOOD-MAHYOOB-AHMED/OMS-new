using Dapper;
using Oms.Api.Data;

namespace Oms.Api.Catalog;

/// <summary>
/// Starter gallery photos for the store's products: free Unsplash photos of the same kind of product
/// (power banks, wall chargers, earbuds, phone cases), picked and checked by eye. They are stored as
/// links, run once, and only for products that have no extra photos yet; the admin can delete or
/// reorder them like any other photo.
/// </summary>
public static class StarterGallery
{
    private static string U(string slug) => $"https://images.unsplash.com/{slug}?auto=format&fit=crop&w=1000&q=80";

    // Power banks
    private const string P0 = "photo-1585995603413-eb35b5f4a50b"; // silver power bank with cable
    private const string P1 = "photo-1760708825913-65a50b3dc39b"; // white power bank with three cables
    private const string P2 = "photo-1706275399494-fb26bbc5da63"; // silver power bank on a table
    private const string P3 = "photo-1614399113305-a127bb2ca893"; // power banks next to a phone
    private const string P4 = "photo-1594843665794-446ce915d840"; // red power bank
    private const string P5 = "photo-1600577231598-31ea4cb50da3"; // charging a phone from a power bank
    private const string P6 = "photo-1566554738544-d962991c3fee"; // phone and power bank close-up
    private const string P7 = "photo-1635861321688-b63d28749a82"; // charging on the go
    private const string P8 = "photo-1736516434209-51ece1006788"; // two power banks

    // Wall chargers
    private const string C0 = "photo-1770417999831-1c070eb628e6"; // white adapter and USB cable
    private const string C1 = "photo-1770418000074-fa16c0a53e82"; // white adapter on wood
    private const string C2 = "photo-1770417999483-e5a313b33468"; // USB charger and cable
    private const string C3 = "photo-1770417999317-64fb254c9e3a"; // adapter with metal prongs
    private const string C4 = "photo-1583863788434-e58a36330cf0"; // white charging adapter
    private const string C5 = "photo-1586254116951-5263e2cdb44c"; // adapter plugged into a wall
    private const string C6 = "photo-1627886107121-b7daaede3974"; // adapter on a wooden table
    private const string C7 = "photo-1586254116648-d33e0fada133"; // white adapter, yellow background
    private const string C8 = "photo-1517320069935-381614f8c1e5"; // compact travel adapter
    private const string C9 = "photo-1706290134049-c5c72d24146a"; // black charger and cable
    private const string C10 = "photo-1709236709044-159f627b7971"; // chargers and plugs on a table
    private const string C11 = "photo-1728298777297-45aacb75f8f5"; // several chargers on a wall
    private const string C12 = "photo-1596877445530-ad74838754c6"; // multi-port GaN charger
    private const string C13 = "photo-1623738244303-a645cef7aafa"; // Apple USB-C adapter
    private const string C14 = "photo-1731616103600-3fe7ccdc5a59"; // fast charger with cable
    private const string C15 = "photo-1725304382197-663ae3864750"; // 66W fast charger

    // Wireless earbuds
    private const string E0 = "photo-1655560378428-7605bda51749"; // black earbuds charging case
    private const string E1 = "photo-1722439667098-f32094e3b1d4"; // black earbuds
    private const string E2 = "photo-1590658268037-6bf12165a8df"; // earbuds in an open case
    private const string E3 = "photo-1606220588913-b3aacb4d2f46"; // earbuds and case, blue light
    private const string E4 = "photo-1578319439584-104c94d37305"; // black wireless earbuds with case
    private const string E5 = "photo-1758273237946-26d40a31f02a"; // listening on the go
    private const string E6 = "photo-1667178173387-7e0cb51c0b4f"; // earbuds on their case
    private const string E7 = "photo-1606220945770-b5b6c2c55bf1"; // earbuds in a dark case
    private const string E8 = "photo-1627989580309-bfaf3e58af6f"; // earbuds in an open case
    private const string E9 = "photo-1668649176554-3ad841a780d0"; // grey earbuds in their case

    // iPhone cases
    private const string I0 = "photo-1535157412991-2ef801c1748b"; // colourful cases
    private const string I3 = "photo-1692780256774-198bc0a3bbf0"; // MagSafe cases in a row
    private const string I6 = "photo-1583291023438-41cef6453b1f"; // clear case on a phone
    private const string I10 = "photo-1775544265981-9db0ea58687f"; // clear MagSafe case
    private const string I11 = "photo-1625102216615-3a61ee26e4db"; // black case, camera close-up
    private const string I17 = "photo-1711033312367-247626a984d1"; // matte case in the hand
    private const string I21 = "photo-1613294064031-8935937266f4"; // clear case in the hand
    private const string I22 = "photo-1625102217544-a096a17018f7"; // black case

    // Samsung Galaxy cases
    private const string S5 = "photo-1581003989563-eb4737da70b9"; // Galaxy in a printed case
    private const string S7 = "photo-1612265152720-671efb0e3047"; // Galaxy in a black case
    private const string S10 = "photo-1690788056245-025bd89708a1"; // Galaxy in a green case
    private const string S11 = "photo-1593587035387-9571c0cee0f7"; // Galaxy in a clear case
    private const string S15 = "photo-1582826639774-3de24e6a39ae"; // Galaxy in a white case

    private static readonly Dictionary<string, string[]> Photos = new()
    {
        ["PWR-001"] = [P1, P3, P8],
        ["PWR-002"] = [P0, P8, P5],
        ["PWR-003"] = [P1, P7, P3],
        ["PWR-004"] = [P0, P5, P6],
        ["PWR-005"] = [P2, P8, P7],
        ["P-PBANK-01"] = [P6, P1, P5],

        ["CHR-001"] = [C12, C15, C2],
        ["CHR-002"] = [C7, C11, C9],
        ["CHR-003"] = [C0, C6, C3],
        ["CHR-004"] = [C9, C10, C15],
        ["CHR-005"] = [C13, C4, C8],
        ["P-CHARGER-01"] = [C1, C5, C14],

        ["EAR-001"] = [E3, E6, E9],
        ["EAR-002"] = [E0, E4, E7],
        ["EAR-003"] = [E1, E8, E5],
        ["EAR-004"] = [E4, E9, E6],
        ["EAR-005"] = [E7, E0, E3],
        ["P-EARPH-01"] = [E1, E2, E5],

        ["CAS-001"] = [I21, I6, I10],
        ["CAS-003"] = [I10, I3, I21],
        ["CAS-005"] = [I22, I11, I17],
        ["P-CASE-01"] = [I6, I21, I0],
        ["CAS-002"] = [S7, S10, S15],
        ["CAS-004"] = [S11, S5, S15],
    };

    public static async Task AddOnceAsync(WebApplication app)
    {
        var factory = app.Services.GetRequiredService<IDbConnectionFactory>();
        using var conn = factory.Create();
        conn.Open();
        using var tx = conn.BeginTransaction();
        await conn.ExecuteAsync("LOCK TABLE site_setting IN EXCLUSIVE MODE;", transaction: tx);
        var done = await conn.ExecuteScalarAsync<string?>(
            "SELECT value FROM site_setting WHERE key = 'starterGallery';", transaction: tx);
        if (done is not null)
        {
            tx.Rollback();
            return;
        }

        var added = 0;
        foreach (var (productId, slugs) in Photos)
        {
            // Only products that exist and have no extra photos of their own yet.
            var eligible = await conn.ExecuteScalarAsync<bool>("""
                SELECT EXISTS (SELECT 1 FROM product WHERE productid = @productId)
                   AND NOT EXISTS (SELECT 1 FROM product_photo WHERE productid = @productId);
                """, new { productId }, tx);
            if (!eligible) continue;

            for (var i = 0; i < slugs.Length; i++)
            {
                added += await conn.ExecuteAsync("""
                    INSERT INTO product_photo (productid, externalurl, sortorder) VALUES (@productId, @url, @i);
                    """, new { productId, url = U(slugs[i]), i }, tx);
            }
        }

        await conn.ExecuteAsync(
            "INSERT INTO site_setting (key, value) VALUES ('starterGallery', NOW()::text);", transaction: tx);
        tx.Commit();
        app.Logger.LogWarning("Added {Count} starter gallery photos", added);
    }
}
