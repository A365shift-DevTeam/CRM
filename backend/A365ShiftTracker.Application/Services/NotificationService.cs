using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _uow;

    public NotificationService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<NotificationDto>> GetAllAsync(int userId)
    {
        var notifications = await _uow.Notifications.FindAsync(n => n.UserId == userId);
        return notifications.OrderByDescending(n => n.CreatedAt).Select(MapToDto);
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _uow.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task MarkAsReadAsync(int id, int userId)
    {
        var entity = await _uow.Notifications.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Notification {id} not found.");
        if (entity.UserId != userId) throw new UnauthorizedAccessException();
        entity.IsRead = true;
        await _uow.Notifications.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        var unread = await _uow.Notifications.FindAsync(n => n.UserId == userId && !n.IsRead);
        foreach (var n in unread)
        {
            n.IsRead = true;
            await _uow.Notifications.UpdateAsync(n);
        }
        await _uow.SaveChangesAsync();
    }

    public async Task<NotificationDto> CreateAsync(CreateNotificationRequest request)
    {
        var entity = new Notification
        {
            UserId = request.UserId,
            Title = request.Title,
            Message = request.Message,
            Type = request.Type,
            EntityType = request.EntityType,
            EntityId = request.EntityId
        };
        await _uow.Notifications.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var entity = await _uow.Notifications.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Notification {id} not found.");
        if (entity.UserId != userId) throw new UnauthorizedAccessException();
        await _uow.Notifications.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static NotificationDto MapToDto(Notification n) => new()
    {
        Id = n.Id,
        Title = n.Title,
        Message = n.Message,
        Type = n.Type,
        IsRead = n.IsRead,
        EntityType = n.EntityType,
        EntityId = n.EntityId,
        CreatedAt = n.CreatedAt
    };
}
