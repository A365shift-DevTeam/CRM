using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Note : AuditableEntity, IOwnedByUser
{
    public int UserId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Content { get; set; } = string.Empty;
}
