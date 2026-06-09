using System.Security.Cryptography;
using Oms.Api.Invoicing;

namespace Oms.Api.Auth;

public sealed class EmailVerificationService(UserRepository users, NotificationService notifications)
{
    public async Task SendVerificationEmailAsync(string email, string name)
    {
        var token = GenerateToken();
        var expires = DateTime.UtcNow.AddHours(24);
        await users.SetVerificationToken(email, token, expires);
        await notifications.SendSignupVerificationAsync(email, name, token);
    }

    public async Task<bool> VerifyAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return false;

        var user = await users.GetByVerificationToken(token.Trim());
        if (user is null)
            return false;

        if (user.VerificationTokenExpires is not null &&
            DateTime.SpecifyKind(user.VerificationTokenExpires.Value, DateTimeKind.Utc) < DateTime.UtcNow)
            return false;

        await users.MarkEmailVerified(user.Email);
        return true;
    }

    public async Task ResendAsync(string email)
    {
        var user = await users.GetByEmail(email);
        if (user is null || user.EmailVerified)
            return;

        await SendVerificationEmailAsync(user.Email, user.Name);
    }

    private static string GenerateToken() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
}
