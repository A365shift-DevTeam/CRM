using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;

namespace A365ShiftTracker.Application.Services;

public class StorageLimitService : IStorageLimitService
{
    private readonly IUnitOfWork _uow;

    public StorageLimitService(IUnitOfWork uow) => _uow = uow;

    public async Task<(bool Allowed, int Current, int Limit)> CheckLimitAsync(int userId, string module)
    {
        // Plan limits are now managed at the org level. All users in active/trial orgs have full access.
        await System.Threading.Tasks.Task.CompletedTask;
        return (true, 0, int.MaxValue);
    }

    public async Task<PlanUsageDto> GetUsageAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException($"User {userId} not found.");

        var orgStatus = user.Organization?.Status ?? "ACTIVE";

        var modules = new Dictionary<string, ModuleUsageDto>
        {
            ["Contacts"]  = new() { Current = 0, Limit = int.MaxValue, IsUnlimited = true },
            ["Leads"]     = new() { Current = 0, Limit = int.MaxValue, IsUnlimited = true },
            ["Projects"]  = new() { Current = 0, Limit = int.MaxValue, IsUnlimited = true },
            ["Documents"] = new() { Current = 0, Limit = int.MaxValue, IsUnlimited = true },
            ["Invoices"]  = new() { Current = 0, Limit = int.MaxValue, IsUnlimited = true }
        };

        return new PlanUsageDto
        {
            Plan = orgStatus,
            PlanExpiresAt = null,
            Modules = modules
        };
    }
}
