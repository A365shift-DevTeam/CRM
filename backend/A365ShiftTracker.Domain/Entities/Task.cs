using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class TaskItem : AuditableEntity, IOwnedByUser, IOrgScoped
{
    public int UserId { get; set; }
    public int OrgId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public string Priority { get; set; } = "Medium";
    public DateTime? DueDate { get; set; }
    public string? Values { get; set; } // JSON string for dynamic columns
}
