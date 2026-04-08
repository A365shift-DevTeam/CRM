using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface INotificationService
{
    Task<IEnumerable<NotificationDto>> GetAllAsync(int userId);
    Task<int> GetUnreadCountAsync(int userId);
    Task MarkAsReadAsync(int id, int userId);
    Task MarkAllAsReadAsync(int userId);
    Task<NotificationDto> CreateAsync(CreateNotificationRequest request);
    Task DeleteAsync(int id, int userId);
    Task<IEnumerable<AlertDto>> GenerateAlertsAsync(int userId);
}
