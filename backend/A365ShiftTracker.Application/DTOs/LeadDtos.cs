namespace A365ShiftTracker.Application.DTOs;

public class LeadDto
{
    public int Id { get; set; }
    public int? ContactId { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string? Company { get; set; }
    public string Source { get; set; } = "Inbound";
    public string Score { get; set; } = "Warm";
    public string Stage { get; set; } = "New";
    public string? AssignedTo { get; set; }
    public string? Notes { get; set; }
    public string? Type { get; set; }
    public decimal? ExpectedValue { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateLeadRequest
{
    public int? ContactId { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string? Company { get; set; }
    public string Source { get; set; } = "Inbound";
    public string Score { get; set; } = "Warm";
    public string Stage { get; set; } = "New";
    public string? AssignedTo { get; set; }
    public string? Notes { get; set; }
    public string? Type { get; set; }
    public decimal? ExpectedValue { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
}

public class UpdateLeadRequest : CreateLeadRequest { }
