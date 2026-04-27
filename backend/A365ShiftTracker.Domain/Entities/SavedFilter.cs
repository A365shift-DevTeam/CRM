using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class SavedFilter : AuditableEntity, IOwnedByUser, IOrgScoped
{
    public int UserId { get; set; }
    public int OrgId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string FilterJson { get; set; } = "{}";
}
