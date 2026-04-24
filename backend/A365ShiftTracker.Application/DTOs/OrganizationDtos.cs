namespace A365ShiftTracker.Application.DTOs;

public class OrganizationDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateOrganizationRequest
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

public class JoinOrganizationRequest
{
    public string Slug { get; set; } = string.Empty;
}

public class OrgSalesSettingsDto
{
    public int OrgId { get; set; }
    public object? ProductStages { get; set; }
    public object? ServiceStages { get; set; }
    public object? DeliveryStages { get; set; }
    public object? FinanceStages { get; set; }
    public object? LegalStages { get; set; }
    public string ProductLabel { get; set; } = "Products";
    public string ServiceLabel { get; set; } = "Services";
    public DateTime UpdatedAt { get; set; }
}

public class UpsertOrgSalesSettingsRequest
{
    public object? ProductStages { get; set; }
    public object? ServiceStages { get; set; }
    public object? DeliveryStages { get; set; }
    public object? FinanceStages { get; set; }
    public object? LegalStages { get; set; }
    public string ProductLabel { get; set; } = "Products";
    public string ServiceLabel { get; set; } = "Services";
}
