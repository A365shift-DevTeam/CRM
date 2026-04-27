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

    protected int? GetCurrentOrgId()
    {
        var claim = User.FindFirst("org_id");
        return claim != null && int.TryParse(claim.Value, out var orgId) ? orgId : null;
    }

    protected int GetRequiredOrgId()
    {
        var orgId = GetCurrentOrgId();
        if (!orgId.HasValue)
            throw new UnauthorizedAccessException("No organization context.");
        return orgId.Value;
    }

    protected string GetCurrentRole()
        => User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
}
