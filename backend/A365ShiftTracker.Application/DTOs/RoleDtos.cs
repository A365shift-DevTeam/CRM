namespace A365ShiftTracker.Application.DTOs;

public class PermissionDto
{
    public int Id { get; set; }
    public string Module { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdateUserStatusRequest
{
    public bool IsActive { get; set; }
}

public class AdminResetPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}
