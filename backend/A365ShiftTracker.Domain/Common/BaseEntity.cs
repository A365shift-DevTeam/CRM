namespace A365ShiftTracker.Domain.Common;

public abstract class BaseEntity
{
    public int Id { get; set; }
}

public abstract class AuditableEntity : BaseEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int? CreatedByUserId { get; set; }
    public int? UpdatedByUserId { get; set; }
    public string? CreatedByName { get; set; }
    public string? UpdatedByName { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public int? DeletedByUserId { get; set; }
    public string? DeletedByName { get; set; }
}

/// <summary>
/// Interface for entities that belong to a specific user (data isolation).
/// </summary>
public interface IOwnedByUser
{
    int UserId { get; set; }
}

/// <summary>
/// Interface for entities scoped to an organization (multi-tenant data isolation).
/// </summary>
public interface IOrgScoped
{
    int OrgId { get; set; }
}
