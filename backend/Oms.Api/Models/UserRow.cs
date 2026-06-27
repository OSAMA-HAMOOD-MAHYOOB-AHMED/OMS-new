namespace Oms.Api.Models;

public sealed class UserRow
{
    public required string Email { get; init; }
    public required string Name { get; init; }
    public required string PhoneNumber { get; init; }
    public required string Password { get; init; }
    public required string Address { get; init; }
    public required string Role { get; init; }
    public bool EmailVerified { get; init; }
    public string? VerificationToken { get; init; }
    public DateTime? VerificationTokenExpires { get; init; }
    public string? AvatarUrl { get; init; }
    public DateTime CreatedAt { get; init; }
}

