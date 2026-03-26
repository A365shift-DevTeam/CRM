namespace A365ShiftTracker.Domain.Common;

public abstract class BaseEntity
{
    public int Id { get; set; }
}

public abstract class AuditableEntity : BaseEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Interface for entities that belong to a specific user (data isolation).
/// </summary>
public interface IOwnedByUser
{
    int UserId { get; set; }
}
