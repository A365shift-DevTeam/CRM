namespace A365ShiftTracker.Application.DTOs;

public class ProjectFinanceDto
{
    public int Id { get; set; }
    public string? ProjectId { get; set; }
    public string? ClientName { get; set; }
    public string? ClientAddress { get; set; }
    public string? ClientGstin { get; set; }
    public string? Delivery { get; set; }
    public decimal? DealValue { get; set; }
    public string Currency { get; set; } = "AED";
    public string? Location { get; set; }
    public string Status { get; set; } = "Active";
    public string? Type { get; set; }
    public DateTime DateCreated { get; set; }
    public List<MilestoneDto> Milestones { get; set; } = new();
    public List<StakeholderDto> Stakeholders { get; set; } = new();
    public List<ChargeDto> Charges { get; set; } = new();
}

public class CreateProjectFinanceRequest
{
    public string? ProjectId { get; set; }
    public string? ClientName { get; set; }
    public string? ClientAddress { get; set; }
    public string? ClientGstin { get; set; }
    public string? Delivery { get; set; }
    public decimal? DealValue { get; set; }
    public string Currency { get; set; } = "AED";
    public string? Location { get; set; }
    public string Status { get; set; } = "Active";
    public string? Type { get; set; }
    public List<CreateMilestoneRequest> Milestones { get; set; } = new();
    public List<CreateStakeholderRequest> Stakeholders { get; set; } = new();
    public List<CreateChargeRequest> Charges { get; set; } = new();
}

public class UpdateProjectFinanceRequest : CreateProjectFinanceRequest
{
}

// Milestone
public class MilestoneDto
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public decimal? Percentage { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime? InvoiceDate { get; set; }
    public DateTime? PaidDate { get; set; }
    public bool IsCustomName { get; set; }
    public int Order { get; set; }
}

public class CreateMilestoneRequest
{
    public string? Name { get; set; }
    public decimal? Percentage { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime? InvoiceDate { get; set; }
    public DateTime? PaidDate { get; set; }
    public bool IsCustomName { get; set; }
    public int Order { get; set; }
}

// Stakeholder
public class StakeholderDto
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public decimal? Percentage { get; set; }
    public decimal? PayoutTax { get; set; }
    public string PayoutStatus { get; set; } = "Pending";
    public DateTime? PaidDate { get; set; }
}

public class CreateStakeholderRequest
{
    public string? Name { get; set; }
    public decimal? Percentage { get; set; }
    public decimal? PayoutTax { get; set; }
    public string PayoutStatus { get; set; } = "Pending";
    public DateTime? PaidDate { get; set; }
}

// Charge
public class ChargeDto
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? TaxType { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public decimal? Percentage { get; set; }
}

public class CreateChargeRequest
{
    public string? Name { get; set; }
    public string? TaxType { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public decimal? Percentage { get; set; }
}
