namespace Oms.Api.Models;

public sealed class UserRow
{
    public required string Email { get; init; }
    public required string Name { get; init; }
    public required string PhoneNumber { get; init; }
    public required string Password { get; init; }
    public required string Address { get; init; }
    public required string Role { get; init; }
}

