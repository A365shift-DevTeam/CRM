namespace A365ShiftTracker.Application.DTOs;

public class TicketDto
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Category { get; set; }
    public int? ContactId { get; set; }
    public int? CompanyId { get; set; }
    public int? ProjectId { get; set; }
    public int? LeadId { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public bool IsAiGenerated { get; set; }
    public string? AiSource { get; set; }
    public decimal? AiConfidence { get; set; }
    public string? AiRawInput { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public List<TicketCommentDto> Comments { get; set; } = new();
}

public class TicketCommentDto
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public string Comment { get; set; } = string.Empty;
    public bool IsInternal { get; set; }
    public int AuthorUserId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateTicketRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "Internal Task";
    public string Priority { get; set; } = "Medium";
    public string Status { get; set; } = "Open";
    public string? Category { get; set; }
    public int? ContactId { get; set; }
    public int? CompanyId { get; set; }
    public int? ProjectId { get; set; }
    public int? LeadId { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsAiGenerated { get; set; } = false;
    public string? AiSource { get; set; }
    public decimal? AiConfidence { get; set; }
    public string? AiRawInput { get; set; }
}

public class UpdateTicketRequest : CreateTicketRequest
{
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
}

public class CreateTicketCommentRequest
{
    public string Comment { get; set; } = string.Empty;
    public bool IsInternal { get; set; } = false;
    public string AuthorName { get; set; } = string.Empty;
}

public class AiGenerateTicketRequest
{
    public string RawText { get; set; } = string.Empty;
}

public class AiGeneratedTicketDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "Internal Task";
    public string Priority { get; set; } = "Medium";
    public string? Category { get; set; }
    public string? SuggestedContactName { get; set; }
    public string? SuggestedCompanyName { get; set; }
    public decimal Confidence { get; set; }
}

public class TicketStatsDto
{
    public int Open { get; set; }
    public int InProgress { get; set; }
    public int Pending { get; set; }
    public int Resolved { get; set; }
    public int Closed { get; set; }
    public int Critical { get; set; }
    public int High { get; set; }
    public int Medium { get; set; }
    public int Low { get; set; }
}
