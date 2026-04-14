using System.Security.Claims;
using A365ShiftTracker.Application.Common;
using Microsoft.AspNetCore.Http;

namespace A365ShiftTracker.Infrastructure.Helpers;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int? UserId
    {
        get
        {
            var value = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("sub");
            return int.TryParse(value, out var id) ? id : null;
        }
    }

    public string? UserName =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Name)
        ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("name");

    public string? IpAddress =>
        _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();
}
