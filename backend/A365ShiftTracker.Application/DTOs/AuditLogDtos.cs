namespace A365ShiftTracker.Application.DTOs;

public class AuditLogDto
{
    public int Id { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string Action { get; set; } = string.Empty;
    public int ChangedByUserId { get; set; }
    public string ChangedByName { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public string? IpAddress { get; set; }
}
