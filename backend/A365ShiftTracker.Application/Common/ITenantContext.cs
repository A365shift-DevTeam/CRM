namespace A365ShiftTracker.Application.Common;

public interface ITenantContext
{
    int UserId { get; }
    int? OrgId { get; }
    string Role { get; }
    bool IsSuperAdmin { get; }
}
