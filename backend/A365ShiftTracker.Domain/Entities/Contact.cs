using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Contact : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Company { get; set; }
    public string? Location { get; set; }
    public string? ClientAddress { get; set; }
    public string? ClientCountry { get; set; } = "India";
    public string? Gstin { get; set; }
    public string? Pan { get; set; }
    public string? Cin { get; set; }
    public string? InternationalTaxId { get; set; }
    public string? MsmeStatus { get; set; } = "NON MSME";
    public string? TdsSection { get; set; }
    public decimal? TdsRate { get; set; }
    public string EntityType { get; set; } = "Individual";
    public string Status { get; set; } = "Active";
    public decimal? Rating { get; set; }
    public string? Reviews { get; set; }
    public int? Years { get; set; }
    public decimal? Margin { get; set; }
    public string? Avatar { get; set; }
    public decimal? MatchScore { get; set; }
    public string? MatchLabel { get; set; }
    public decimal? MatchPercentage { get; set; }
    public string? Services { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public ICollection<VendorResponse> VendorResponses { get; set; } = new List<VendorResponse>();
    public ICollection<VendorEmail> VendorEmails { get; set; } = new List<VendorEmail>();
}
