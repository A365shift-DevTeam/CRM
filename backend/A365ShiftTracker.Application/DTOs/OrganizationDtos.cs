using System.ComponentModel.DataAnnotations;

namespace A365ShiftTracker.Application.DTOs;

public class OrganizationDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Status { get; set; } = "TRIAL"; // TRIAL | ACTIVE | SUSPENDED
    public DateTime CreatedAt { get; set; }
    public DateTime? TrialEndsAt { get; set; }
    public DateTime? SuspendedAt { get; set; }
    public int UserCount { get; set; }
    public int? UserLimit { get; set; } // null = unlimited
}

public class CreateOrganizationRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Slug { get; set; } = string.Empty;

    public DateTime? TrialEndsAt { get; set; }

    [Range(1, int.MaxValue)]
    public int? UserLimit { get; set; }
}

public class UpdateOrgStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty; // TRIAL | ACTIVE | SUSPENDED
}

public class SetUserLimitRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "User limit must be at least 1.")]
    public int UserLimit { get; set; }
}

public class ToggleUserStatusRequest
{
    [Required]
    public bool IsActive { get; set; }
}

public class UserDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsFirstLogin { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int? OrgId { get; set; }
}

public class CreateUserRequest
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [StringLength(100)]
    public string? DisplayName { get; set; }

    [Required]
    public string Role { get; set; } = "EMPLOYEE"; // MANAGER | EMPLOYEE (ORG_ADMIN only via SuperAdmin)
}

public class UpdateUserRequest
{
    public string? DisplayName { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}

public class SetRolePermissionsRequest
{
    [Required]
    public List<string> PermissionCodes { get; set; } = new();
}

public class OrgSalesSettingsDto
{
    public int OrgId { get; set; }
    public object? ProductStages { get; set; }
    public object? ServiceStages { get; set; }
    public object? DeliveryStages { get; set; }
    public object? FinanceStages { get; set; }
    public object? LegalStages { get; set; }
    public string ProductLabel { get; set; } = "Products";
    public string ServiceLabel { get; set; } = "Services";
    public DateTime UpdatedAt { get; set; }
}

public class UpsertOrgSalesSettingsRequest
{
    public object? ProductStages { get; set; }
    public object? ServiceStages { get; set; }
    public object? DeliveryStages { get; set; }
    public object? FinanceStages { get; set; }
    public object? LegalStages { get; set; }
    public string ProductLabel { get; set; } = "Products";
    public string ServiceLabel { get; set; } = "Services";
}
