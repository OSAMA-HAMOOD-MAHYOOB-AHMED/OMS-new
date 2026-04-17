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
        if (string.IsNullOrWhiteSpace(req.Email) ||
            string.IsNullOrWhiteSpace(req.Password) ||
            string.IsNullOrWhiteSpace(req.Name) ||
            string.IsNullOrWhiteSpace(req.Role))
        {
            return BadRequest("Missing required fields.");
        }

        if (!UserRole.All.Contains(req.Role))
            return BadRequest("Invalid role.");

        var existing = await users.GetByEmail(req.Email.Trim().ToLowerInvariant());
        if (existing is not null)
            return Conflict("Email already registered.");

        var row = new UserRow
        {
            Email = req.Email.Trim().ToLowerInvariant(),
            Name = req.Name.Trim(),
            PhoneNumber = req.Phone.Trim(),
            Address = req.Address.Trim(),
            Role = req.Role,
            Password = BCrypt.Net.BCrypt.HashPassword(req.Password)
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
        var user = await users.GetByEmail(email);
        if (user is null)
            return Unauthorized();

        if (!BCrypt.Net.BCrypt.Verify(req.Password ?? "", user.Password))
            return Unauthorized();

        var token = tokens.CreateToken(user.Email, user.Role);
        return Ok(new AuthResponse(token, user.Email, user.Role));
    }
}

