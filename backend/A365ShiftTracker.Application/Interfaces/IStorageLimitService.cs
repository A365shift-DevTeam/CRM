using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IStorageLimitService
{
    Task<(bool Allowed, int Current, int Limit)> CheckLimitAsync(int userId, string module);
    Task<PlanUsageDto> GetUsageAsync(int userId);
}
