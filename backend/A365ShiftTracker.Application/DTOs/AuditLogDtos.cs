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

public class SuperAdminAuditLogDto : AuditLogDto
{
    public string? OrgName { get; set; }
    public int? OrgId { get; set; }
}

public class SuperAdminAuditLogPageDto
{
    public List<SuperAdminAuditLogDto> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
