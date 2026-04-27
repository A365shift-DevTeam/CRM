using System.Net;
using System.Security.Claims;
using System.Text.Json;

namespace A365ShiftTracker.API.Middleware;

public class FirstLoginMiddleware
{
    private readonly RequestDelegate _next;

    private static readonly HashSet<string> _bypass = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/auth/reset-first-password",
        "/api/auth/logout",
        "/api/auth/login",
        "/api/auth/send-otp",
        "/api/auth/verify-otp",
        "/api/auth/verify-totp",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
    };

    public FirstLoginMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.User.Identity?.IsAuthenticated == true ||
            _bypass.Contains(context.Request.Path.Value ?? string.Empty))
        {
            await _next(context);
            return;
        }

        // Read IsFirstLogin from the JWT claim (set at login time) — no DB hit needed
        var isFirstLogin = context.User.FindFirst("is_first_login")?.Value == "true";

        if (isFirstLogin)
        {
            context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                success = false,
                requiresPasswordReset = true,
                message = "You must reset your password before continuing."
            }));
            return;
        }

        await _next(context);
    }
}
