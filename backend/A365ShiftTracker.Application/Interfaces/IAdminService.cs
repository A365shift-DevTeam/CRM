using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IAdminService
{
    // Permissions
    Task<IEnumerable<PermissionDto>> GetAllPermissionsAsync();
}
