namespace A365ShiftTracker.Application.DTOs;

public class ContactDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Company { get; set; }
    public string? Location { get; set; }
    public string? ClientAddress { get; set; }
    public string? ClientCountry { get; set; }
    public string? Gstin { get; set; }
    public string? Pan { get; set; }
    public string? Cin { get; set; }
    public string? InternationalTaxId { get; set; }
    public string? MsmeStatus { get; set; }
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
}

public class CreateContactRequest
{
    public string Name { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Company { get; set; }
    public string? Location { get; set; }
    public string? ClientAddress { get; set; }
    public string? ClientCountry { get; set; }
    public string? Gstin { get; set; }
    public string? Pan { get; set; }
    public string? Cin { get; set; }
    public string? InternationalTaxId { get; set; }
    public string? MsmeStatus { get; set; }
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
}

public class UpdateContactRequest : CreateContactRequest
{
}

public class ContactColumnDto
{
    public int Id { get; set; }
    public string ColId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "text";
    public bool Visible { get; set; }
    public bool Required { get; set; }
    public int Order { get; set; }
    public object? Config { get; set; }
}

public class SaveContactColumnsRequest
{
    public List<ContactColumnDto> Columns { get; set; } = new();
}
