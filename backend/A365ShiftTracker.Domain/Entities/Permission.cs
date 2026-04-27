using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Permission : BaseEntity
{
    public string Module { get; set; } = string.Empty;   // e.g. "Dashboard", "Sales", "Contacts"
    public string Action { get; set; } = string.Empty;   // e.g. "View", "Create", "Edit", "Delete"
    public string Code { get; set; } = string.Empty;     // e.g. "sales.view", "contacts.edit"
    public string? Description { get; set; }
}
