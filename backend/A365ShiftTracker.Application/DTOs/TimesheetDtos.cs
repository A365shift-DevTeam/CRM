namespace A365ShiftTracker.Application.DTOs;

public class TimesheetEntryDto
{
    public int Id { get; set; }
    public string? Task { get; set; }
    public DateTime? StartDatetime { get; set; }
    public DateTime? EndDatetime { get; set; }
    public string? Notes { get; set; }
    public string? Person { get; set; }
    public string? Customer { get; set; }
    public string? Site { get; set; }
    public string? Attachments { get; set; }
    public object? Values { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateTimesheetEntryRequest
{
    public string? Task { get; set; }
    public DateTime? StartDatetime { get; set; }
    public DateTime? EndDatetime { get; set; }
    public string? Notes { get; set; }
    public string? Person { get; set; }
    public string? Customer { get; set; }
    public string? Site { get; set; }
    public string? Attachments { get; set; }
    public object? Values { get; set; }
}

public class UpdateTimesheetEntryRequest : CreateTimesheetEntryRequest
{
}

// Columns
public class TimesheetColumnDto
{
    public int Id { get; set; }
    public string ColId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "text";
    public bool Required { get; set; }
    public bool Visible { get; set; }
    public int Order { get; set; }
    public object? Config { get; set; }
}

public class CreateTimesheetColumnRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "text";
    public bool Required { get; set; } = false;
    public bool Visible { get; set; } = true;
    public object? Config { get; set; }
}

public class UpdateTimesheetColumnRequest
{
    public string? Name { get; set; }
    public string? Type { get; set; }
    public bool? Required { get; set; }
    public bool? Visible { get; set; }
    public object? Config { get; set; }
}

public class ReorderColumnsRequest
{
    public List<string> OrderedColIds { get; set; } = new();
}
