namespace A365ShiftTracker.Application.Interfaces;

public interface IPermissionService
{
    Task<List<string>> GetPermissionsAsync(int userId, int? orgId, string role);
    Task<bool> HasPermissionAsync(int userId, int? orgId, string role, string permissionCode);
}
