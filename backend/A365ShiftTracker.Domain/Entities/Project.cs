using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Project : AuditableEntity
{
    public string? CustomId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ClientName { get; set; }
    public int ActiveStage { get; set; } = 0;
    public int Delay { get; set; } = 0;
    public string? Type { get; set; }
    public string? History { get; set; } // JSON string
}
