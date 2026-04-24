namespace A365ShiftTracker.Application.DTOs;

public class PlanUsageDto
{
    public string Plan { get; set; } = "Free";
    public DateTime? PlanExpiresAt { get; set; }
    public Dictionary<string, ModuleUsageDto> Modules { get; set; } = new();
}

public class ModuleUsageDto
{
    public int Current { get; set; }
    public int Limit { get; set; }
    public bool IsUnlimited { get; set; }
}

public class UpdateUserPlanRequest
{
    public string Plan { get; set; } = "Free";
    public DateTime? PlanExpiresAt { get; set; }
}
