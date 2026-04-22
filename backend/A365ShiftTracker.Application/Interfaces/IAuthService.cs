using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    string GenerateJwtToken(int userId, string email);
    Task RequestPasswordResetAsync(string email);
    Task ResetPasswordAsync(string token, string newPassword);

    // Email OTP
    Task SendOtpAsync(string partialToken);
    Task<LoginResponse> VerifyOtpAsync(VerifyOtpRequest request);

    // TOTP
    Task<LoginResponse> VerifyTotpAsync(VerifyTotpRequest request);
    Task<TotpSetupResponse> GetTotpSetupAsync(int userId);
    Task VerifyAndEnableTotpAsync(int userId, VerifyTotpSetupRequest request);
    Task DisableTotpAsync(int userId);

    // Email OTP self-enrollment
    Task SendEmailOtpEnableAsync(int userId);
    Task VerifyAndEnableEmailOtpAsync(int userId, string code);
    Task DisableEmailOtpAsync(int userId);

    // Admin TOTP management
    Task AdminResetUserTotpAsync(int userId);
}
