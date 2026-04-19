namespace A365ShiftTracker.Application.DTOs;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
}

public class AuthResponse
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string Token { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public List<string> Permissions { get; set; } = new();
    public bool IsTotpEnabled { get; set; } = false;
    public bool TwoFactorRequired { get; set; } = false;
    public string TwoFactorMethod { get; set; } = "email";
}

public class LoginResponse
{
    // Returned when 2FA is NOT required — full auth granted
    public int? Id { get; set; }
    public string? Email { get; set; }
    public string? DisplayName { get; set; }
    public string Token { get; set; } = string.Empty;
    public string? Role { get; set; }
    public List<string> Permissions { get; set; } = new();
    public bool IsTotpEnabled { get; set; } = false;
    public bool TwoFactorRequired { get; set; } = false;
    public string TwoFactorMethod { get; set; } = "email"; // "email" | "totp"

    // Returned when 2FA IS required — partial auth
    public bool Requires2FA { get; set; } = false;
    public string PartialToken { get; set; } = string.Empty;

    // TOTP required by admin but user hasn't set it up yet — full login granted, prompt setup
    public bool TotpSetupRequired { get; set; } = false;
}

public class VerifyOtpRequest
{
    public string Code { get; set; } = string.Empty;
    public string PartialToken { get; set; } = string.Empty;
}

public class VerifyTotpRequest
{
    public string Code { get; set; } = string.Empty;
    public string PartialToken { get; set; } = string.Empty;
}

public class VerifyTotpSetupRequest
{
    public string Code { get; set; } = string.Empty;
}

public class TotpSetupResponse
{
    public string QrCodeUri { get; set; } = string.Empty;
    public string Secret { get; set; } = string.Empty;
}

public class Require2FARequest
{
    public bool Required { get; set; }
    public string Method { get; set; } = "email"; // "email" | "totp"
}

public class SendOtpRequest
{
    public string PartialToken { get; set; } = string.Empty;
}

public class VerifyEmailOtpEnableRequest
{
    public string Code { get; set; } = string.Empty;
}
