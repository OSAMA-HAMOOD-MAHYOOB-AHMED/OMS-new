using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Data;
using Oms.Api.Models;

namespace Oms.Api.Catalog;

/// <summary>
/// Store details the admin can change without a release: the promo strip, WhatsApp number and
/// contact details shown on the website. Empty values are simply not shown.
/// </summary>
public sealed class SiteSettingsRepository(IDbConnectionFactory db)
{
    public static readonly string[] Keys =
    [
        "promoEn", "promoAr",           // promo strip text
        "whatsapp",                      // international number, digits only, e.g. 9665XXXXXXXX
        "phone", "email",
        "addressEn", "addressAr",
        "hoursEn", "hoursAr",            // opening hours
        "mapUrl",                        // Google Maps link to the shop
    ];

    public async Task<Dictionary<string, string>> Get()
    {
        using var conn = db.Create();
        var rows = await conn.QueryAsync<(string Key, string? Value)>("SELECT key, value FROM site_setting;");
        var map = Keys.ToDictionary(k => k, _ => "");
        foreach (var (key, value) in rows)
            if (map.ContainsKey(key)) map[key] = value ?? "";
        return map;
    }

    public async Task Save(IReadOnlyDictionary<string, string?> values)
    {
        using var conn = db.Create();
        foreach (var key in Keys)
        {
            if (!values.TryGetValue(key, out var value)) continue;
            await conn.ExecuteAsync("""
                INSERT INTO site_setting (key, value) VALUES (@key, @value)
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
                """, new { key, value = value?.Trim() ?? "" });
        }
    }
}

[ApiController]
[Route("api/settings")]
public sealed class SiteSettingsController(SiteSettingsRepository settings) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<Dictionary<string, string>>> Get()
    {
        Response.Headers.CacheControl = "public, max-age=60";
        return Ok(await settings.Get());
    }

    [HttpPut]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<IActionResult> Save([FromBody] Dictionary<string, string?> values)
    {
        if (values.Values.Any(v => v is { Length: > 600 })) return BadRequest("One of the values is too long.");
        if (values.TryGetValue("whatsapp", out var wa) && !string.IsNullOrWhiteSpace(wa))
        {
            var digits = new string(wa.Where(char.IsDigit).ToArray());
            if (digits.Length is < 8 or > 15) return BadRequest("Enter the WhatsApp number with the country code, e.g. 9665XXXXXXXX.");
            values["whatsapp"] = digits;
        }
        if (values.TryGetValue("mapUrl", out var map) && !string.IsNullOrWhiteSpace(map)
            && !(Uri.TryCreate(map, UriKind.Absolute, out var u) && u.Scheme == Uri.UriSchemeHttps))
            return BadRequest("The map link must start with https://");

        await settings.Save(values);
        return NoContent();
    }
}
