using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Company : AuditableEntity, IOwnedByUser
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Industry { get; set; }
    public string? Size { get; set; }
    public string? Website { get; set; }
    public string? Address { get; set; }
    public string? Country { get; set; }
    public string? Gstin { get; set; }
    public string? Pan { get; set; }
    public string? Cin { get; set; }
    public string? MsmeStatus { get; set; } = "NON MSME";
    public string? TdsSection { get; set; }
    public decimal? TdsRate { get; set; }
    public string? InternationalTaxId { get; set; }
    public string? Tags { get; set; }
}
