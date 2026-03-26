using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    string GenerateJwtToken(int userId, string email);
    Task<string> RequestPasswordResetAsync(string email);
    Task ResetPasswordAsync(string token, string newPassword);
}
