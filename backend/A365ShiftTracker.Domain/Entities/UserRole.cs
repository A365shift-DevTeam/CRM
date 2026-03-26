using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class UserRole : BaseEntity
{
    public int UserId { get; set; }
    public int RoleId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;
}
