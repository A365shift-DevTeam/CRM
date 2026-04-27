using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;

namespace A365ShiftTracker.Application.Services;

public class AdminService : IAdminService
{
    private readonly IUnitOfWork _uow;

    public AdminService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<PermissionDto>> GetAllPermissionsAsync()
    {
        var permissions = await _uow.Permissions.GetAllAsync();
        return permissions.Select(p => new PermissionDto
        {
            Id = p.Id,
            Module = p.Module,
            Action = p.Action,
            Code = p.Code,
            Description = p.Description
        });
    }
}
