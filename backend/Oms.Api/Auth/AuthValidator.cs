using System.Net.Mail;
using System.Text.RegularExpressions;

namespace Oms.Api.Auth;

public static partial class AuthValidator
{
    private static readonly HashSet<string> BlockedEmailDomains = new(StringComparer.OrdinalIgnoreCase)
    {
        "example.com",
        "example.org",
        "test.com",
        "localhost",
    };

    public static string? ValidateLoginEmail(string? email)
    {
        var value = (email ?? "").Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(value))
            return "Email address is required.";
        if (!EmailFormatRegex().IsMatch(value))
            return "Enter a valid email address.";
        return null;
    }

    public static bool IsDemoEmail(string? email) =>
        (email ?? "").Trim().EndsWith("@demo.local", StringComparison.OrdinalIgnoreCase);

    public static string? ValidateRegistrationEmail(string? email)
    {
        var value = (email ?? "").Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(value))
            return "Email address is required.";

        if (value.Length > 254)
            return "Email address is too long.";

        try
        {
            _ = new MailAddress(value);
        }
        catch
        {
            return "Enter a valid email address (e.g. you@gmail.com).";
        }

        if (!EmailFormatRegex().IsMatch(value))
            return "Enter a valid email address (e.g. you@gmail.com).";

        var at = value.LastIndexOf('@');
        if (at <= 0 || at >= value.Length - 3)
            return "Enter a valid email address with a proper domain.";

        var domain = value[(at + 1)..];
        if (domain.EndsWith(".local", StringComparison.OrdinalIgnoreCase))
            return "Use a real email address you can access. Demo accounts use @demo.local and are created by the system.";

        if (BlockedEmailDomains.Contains(domain))
            return "Use a real email address you can access.";

        return null;
    }

    public static string? ValidatePassword(string? password)
    {
        var value = password ?? "";
        if (string.IsNullOrWhiteSpace(value))
            return "Password is required.";
        if (value.Length < 8)
            return "Password must be at least 8 characters.";
        if (value.Length > 128)
            return "Password is too long.";
        if (!PasswordRegex().IsMatch(value))
            return "Password must include at least one letter and one number.";
        return null;
    }

    public static string? ValidatePhone(string? phone)
    {
        var digits = DigitsOnly(phone);
        if (digits.Length < 8)
            return "Enter a valid phone number (at least 8 digits).";
        if (digits.Length > 15)
            return "Phone number is too long.";
        return null;
    }

    public static string? ValidateName(string? name)
    {
        var value = (name ?? "").Trim();
        if (value.Length < 2)
            return "Full name must be at least 2 characters.";
        if (value.Length > 100)
            return "Full name is too long.";
        return null;
    }

    public static string? ValidateAddress(string? address)
    {
        var value = (address ?? "").Trim();
        if (value.Length < 5)
            return "Address must be at least 5 characters.";
        if (value.Length > 255)
            return "Address is too long.";
        return null;
    }

    private static string DigitsOnly(string? value) =>
        string.Concat((value ?? "").Where(char.IsDigit));

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$", RegexOptions.IgnoreCase)]
    private static partial Regex EmailFormatRegex();

    [GeneratedRegex(@"^(?=.*[A-Za-z])(?=.*\d).+$")]
    private static partial Regex PasswordRegex();
}
