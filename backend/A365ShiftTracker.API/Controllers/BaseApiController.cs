using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using A365ShiftTracker.Application.Common;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

public abstract class BaseApiController : ControllerBase
{
    private ILogger? _logger;

    protected ILogger Logger =>
        _logger ??= HttpContext.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger(GetType().FullName!);

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

    // ── Common HTTP result helpers ────────────────────────────────

    protected ActionResult InternalError(Exception ex, string? context = null)
    {
        Logger.LogError(ex, "Unhandled error{Context}", context is null ? "" : $" in {context}");
        return StatusCode(500, ApiResponse<object>.Fail("An unexpected error occurred."));
    }

    protected ActionResult NotFoundResult(string message)
        => NotFound(ApiResponse<object>.Fail(message));

    protected ActionResult ForbiddenResult(string message)
        => StatusCode(403, ApiResponse<object>.Fail(message));

    protected ActionResult BadRequestResult(string message)
        => BadRequest(ApiResponse<object>.Fail(message));

    protected ActionResult UnauthorizedResult(string message)
        => Unauthorized(ApiResponse<object>.Fail(message));
}
