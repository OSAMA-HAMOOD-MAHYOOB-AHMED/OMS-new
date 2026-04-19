using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Oms.Api.Models;

namespace Oms.Api.Auth;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(UserRepository users, TokenService tokens) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest req)
    {
        var email = (req.Email ?? "").Trim().ToLowerInvariant();
        var password = (req.Password ?? "").Trim();
        var name = (req.Name ?? "").Trim();
        var phone = (req.Phone ?? "").Trim();
        var address = (req.Address ?? "").Trim();
        var role = (req.Role ?? "").Trim();

        if (string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(password) ||
            string.IsNullOrWhiteSpace(name) ||
            string.IsNullOrWhiteSpace(role))
        {
            return BadRequest("Missing required fields.");
        }

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
            Password = BCrypt.Net.BCrypt.HashPassword(password)
        };

        var ok = await users.Create(row);
        if (!ok)
            return Conflict("Email already registered.");

        var token = tokens.CreateToken(row.Email, row.Role);
        return Ok(new AuthResponse(token, row.Email, row.Role));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest req)
    {
        var email = (req.Email ?? "").Trim().ToLowerInvariant();
        var password = (req.Password ?? "").Trim();
        var user = await users.GetByEmail(email);
        if (user is null)
            return Unauthorized();

        if (!BCrypt.Net.BCrypt.Verify(password, user.Password))
            return Unauthorized();

        var token = tokens.CreateToken(user.Email, user.Role);
        return Ok(new AuthResponse(token, user.Email, user.Role));
    }
}

