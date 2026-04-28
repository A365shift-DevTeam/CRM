using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Organization : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Status { get; set; } = "TRIAL"; // "TRIAL" | "ACTIVE" | "SUSPENDED"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? TrialEndsAt { get; set; }
    public DateTime? SuspendedAt { get; set; }
    public int? UserLimit { get; set; } // null = unlimited

    public ICollection<User> Members { get; set; } = new List<User>();
    public OrgSalesSettings? SalesSettings { get; set; }
    public ICollection<OrgRolePermission> RolePermissions { get; set; } = new List<OrgRolePermission>();
}
