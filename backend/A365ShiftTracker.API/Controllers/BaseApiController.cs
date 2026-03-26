using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

/// <summary>
/// Base controller that provides helper to extract current user ID from JWT token.
/// </summary>
public abstract class BaseApiController : ControllerBase
{
    /// <summary>
    /// Gets the authenticated user's ID from the JWT "sub" claim.
    /// </summary>
    protected int GetCurrentUserId()
    {
        var claim = User.FindFirst(JwtRegisteredClaimNames.Sub)
                    ?? User.FindFirst(ClaimTypes.NameIdentifier);

        if (claim is null || !int.TryParse(claim.Value, out var userId))
            throw new UnauthorizedAccessException("Unable to determine user identity.");

        return userId;
    }
}
