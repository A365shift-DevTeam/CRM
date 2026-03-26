using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Notification : AuditableEntity, IOwnedByUser
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public bool IsRead { get; set; } = false;
    public string? EntityType { get; set; }
    public int? EntityId { get; set; }
}
