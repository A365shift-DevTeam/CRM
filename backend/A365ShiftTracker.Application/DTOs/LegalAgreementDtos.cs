namespace A365ShiftTracker.Application.DTOs;

public class LegalAgreementDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Version { get; set; }
    public string? Description { get; set; }
    public int? ContactId { get; set; }
    public int? CompanyId { get; set; }
    public int? ProjectId { get; set; }
    public int? LeadId { get; set; }
    public string? OurSignatory { get; set; }
    public string? CounterSignatory { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? SignedDate { get; set; }
    public bool AutoRenew { get; set; }
    public int? RenewalNoticeDays { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public string? UpdatedByName { get; set; }
}

public class CreateLegalAgreementRequest
{
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft";
    public string? Version { get; set; }
    public string? Description { get; set; }
    public int? ContactId { get; set; }
    public int? CompanyId { get; set; }
    public int? ProjectId { get; set; }
    public int? LeadId { get; set; }
    public string? OurSignatory { get; set; }
    public string? CounterSignatory { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? SignedDate { get; set; }
    public bool AutoRenew { get; set; } = false;
    public int? RenewalNoticeDays { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public string? Notes { get; set; }
}

public class UpdateLegalAgreementRequest : CreateLegalAgreementRequest { }
