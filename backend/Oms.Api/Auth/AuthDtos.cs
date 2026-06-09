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
    string Role,
    bool EmailVerified
);

public sealed record RegisterResponse(
    string Email,
    string Message,
    bool RequiresVerification
);

public sealed record VerifyEmailResponse(bool Success, string Message);

public sealed record ResendVerificationRequest(string Email);

