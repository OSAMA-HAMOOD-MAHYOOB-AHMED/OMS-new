using System.Text.RegularExpressions;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Data;
using Oms.Api.Models;

namespace Oms.Api.Orders;

public sealed record CouponRow(string Code, int Percent, decimal MinSubtotal, DateTime? ExpiresAt, bool Active, DateTime CreatedAt, int TimesUsed);

public sealed record CouponRequest(string? Code, int Percent, decimal? MinSubtotal, DateTime? ExpiresAt, bool? Active);

public sealed record CouponCheckRequest(string? Code, decimal Subtotal);

public sealed record CouponCheckResponse(string Code, int Percent, decimal Discount);

/// <summary>Result of looking a code up for a cart: the discount, or the reason it does not apply.</summary>
public sealed record CouponResult(string? Code, int Percent, decimal Discount, string? Error)
{
    public static CouponResult None { get; } = new(null, 0, 0, null);
    public bool Ok => Error is null;
}

public sealed partial class CouponRepository(IDbConnectionFactory db)
{
    [GeneratedRegex("^[A-Z0-9_-]{3,40}$")]
    private static partial Regex CodePattern();

    public static string Normalize(string? code) => (code ?? "").Trim().ToUpperInvariant();
    public static bool IsValidCode(string code) => CodePattern().IsMatch(code);

    public async Task<IReadOnlyList<CouponRow>> List()
    {
        const string sql = """
            SELECT c.code AS Code, c.percent::int AS Percent, c.minsubtotal AS MinSubtotal, c.expiresat AS ExpiresAt,
                   c.active AS Active, c.createdat AS CreatedAt,
                   (SELECT COUNT(*)::int FROM "Order" o WHERE o.couponcode = c.code) AS TimesUsed
            FROM coupon c
            ORDER BY c.createdat DESC;
            """;
        using var conn = db.Create();
        return (await conn.QueryAsync<CouponRow>(sql)).ToList();
    }

    public async Task Upsert(string code, int percent, decimal minSubtotal, DateTime? expiresAt, bool active)
    {
        const string sql = """
            INSERT INTO coupon (code, percent, minsubtotal, expiresat, active)
            VALUES (@code, @percent, @minSubtotal, @expiresAt, @active)
            ON CONFLICT (code) DO UPDATE SET
              percent = EXCLUDED.percent, minsubtotal = EXCLUDED.minsubtotal,
              expiresat = EXCLUDED.expiresat, active = EXCLUDED.active;
            """;
        using var conn = db.Create();
        await conn.ExecuteAsync(sql, new { code, percent, minSubtotal, expiresAt, active });
    }

    public async Task<bool> Delete(string code)
    {
        using var conn = db.Create();
        return await conn.ExecuteAsync("DELETE FROM coupon WHERE code = @code;", new { code }) > 0;
    }

    /// <summary>Works out the discount a code gives on a cart subtotal (in riyals, like all prices).</summary>
    public async Task<CouponResult> Evaluate(string? rawCode, decimal subtotal)
    {
        var code = Normalize(rawCode);
        if (code.Length == 0) return CouponResult.None;

        using var conn = db.Create();
        var c = await conn.QuerySingleOrDefaultAsync<CouponRow>("""
            SELECT code AS Code, percent::int AS Percent, minsubtotal AS MinSubtotal, expiresat AS ExpiresAt,
                   active AS Active, createdat AS CreatedAt, 0 AS TimesUsed
            FROM coupon WHERE code = @code;
            """, new { code });

        if (c is null || !c.Active) return new(code, 0, 0, "This discount code is not valid.");
        if (c.ExpiresAt is { } exp && exp < DateTime.UtcNow) return new(code, 0, 0, "This discount code has expired.");
        if (subtotal < c.MinSubtotal)
            return new(code, 0, 0, $"This code needs a cart total of at least SAR {c.MinSubtotal:F2}.");

        var discount = Math.Round(subtotal * c.Percent / 100m, 2, MidpointRounding.AwayFromZero);
        return new(c.Code, c.Percent, discount, null);
    }
}

/// <summary>Customers check a code before placing the order (the checkout checks it again).</summary>
[ApiController]
[Route("api/coupons")]
public sealed class CouponsController(CouponRepository coupons) : ControllerBase
{
    [HttpPost("check")]
    [Authorize(Roles = UserRole.Customer)]
    public async Task<ActionResult<CouponCheckResponse>> Check([FromBody] CouponCheckRequest req)
    {
        if (req.Subtotal <= 0) return BadRequest("Your cart is empty.");
        var r = await coupons.Evaluate(req.Code, req.Subtotal);
        if (r.Code is null) return BadRequest("Enter a discount code.");
        if (!r.Ok) return BadRequest(r.Error);
        return Ok(new CouponCheckResponse(r.Code, r.Percent, r.Discount));
    }
}

[ApiController]
[Route("api/admin/coupons")]
[Authorize(Roles = UserRole.Admin)]
public sealed class AdminCouponsController(CouponRepository coupons) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CouponRow>>> List() => Ok(await coupons.List());

    [HttpPost]
    public async Task<IActionResult> Save([FromBody] CouponRequest req)
    {
        var code = CouponRepository.Normalize(req.Code);
        if (!CouponRepository.IsValidCode(code))
            return BadRequest("Codes are 3–40 letters, numbers, - or _.");
        if (req.Percent is < 1 or > 90) return BadRequest("The discount must be between 1% and 90%.");
        if (req.MinSubtotal is < 0) return BadRequest("The minimum cart total can't be negative.");

        await coupons.Upsert(code, req.Percent, req.MinSubtotal ?? 0, req.ExpiresAt?.ToUniversalTime(), req.Active ?? true);
        return NoContent();
    }

    [HttpDelete("{code}")]
    public async Task<IActionResult> Delete([FromRoute] string code) =>
        await coupons.Delete(CouponRepository.Normalize(code)) ? NoContent() : NotFound();
}
