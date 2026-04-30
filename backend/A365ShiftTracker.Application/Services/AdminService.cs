using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.Extensions.Logging;
namespace A365ShiftTracker.Application.Services;

public class AdminService : IAdminService
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<AdminService> _logger;

    public AdminService(IUnitOfWork uow, ILogger<AdminService> logger)
    {
        _uow = uow;
        _logger = logger;
    }

    public async Task<IEnumerable<PermissionDto>> GetAllPermissionsAsync()
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetAllPermissionsAsync));
            throw;
        }
    }
}

