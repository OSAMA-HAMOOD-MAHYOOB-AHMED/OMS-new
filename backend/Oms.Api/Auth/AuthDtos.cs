namespace Oms.Api.Auth;

public sealed record RegisterRequest(
    string Name,
    string Email,
    string Phone,
    string Address,
    string Role,
    string Password
);

public sealed record LoginRequest(
    string Email,
    string Password
);

public sealed record AuthResponse(
    string Token,
    string Email,
    string Role
);

