using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class OrgRolePermission : BaseEntity, IOrgScoped
{
    public int OrgId { get; set; }
    public string Role { get; set; } = string.Empty;           // "MANAGER" | "EMPLOYEE"
    public string PermissionCode { get; set; } = string.Empty; // e.g. "contacts.view"

    public Organization Organization { get; set; } = null!;
}
