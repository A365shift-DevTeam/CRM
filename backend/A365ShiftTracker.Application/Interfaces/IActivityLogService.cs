using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface IActivityLogService
{
    Task<PagedResult<ActivityLogDto>> GetAllAsync(int userId, int page, int pageSize);
    Task<IEnumerable<ActivityLogDto>> GetByEntityAsync(string entityType, int entityId, int userId);
    Task<IEnumerable<ActivityLogDto>> GetRecentAsync(int userId, int count = 20);
    Task LogAsync(string entityType, int entityId, string action, string? details, int userId);
}
