using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class EntityTag : BaseEntity
{
    public int TagId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }

    // Navigation
    public Tag Tag { get; set; } = null!;
}
