using System.Net;
using System.Security.Claims;
using System.Text.Json;

namespace A365ShiftTracker.API.Middleware;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    // These paths are allowed without a full org context (login, logout, password reset flows)
    private static readonly HashSet<string> _bypass = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/auth/login",
        "/api/auth/logout",
        "/api/auth/send-otp",
        "/api/auth/verify-otp",
        "/api/auth/verify-totp",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/auth/reset-first-password",
    };

    public TenantMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip unauthenticated requests and bypassed paths
        if (!context.User.Identity?.IsAuthenticated == true ||
            _bypass.Contains(context.Request.Path.Value ?? string.Empty))
        {
            await _next(context);
            return;
        }

        var role = context.User.FindFirst(ClaimTypes.Role)?.Value;

        // Only enforce org_id presence for non-SUPER_ADMIN authenticated users
        if (!string.IsNullOrEmpty(role) && role != "SUPER_ADMIN")
        {
            var orgIdClaim = context.User.FindFirst("org_id")?.Value;
            if (string.IsNullOrEmpty(orgIdClaim))
            {
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(JsonSerializer.Serialize(new
                {
                    success = false,
                    message = "No organization assigned to this user."
                }));
                return;
            }
        }

        await _next(context);
    }
}
