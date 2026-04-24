using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class OrgSalesSettings : BaseEntity
{
    public int OrgId { get; set; }
    public Organization Organization { get; set; } = null!;

    public string ProductStages { get; set; } = "[]";
    public string ServiceStages { get; set; } = "[]";
    public string DeliveryStages { get; set; } = "[]";
    public string FinanceStages { get; set; } = "[]";
    public string LegalStages { get; set; } = "[]";
    public string ProductLabel { get; set; } = "Products";
    public string ServiceLabel { get; set; } = "Services";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
