using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _env;

    public AuthController(IAuthService authService, IWebHostEnvironment env)
    {
        _authService = authService;
        _env = env;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Register(RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        SetAuthCookie(result.Token);
        result.Token = string.Empty; // don't expose token in response body
        return Ok(ApiResponse<AuthResponse>.Ok(result, "Registration successful."));
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        SetAuthCookie(result.Token);
        result.Token = string.Empty; // don't expose token in response body
        return Ok(ApiResponse<AuthResponse>.Ok(result, "Login successful."));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("auth_token", new CookieOptions
        {
            Path = "/",
            SameSite = SameSiteMode.None,
            Secure = true
        });
        // Also delete with the dev-mode options in case it was set without Secure
        Response.Cookies.Delete("auth_token", new CookieOptions { Path = "/" });
        return Ok(ApiResponse<bool>.Ok(true, "Logged out successfully."));
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse<string>>> ForgotPassword(ForgotPasswordRequest request)
    {
        var token = await _authService.RequestPasswordResetAsync(request.Email);
        return Ok(ApiResponse<string>.Ok(token, "Password reset token generated."));
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse<bool>>> ResetPassword(ResetPasswordRequest request)
    {
        await _authService.ResetPasswordAsync(request.Token, request.NewPassword);
        return Ok(ApiResponse<bool>.Ok(true, "Password reset successful."));
    }

    // ── Helpers ────────────────────────────────────────────────

    private void SetAuthCookie(string token)
    {
        var isProduction = !_env.IsDevelopment();
        Response.Cookies.Append("auth_token", token, new CookieOptions
        {
            HttpOnly  = true,
            Secure    = isProduction,           // HTTPS-only in production
            SameSite  = isProduction
                            ? SameSiteMode.Strict
                            : SameSiteMode.Lax, // Lax works for localhost cross-port
            Expires   = DateTimeOffset.UtcNow.AddHours(1),
            Path      = "/"
        });
    }
}
