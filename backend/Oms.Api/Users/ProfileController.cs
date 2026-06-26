using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Oms.Api.Users;

[ApiController]
[Route("api/profile")]
[Authorize]
public sealed class ProfileController(UserProfileRepository profiles) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ProfileResponse>> Get()
    {
        var email = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();

        var u = await profiles.Get(email);
        if (u is null) return NotFound();

        return Ok(new ProfileResponse
        {
            Email = u.Email,
            Name = u.Name,
            PhoneNumber = u.PhoneNumber,
            Address = u.Address,
            Role = u.Role,
            EmailVerified = u.EmailVerified
        });
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateProfileRequest req)
    {
        var email = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(req.Name) ||
            string.IsNullOrWhiteSpace(req.PhoneNumber) ||
            string.IsNullOrWhiteSpace(req.Address))
        {
            return BadRequest("Missing fields.");
        }

        try
        {
            await profiles.UpdateProfile(email, req);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var email = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(req.CurrentPassword) || string.IsNullOrWhiteSpace(req.NewPassword))
            return BadRequest("Missing fields.");

        try
        {
            await profiles.ChangePassword(email, req);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("delete")]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest req)
    {
        var email = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(req.Password))
            return BadRequest("Password is required.");

        try
        {
            await profiles.DeleteAccount(email, req);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}

