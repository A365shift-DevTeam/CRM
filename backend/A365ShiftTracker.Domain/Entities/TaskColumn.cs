using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class TaskColumn : AuditableEntity, IOrgScoped
{
    public int OrgId { get; set; }
    public string ColId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "text";
    public bool Visible { get; set; } = true;
    public bool Required { get; set; } = false;
    public int Order { get; set; } = 0;
    public string? Config { get; set; } // JSON string
}
