using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class ActivityLog : AuditableEntity, IOwnedByUser, IOrgScoped
{
    public int UserId { get; set; }
    public int OrgId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
