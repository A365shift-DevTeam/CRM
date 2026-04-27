using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using A365ShiftTracker.Application.Common;
using Microsoft.AspNetCore.Http;

namespace A365ShiftTracker.Infrastructure.Services;

public class TenantContext : ITenantContext
{
    public int UserId { get; }
    public int? OrgId { get; }
    public string Role { get; }
    public bool IsSuperAdmin => Role == "SUPER_ADMIN";

    public TenantContext(IHttpContextAccessor httpContextAccessor)
    {
        var user = httpContextAccessor.HttpContext?.User;
        if (user == null) return;

        var sub = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
               ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(sub, out var uid))
            UserId = uid;

        Role = user.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

        var orgIdStr = user.FindFirst("org_id")?.Value;
        if (int.TryParse(orgIdStr, out var oid))
            OrgId = oid;
    }
}
