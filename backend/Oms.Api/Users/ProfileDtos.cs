namespace Oms.Api.Users;

public sealed record UpdateProfileRequest(string Name, string PhoneNumber, string Address);

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public sealed class ProfileResponse
{
    public required string Email { get; init; }
    public required string Name { get; init; }
    public required string PhoneNumber { get; init; }
    public required string Address { get; init; }
    public required string Role { get; init; }
}

