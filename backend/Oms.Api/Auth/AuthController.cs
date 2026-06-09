using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Models;

namespace Oms.Api.Auth;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(UserRepository users, TokenService tokens, EmailVerificationService verification) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponse>> Register([FromBody] RegisterRequest req)
    {
        var email = (req.Email ?? "").Trim().ToLowerInvariant();
        var password = (req.Password ?? "").Trim();
        var name = (req.Name ?? "").Trim();
        var phone = (req.Phone ?? "").Trim();
        var address = (req.Address ?? "").Trim();
        var role = (req.Role ?? "").Trim();

        var emailError = AuthValidator.ValidateRegistrationEmail(email);
        if (emailError is not null) return BadRequest(emailError);

        var passwordError = AuthValidator.ValidatePassword(password);
        if (passwordError is not null) return BadRequest(passwordError);

        var nameError = AuthValidator.ValidateName(name);
        if (nameError is not null) return BadRequest(nameError);

        var phoneError = AuthValidator.ValidatePhone(phone);
        if (phoneError is not null) return BadRequest(phoneError);

        var addressError = AuthValidator.ValidateAddress(address);
        if (addressError is not null) return BadRequest(addressError);

        if (string.IsNullOrWhiteSpace(role))
            return BadRequest("Missing required fields.");

        if (!UserRole.All.Contains(role))
            return BadRequest("Invalid role.");

        var existing = await users.GetByEmail(email);
        if (existing is not null)
            return Conflict("Email already registered.");

        var row = new UserRow
        {
            Email = email,
            Name = name,
            PhoneNumber = phone,
            Address = address,
            Role = role,
            Password = BCrypt.Net.BCrypt.HashPassword(password),
            EmailVerified = false,
            VerificationToken = null,
            VerificationTokenExpires = null
        };

        var ok = await users.Create(row);
        if (!ok)
            return Conflict("Email already registered.");

        await verification.SendVerificationEmailAsync(email, name);

        return Ok(new RegisterResponse(
            email,
            "Account created. We sent a verification link to your email. Please verify before signing in.",
            true));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest req)
    {
        var email = (req.Email ?? "").Trim().ToLowerInvariant();
        var password = (req.Password ?? "").Trim();

        var emailError = AuthValidator.ValidateLoginEmail(email);
        if (emailError is not null) return BadRequest(emailError);

        var user = await users.GetByEmail(email);
        if (user is null)
            return Unauthorized();

        if (!BCrypt.Net.BCrypt.Verify(password, user.Password))
            return Unauthorized();

        if (!user.EmailVerified && !AuthValidator.IsDemoEmail(email))
        {
            return StatusCode(403, new
            {
                message = "Please verify your email before signing in. Check your inbox or request a new verification link.",
                emailVerified = false,
                email = user.Email,
            });
        }

        var token = tokens.CreateToken(user.Email, user.Role);
        return Ok(new AuthResponse(token, user.Email, user.Role, user.EmailVerified));
    }

    [HttpGet("verify-email")]
    public async Task<ActionResult<VerifyEmailResponse>> VerifyEmail([FromQuery] string token)
    {
        var success = await verification.VerifyAsync(token);
        if (!success)
            return BadRequest(new VerifyEmailResponse(false, "Invalid or expired verification link. Request a new one from the sign-in page."));

        return Ok(new VerifyEmailResponse(true, "Email verified successfully. You can now sign in."));
    }

    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest req)
    {
        var email = (req.Email ?? "").Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest("Email is required.");

        var emailError = AuthValidator.ValidateRegistrationEmail(email);
        if (emailError is not null) return BadRequest(emailError);

        await verification.ResendAsync(email);
        return Ok(new { message = "If an unverified account exists for this email, a verification link has been sent." });
    }
}
