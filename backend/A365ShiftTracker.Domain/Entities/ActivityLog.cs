using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class ActivityLog : AuditableEntity, IOwnedByUser
{
    public int UserId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
