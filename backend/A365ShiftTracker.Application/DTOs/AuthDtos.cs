using System.ComponentModel.DataAnnotations;

namespace A365ShiftTracker.Application.DTOs;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    [StringLength(100)]
    public string? DisplayName { get; set; }
}

public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string NewPassword { get; set; } = string.Empty;
}

public class SendOtpRequest
{
    [Required]
    public string PartialToken { get; set; } = string.Empty;
}

public class VerifyOtpRequest
{
    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string Code { get; set; } = string.Empty;

    [Required]
    public string PartialToken { get; set; } = string.Empty;
}

public class VerifyTotpRequest
{
    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string Code { get; set; } = string.Empty;

    [Required]
    public string PartialToken { get; set; } = string.Empty;
}

public class VerifyTotpSetupRequest
{
    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string Code { get; set; } = string.Empty;
}

public class VerifyEmailOtpEnableRequest
{
    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string Code { get; set; } = string.Empty;
}

public class ResetFirstPasswordRequest
{
    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string NewPassword { get; set; } = string.Empty;
}

public class AuthResponse
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string Token { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // SUPER_ADMIN | ORG_ADMIN | MANAGER | EMPLOYEE
    public List<string> Permissions { get; set; } = new();
    public bool IsTotpEnabled { get; set; } = false;
    public bool TwoFactorRequired { get; set; } = false;
    public string TwoFactorMethod { get; set; } = "email";
    public int? OrgId { get; set; }
    public bool IsFirstLogin { get; set; } = false;
}

public class LoginResponse
{
    // Returned when 2FA is NOT required — full auth granted
    public int? Id { get; set; }
    public string? Email { get; set; }
    public string? DisplayName { get; set; }
    public string Token { get; set; } = string.Empty;
    public string? Role { get; set; } // SUPER_ADMIN | ORG_ADMIN | MANAGER | EMPLOYEE
    public List<string> Permissions { get; set; } = new();
    public bool IsTotpEnabled { get; set; } = false;
    public bool TwoFactorRequired { get; set; } = false;
    public string TwoFactorMethod { get; set; } = "email"; // "email" | "totp"

    // Returned when 2FA IS required — partial auth
    public bool Requires2FA { get; set; } = false;
    public string PartialToken { get; set; } = string.Empty;

    // TOTP required but not configured yet
    public bool TotpSetupRequired { get; set; } = false;

    // Org context
    public int? OrgId { get; set; }
    public bool IsFirstLogin { get; set; } = false;
    public string? OrgStatus { get; set; } // TRIAL | ACTIVE | SUSPENDED
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
