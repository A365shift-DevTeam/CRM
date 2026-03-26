using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class EmailTemplate : AuditableEntity, IOwnedByUser
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? Variables { get; set; }
}
