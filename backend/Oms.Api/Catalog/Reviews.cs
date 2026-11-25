using System.Security.Claims;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Auth;
using Oms.Api.Data;
using Oms.Api.Models;

namespace Oms.Api.Catalog;

public sealed record ReviewRow(long ReviewId, string Name, int Rating, string? Comment, bool VerifiedBuyer, DateTime CreatedAt, bool Mine);

public sealed record ReviewRequest(int Rating, string? Comment);

public sealed class ReviewRepository(IDbConnectionFactory db)
{
    public async Task<IReadOnlyList<ReviewRow>> List(string productId, string? viewerEmail)
    {
        const string sql = """
            SELECT reviewid AS ReviewId, name AS Name, rating::int AS Rating, comment AS Comment,
                   verifiedbuyer AS VerifiedBuyer, createdat AS CreatedAt,
                   (lower(email) = lower(COALESCE(@viewer, ''))) AS Mine
            FROM product_review
            WHERE productid = @productId
            ORDER BY createdat DESC;
            """;
        using var conn = db.Create();
        return (await conn.QueryAsync<ReviewRow>(sql, new { productId, viewer = viewerEmail })).ToList();
    }

    /// <summary>One review per customer and product; writing again replaces it.</summary>
    public async Task Upsert(string productId, string email, string name, int rating, string? comment)
    {
        const string sql = """
            INSERT INTO product_review (productid, email, name, rating, comment, verifiedbuyer, createdat)
            VALUES (@productId, @email, @name, @rating, @comment,
                    EXISTS (SELECT 1 FROM order_item oi JOIN "Order" o ON o.orderid = oi.orderid
                            WHERE oi.productid = @productId AND lower(o.email) = lower(@email)
                              AND o.orderstatus NOT ILIKE 'cancel%'),
                    NOW())
            ON CONFLICT (productid, email) DO UPDATE SET
              name = EXCLUDED.name, rating = EXCLUDED.rating, comment = EXCLUDED.comment,
              verifiedbuyer = EXCLUDED.verifiedbuyer, createdat = NOW();
            """;
        using var conn = db.Create();
        await conn.ExecuteAsync(sql, new { productId, email, name, rating, comment });
    }

    public async Task<bool> Delete(long reviewId, string? onlyForEmail)
    {
        const string sql = """
            DELETE FROM product_review
            WHERE reviewid = @reviewId AND (@email IS NULL OR lower(email) = lower(@email));
            """;
        using var conn = db.Create();
        return await conn.ExecuteAsync(sql, new { reviewId, email = onlyForEmail }) > 0;
    }
}

[ApiController]
[Route("api/products/{productId}/reviews")]
public sealed class ReviewsController(ReviewRepository reviews, ProductRepository products, UserRepository users) : ControllerBase
{
    private const int MaxComment = 1000;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<ReviewRow>>> List([FromRoute] string productId)
    {
        return Ok(await reviews.List(productId, CurrentEmail()));
    }

    [HttpPost]
    [Authorize(Roles = UserRole.Customer)]
    public async Task<IActionResult> Write([FromRoute] string productId, [FromBody] ReviewRequest req)
    {
        if (req.Rating is < 1 or > 5) return BadRequest("Choose a rating from 1 to 5 stars.");
        var comment = req.Comment?.Trim();
        if (comment is { Length: > MaxComment }) return BadRequest("Your review is too long. Please keep it under 1000 characters.");
        if (await products.Get(productId) is null) return NotFound();

        var email = CurrentEmail();
        if (email is null) return Unauthorized();
        var user = await users.GetByEmail(email);
        if (user is null) return Unauthorized();

        await reviews.Upsert(productId, email, FirstNameAndInitial(user.Name), req.Rating, string.IsNullOrEmpty(comment) ? null : comment);
        return NoContent();
    }

    /// <summary>Customers delete their own review; the admin can delete any.</summary>
    [HttpDelete("{reviewId:long}")]
    [Authorize]
    public async Task<IActionResult> Delete([FromRoute] long reviewId)
    {
        var isAdmin = User.IsInRole(UserRole.Admin);
        var ok = await reviews.Delete(reviewId, isAdmin ? null : CurrentEmail());
        return ok ? NoContent() : NotFound();
    }

    private string? CurrentEmail() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.Email);

    // Reviews are public, so show "Osama H." rather than the full name.
    private static string FirstNameAndInitial(string fullName)
    {
        var parts = (fullName ?? "").Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0) return "Customer";
        return parts.Length == 1 ? parts[0] : $"{parts[0]} {parts[^1][0]}.";
    }
}
