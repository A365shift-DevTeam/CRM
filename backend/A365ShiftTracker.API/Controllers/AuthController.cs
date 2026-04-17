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
        result.Token = string.Empty;
        return Ok(ApiResponse<AuthResponse>.Ok(result, "Registration successful."));
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);

        if (result.Requires2FA)
        {
            // Return partial token in body — no auth cookie set yet
            return Ok(ApiResponse<LoginResponse>.Ok(result, "2FA required."));
        }

        SetAuthCookie(result.Token);
        result.Token = string.Empty;
        return Ok(ApiResponse<LoginResponse>.Ok(result, "Login successful."));
    }

    [HttpPost("send-otp")]
    public async Task<ActionResult<ApiResponse<bool>>> SendOtp([FromBody] SendOtpRequest request)
    {
        await _authService.SendOtpAsync(request.PartialToken);
        return Ok(ApiResponse<bool>.Ok(true, "OTP sent to your email."));
    }

    [HttpPost("verify-otp")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> VerifyOtp(VerifyOtpRequest request)
    {
        var result = await _authService.VerifyOtpAsync(request);
        SetAuthCookie(result.Token);
        result.Token = string.Empty;
        return Ok(ApiResponse<LoginResponse>.Ok(result, "Login successful."));
    }

    [HttpPost("verify-totp")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> VerifyTotp(VerifyTotpRequest request)
    {
        var result = await _authService.VerifyTotpAsync(request);
        SetAuthCookie(result.Token);
        result.Token = string.Empty;
        return Ok(ApiResponse<LoginResponse>.Ok(result, "Login successful."));
    }

    [HttpGet("totp/setup")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<TotpSetupResponse>>> TotpSetup()
    {
        var sub = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("Not authenticated.");
        var uid = int.Parse(sub);
        var result = await _authService.GetTotpSetupAsync(uid);
        return Ok(ApiResponse<TotpSetupResponse>.Ok(result));
    }

    [HttpPost("totp/verify-setup")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> TotpVerifySetup(VerifyTotpSetupRequest request)
    {
        var sub = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("Not authenticated.");
        var userId = int.Parse(sub);
        await _authService.VerifyAndEnableTotpAsync(userId, request);
        return Ok(ApiResponse<bool>.Ok(true, "Authenticator app enabled."));
    }

    [HttpPost("totp/disable")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> TotpDisable()
    {
        var sub = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("Not authenticated.");
        var userId = int.Parse(sub);
        await _authService.DisableTotpAsync(userId);
        return Ok(ApiResponse<bool>.Ok(true, "Authenticator app disabled."));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("auth_token", new CookieOptions { Path = "/", SameSite = SameSiteMode.None, Secure = true });
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

    private void SetAuthCookie(string token)
    {
        var isProduction = !_env.IsDevelopment();
        Response.Cookies.Append("auth_token", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = isProduction ? SameSiteMode.Strict : SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddHours(8),
            Path = "/"
        });
    }
}
