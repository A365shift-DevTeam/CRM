using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; } = true;
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }

    // Email OTP 2FA
    public string? OtpCode { get; set; }          // BCrypt-hashed 6-digit code
    public DateTime? OtpExpiry { get; set; }

    // TOTP Authenticator App
    public string? TotpSecret { get; set; }        // Base32 secret (stored encrypted via EF converter)
    public bool IsTotpEnabled { get; set; } = false;

    // Admin 2FA control
    public bool TwoFactorRequired { get; set; } = false;
    public string TwoFactorMethod { get; set; } = "email"; // "email" | "totp"

    public int? OrgId { get; set; }
    public Organization? Organization { get; set; }

    // Plan / billing
    public string Plan { get; set; } = "Free";
    public DateTime? PlanPurchasedAt { get; set; }
    public DateTime? PlanExpiresAt { get; set; }

    // Navigation
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
