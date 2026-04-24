using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class StorageLimitService : IStorageLimitService
{
    private readonly IUnitOfWork _uow;

    private static readonly Dictionary<string, Dictionary<string, int>> Limits = new()
    {
        ["Free"]  = new() { ["Contacts"]=50,  ["Leads"]=25,  ["Projects"]=10,  ["Documents"]=5,   ["Invoices"]=10  },
        ["Basic"] = new() { ["Contacts"]=500, ["Leads"]=250, ["Projects"]=100, ["Documents"]=50,  ["Invoices"]=100 },
        ["Pro"]   = new() { ["Contacts"]=int.MaxValue, ["Leads"]=int.MaxValue, ["Projects"]=int.MaxValue, ["Documents"]=int.MaxValue, ["Invoices"]=int.MaxValue }
    };

    public StorageLimitService(IUnitOfWork uow) => _uow = uow;

    public async Task<(bool Allowed, int Current, int Limit)> CheckLimitAsync(int userId, string module)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException($"User {userId} not found.");

        var plan = GetEffectivePlan(user);
        var limit = Limits[plan].GetValueOrDefault(module, int.MaxValue);

        if (limit == int.MaxValue) return (true, 0, limit);

        int current = module switch
        {
            "Contacts"  => await _uow.Contacts.CountAsync(c => c.UserId == userId && !c.IsDeleted),
            "Leads"     => await _uow.Leads.CountAsync(l => l.UserId == userId && !l.IsDeleted),
            "Projects"  => await _uow.Projects.CountAsync(p => p.UserId == userId && !p.IsDeleted),
            "Documents" => await _uow.Documents.CountAsync(d => d.UserId == userId && !d.IsDeleted),
            "Invoices"  => await _uow.Invoices.CountAsync(i => i.UserId == userId && !i.IsDeleted),
            _ => 0
        };

        return (current < limit, current, limit);
    }

    public async Task<PlanUsageDto> GetUsageAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException($"User {userId} not found.");

        var plan = GetEffectivePlan(user);
        var modules = new Dictionary<string, ModuleUsageDto>();

        foreach (var (module, limit) in Limits[plan])
        {
            var isUnlimited = limit == int.MaxValue;
            int current = isUnlimited ? 0 : module switch
            {
                "Contacts"  => await _uow.Contacts.CountAsync(c => c.UserId == userId && !c.IsDeleted),
                "Leads"     => await _uow.Leads.CountAsync(l => l.UserId == userId && !l.IsDeleted),
                "Projects"  => await _uow.Projects.CountAsync(p => p.UserId == userId && !p.IsDeleted),
                "Documents" => await _uow.Documents.CountAsync(d => d.UserId == userId && !d.IsDeleted),
                "Invoices"  => await _uow.Invoices.CountAsync(i => i.UserId == userId && !i.IsDeleted),
                _ => 0
            };

            modules[module] = new ModuleUsageDto { Current = current, Limit = limit, IsUnlimited = isUnlimited };
        }

        return new PlanUsageDto
        {
            Plan = plan,
            PlanExpiresAt = user.PlanExpiresAt,
            Modules = modules
        };
    }

    private static string GetEffectivePlan(User user)
    {
        if (string.IsNullOrEmpty(user.Plan) || user.Plan == "Free") return "Free";
        if (user.PlanExpiresAt.HasValue && user.PlanExpiresAt.Value < DateTime.UtcNow) return "Free";
        return user.Plan;
    }
}
