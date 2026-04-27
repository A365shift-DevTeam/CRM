using System.IdentityModel.Tokens.Jwt;
using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("AuthPolicy")]
public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _env;

    public AuthController(IAuthService authService, IWebHostEnvironment env)
    {
        _authService = authService;
        _env = env;
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);

        if (result.Requires2FA)
            return Ok(ApiResponse<LoginResponse>.Ok(result, "2FA required."));

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

    [HttpPost("reset-first-password")]
    [Authorize]
    [DisableRateLimiting]
    public async Task<ActionResult<ApiResponse<bool>>> ResetFirstPassword(ResetFirstPasswordRequest request)
    {
        await _authService.ResetFirstPasswordAsync(GetCurrentUserId(), request.NewPassword);
        return Ok(ApiResponse<bool>.Ok(true, "Password updated. Please log in again."));
    }

    [HttpGet("totp/setup")]
    [Authorize]
    [DisableRateLimiting]
    public async Task<ActionResult<ApiResponse<TotpSetupResponse>>> TotpSetup()
    {
        var result = await _authService.GetTotpSetupAsync(GetCurrentUserId());
        return Ok(ApiResponse<TotpSetupResponse>.Ok(result));
    }

    [HttpPost("totp/verify-setup")]
    [Authorize]
    [DisableRateLimiting]
    public async Task<ActionResult<ApiResponse<bool>>> TotpVerifySetup(VerifyTotpSetupRequest request)
    {
        await _authService.VerifyAndEnableTotpAsync(GetCurrentUserId(), request);
        return Ok(ApiResponse<bool>.Ok(true, "Authenticator app enabled."));
    }

    [HttpPost("totp/disable")]
    [Authorize]
    [DisableRateLimiting]
    public async Task<ActionResult<ApiResponse<bool>>> TotpDisable()
    {
        await _authService.DisableTotpAsync(GetCurrentUserId());
        return Ok(ApiResponse<bool>.Ok(true, "Authenticator app disabled."));
    }

    [HttpPost("email-otp/send-enable")]
    [Authorize]
    [DisableRateLimiting]
    public async Task<ActionResult<ApiResponse<bool>>> EmailOtpSendEnable()
    {
        await _authService.SendEmailOtpEnableAsync(GetCurrentUserId());
        return Ok(ApiResponse<bool>.Ok(true, "Verification code sent to your email."));
    }

    [HttpPost("email-otp/verify-enable")]
    [Authorize]
    [DisableRateLimiting]
    public async Task<ActionResult<ApiResponse<bool>>> EmailOtpVerifyEnable(VerifyEmailOtpEnableRequest request)
    {
        await _authService.VerifyAndEnableEmailOtpAsync(GetCurrentUserId(), request.Code);
        return Ok(ApiResponse<bool>.Ok(true, "Email OTP enabled successfully."));
    }

    [HttpPost("email-otp/disable")]
    [Authorize]
    [DisableRateLimiting]
    public async Task<ActionResult<ApiResponse<bool>>> EmailOtpDisable()
    {
        await _authService.DisableEmailOtpAsync(GetCurrentUserId());
        return Ok(ApiResponse<bool>.Ok(true, "Email OTP disabled."));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    [DisableRateLimiting]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("auth_token", new CookieOptions { Path = "/", SameSite = SameSiteMode.None, Secure = true });
        Response.Cookies.Delete("auth_token", new CookieOptions { Path = "/" });
        return Ok(ApiResponse<bool>.Ok(true, "Logged out successfully."));
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse<bool>>> ForgotPassword(ForgotPasswordRequest request)
    {
        await _authService.RequestPasswordResetAsync(request.Email);
        return Ok(ApiResponse<bool>.Ok(true, "If an account with that email exists, a reset link has been sent."));
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
