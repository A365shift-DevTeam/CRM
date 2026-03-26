namespace A365ShiftTracker.Application.DTOs;

// ─── Role DTOs ─────────────────────────────────────────────
public class RoleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsSystem { get; set; }
    public List<string> Permissions { get; set; } = new(); // permission codes
}

public class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<int> PermissionIds { get; set; } = new();
}

public class UpdateRoleRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public List<int>? PermissionIds { get; set; }
}

// ─── Permission DTOs ───────────────────────────────────────
public class PermissionDto
{
    public int Id { get; set; }
    public string Module { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
}

// ─── User Management DTOs ──────────────────────────────────
public class UserDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public List<string> Roles { get; set; } = new();
    public List<string> Permissions { get; set; } = new(); // flattened permission codes
}

public class UpdateUserRolesRequest
{
    public List<int> RoleIds { get; set; } = new();
}

public class UpdateUserStatusRequest
{
    public bool IsActive { get; set; }
}

public class AdminResetPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}
