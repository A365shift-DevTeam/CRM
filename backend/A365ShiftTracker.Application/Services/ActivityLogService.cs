using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class ActivityLogService : IActivityLogService
{
    private readonly IUnitOfWork _uow;

    public ActivityLogService(IUnitOfWork uow) => _uow = uow;

    public async Task<PagedResult<ActivityLogDto>> GetAllAsync(int userId, int page, int pageSize)
    {
        var paged = await _uow.ActivityLogs.GetPagedAsync(
            l => l.UserId == userId, page, pageSize,
            q => q.OrderByDescending(l => l.Timestamp));
        return new PagedResult<ActivityLogDto>
        {
            Items = paged.Items.Select(MapToDto),
            TotalCount = paged.TotalCount, Page = paged.Page, PageSize = paged.PageSize
        };
    }

    public async Task<IEnumerable<ActivityLogDto>> GetByEntityAsync(string entityType, int entityId, int userId)
    {
        var logs = await _uow.ActivityLogs.FindAsync(l =>
            l.UserId == userId && l.EntityType == entityType && l.EntityId == entityId);
        return logs.OrderByDescending(l => l.Timestamp).Select(MapToDto);
    }

    public async Task<IEnumerable<ActivityLogDto>> GetRecentAsync(int userId, int count = 20)
    {
        var logs = await _uow.ActivityLogs.FindAsync(l => l.UserId == userId);
        return logs.OrderByDescending(l => l.Timestamp).Take(count).Select(MapToDto);
    }

    public async Task LogAsync(string entityType, int entityId, string action, string? details, int userId)
    {
        var entity = new ActivityLog
        {
            UserId = userId,
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            Details = details,
            Timestamp = DateTime.UtcNow
        };
        await _uow.ActivityLogs.AddAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static ActivityLogDto MapToDto(ActivityLog l) => new()
    {
        Id = l.Id,
        UserId = l.UserId,
        EntityType = l.EntityType,
        EntityId = l.EntityId,
        Action = l.Action,
        Details = l.Details,
        Timestamp = l.Timestamp,
        CreatedAt = l.CreatedAt
    };
}
