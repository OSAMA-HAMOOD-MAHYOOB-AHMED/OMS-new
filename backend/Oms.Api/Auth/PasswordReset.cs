using System.Security.Cryptography;
using System.Text;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Data;
using Oms.Api.Invoicing;

namespace Oms.Api.Auth;

public sealed record ForgotPasswordRequest(string? Email);
public sealed record ResetPasswordRequest(string? Token, string? Password);

/// <summary>
/// "Forgot password": a one-hour link sent by email. Only a hash of the token is stored, and a
/// link works once. Opening it also proves the email address, so the account becomes verified.
/// </summary>
public sealed class PasswordResetService(IDbConnectionFactory db, UserRepository users, NotificationService notifications, ILogger<PasswordResetService> logger)
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromHours(1);

    public static async Task EnsureSchemaAsync(WebApplication app)
    {
        var factory = app.Services.GetRequiredService<IDbConnectionFactory>();
        using var conn = factory.Create();
        await conn.ExecuteAsync("""
            CREATE TABLE IF NOT EXISTS password_reset (
              tokenhash CHAR(64) PRIMARY KEY,
              email VARCHAR(255) NOT NULL,
              expiresat TIMESTAMPTZ NOT NULL,
              usedat TIMESTAMPTZ NULL,
              createdat TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            DELETE FROM password_reset WHERE expiresat < NOW() - INTERVAL '7 days';
            """);
    }

    public async Task RequestAsync(string email)
    {
        var user = await users.GetByEmail(email);
        if (user is null) return; // Same answer either way, so nobody can test which emails exist.

        using var conn = db.Create();
        // At most 3 links per address per hour.
        var recent = await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM password_reset WHERE email = @email AND createdat > NOW() - INTERVAL '1 hour';",
            new { email = user.Email });
        if (recent >= 3)
        {
            logger.LogWarning("Password reset: too many requests for {Email}", user.Email);
            return;
        }

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        await conn.ExecuteAsync(
            "INSERT INTO password_reset (tokenhash, email, expiresat) VALUES (@hash, @email, @expires);",
            new { hash = Hash(token), email = user.Email, expires = DateTime.UtcNow.Add(Lifetime) });

        await notifications.SendPasswordResetAsync(user.Email, user.Name, token);
    }

    /// <summary>Sets the new password. Returns null on success, or the message to show.</summary>
    public async Task<string?> ResetAsync(string token, string newPassword)
    {
        var passwordError = AuthValidator.ValidatePassword(newPassword);
        if (passwordError is not null) return passwordError;

        using var conn = db.Create();
        var row = await conn.QuerySingleOrDefaultAsync<(string Email, DateTime ExpiresAt, DateTime? UsedAt)>(
            "SELECT email, expiresat, usedat FROM password_reset WHERE tokenhash = @hash;",
            new { hash = Hash(token) });

        if (row.Email is null || row.UsedAt is not null || DateTime.SpecifyKind(row.ExpiresAt, DateTimeKind.Utc) < DateTime.UtcNow)
            return "This reset link is invalid or has expired. Please request a new one.";

        var hash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await conn.ExecuteAsync("""
            UPDATE "User" SET password = @hash, emailverified = TRUE WHERE email = @email;
            UPDATE password_reset SET usedat = NOW() WHERE email = @email AND usedat IS NULL;
            """, new { hash, email = row.Email });
        return null;
    }

    private static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token.Trim()))).ToLowerInvariant();
}

[ApiController]
[Route("api/auth")]
public sealed class PasswordResetController(PasswordResetService resets) : ControllerBase
{
    [HttpPost("forgot-password")]
    public async Task<IActionResult> Forgot([FromBody] ForgotPasswordRequest req)
    {
        var email = (req.Email ?? "").Trim().ToLowerInvariant();
        var emailError = AuthValidator.ValidateLoginEmail(email);
        if (emailError is not null) return BadRequest(emailError);

        await resets.RequestAsync(email);
        return Ok(new { message = "If an account exists for this email, we have sent a link to reset the password." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> Reset([FromBody] ResetPasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Token)) return BadRequest("This reset link is invalid or has expired. Please request a new one.");
        var error = await resets.ResetAsync(req.Token, (req.Password ?? "").Trim());
        return error is null
            ? Ok(new { message = "Your password has been changed. You can now sign in." })
            : BadRequest(error);
    }
}
