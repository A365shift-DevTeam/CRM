using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
namespace A365ShiftTracker.Application.Services;

public class SuperAdminService : ISuperAdminService
{
    private readonly IUnitOfWork _uow;
    private readonly IEmailService _emailService;

    private readonly ILogger<SuperAdminService> _logger;

    public SuperAdminService(IUnitOfWork uow, IEmailService emailService, ILogger<SuperAdminService> logger)
    {
        _logger = logger;
        _uow = uow;
        _emailService = emailService;
    }

    public async Task<OrganizationDto> CreateOrganizationAsync(CreateOrganizationRequest request)
    {
        try
        {
            var slugTaken = await _uow.Organizations.Query()
                .AnyAsync(o => o.Slug == request.Slug);
            if (slugTaken)
                throw new InvalidOperationException("Slug is already in use.");
    
            var org = new Organization
            {
                Name = request.Name,
                Slug = request.Slug,
                Status = "TRIAL",
                TrialEndsAt = ToUtc(request.TrialEndsAt) ?? DateTime.UtcNow.AddDays(14),
                CreatedAt = DateTime.UtcNow,
                UserLimit = request.UserLimit
            };
    
            await _uow.Organizations.AddAsync(org);
            await _uow.SaveChangesAsync();
    
            return MapOrg(org, 0);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(CreateOrganizationAsync));
            throw;
        }
    }

    public async Task<List<OrganizationDto>> GetAllOrganizationsAsync()
    {
        try
        {
            var orgs = await _uow.Organizations.Query()
                .Include(o => o.Members)
                .ToListAsync();
    
            return orgs.Select(o => MapOrg(o, o.Members.Count)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(CreateOrganizationAsync));
            throw;
        }
    }

    public async Task<OrganizationDto> UpdateOrganizationStatusAsync(int orgId, string status)
    {
        try
        {
            var validStatuses = new[] { "TRIAL", "ACTIVE", "SUSPENDED" };
            if (!validStatuses.Contains(status))
                throw new ArgumentException($"Invalid status '{status}'. Must be TRIAL, ACTIVE, or SUSPENDED.");
    
            var org = await _uow.Organizations.Query()
                .Include(o => o.Members)
                .FirstOrDefaultAsync(o => o.Id == orgId)
                ?? throw new KeyNotFoundException($"Organization {orgId} not found.");
    
            org.Status = status;
            if (status == "SUSPENDED")
                org.SuspendedAt = DateTime.UtcNow;
            else
                org.SuspendedAt = null;
    
            await _uow.Organizations.UpdateAsync(org);
            await _uow.SaveChangesAsync();
    
            return MapOrg(org, org.Members.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(UpdateOrganizationStatusAsync));
            throw;
        }
    }

    public async Task<OrganizationDto> SetUserLimitAsync(int orgId, int userLimit)
    {
        try
        {
            var org = await _uow.Organizations.Query()
                .Include(o => o.Members)
                .FirstOrDefaultAsync(o => o.Id == orgId)
                ?? throw new KeyNotFoundException($"Organization {orgId} not found.");
    
            if (userLimit < org.Members.Count)
                throw new InvalidOperationException(
                    $"Cannot set limit to {userLimit} — organization already has {org.Members.Count} users.");
    
            org.UserLimit = userLimit;
            await _uow.Organizations.UpdateAsync(org);
            await _uow.SaveChangesAsync();
    
            return MapOrg(org, org.Members.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(SetUserLimitAsync));
            throw;
        }
    }

    public async Task<UserDto> CreateOrgAdminAsync(int orgId, CreateUserRequest request)
    {
        try
        {
            var org = await _uow.Organizations.Query()
                .Include(o => o.Members)
                .FirstOrDefaultAsync(o => o.Id == orgId)
                ?? throw new KeyNotFoundException($"Organization {orgId} not found.");
    
            if (org.UserLimit.HasValue && org.Members.Count >= org.UserLimit.Value)
                throw new InvalidOperationException(
                    $"User limit reached. This organization is capped at {org.UserLimit.Value} users.");
    
            var exists = await _uow.Users.AnyAsync(u => u.Email == request.Email);
            if (exists)
                throw new InvalidOperationException("Email already registered.");
    
            var role = string.IsNullOrWhiteSpace(request.Role) ? "ORG_ADMIN" : request.Role.Trim().ToUpperInvariant();
            var validRoles = new[] { "ORG_ADMIN", "MANAGER", "EMPLOYEE" };
            if (!validRoles.Contains(role))
                throw new ArgumentException("Role must be ORG_ADMIN, MANAGER, or EMPLOYEE.");
    
            var tempPassword = GenerateTempPassword();
            var user = new User
            {
                Email = request.Email,
                DisplayName = request.DisplayName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                Role = role,
                OrgId = orgId,
                IsFirstLogin = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
    
            await _uow.Users.AddAsync(user);
            await _uow.SaveChangesAsync();
    
            await _emailService.SendWelcomeEmailAsync(user.Email, user.DisplayName ?? user.Email, org.Name, tempPassword);
    
            return MapUser(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(CreateOrgAdminAsync));
            throw;
        }
    }

    public async Task<List<UserDto>> GetOrgUsersAsync(int orgId)
    {
        try
        {
            var users = await _uow.Users.Query()
                .Where(u => u.OrgId == orgId)
                .ToListAsync();
    
            return users.Select(MapUser).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(CreateOrgAdminAsync));
            throw;
        }
    }

    public async Task<UserDto> UpdateOrgUserAsync(int orgId, int userId, UpdateUserRequest request)
    {
        try
        {
            var user = await _uow.Users.Query()
                .FirstOrDefaultAsync(u => u.Id == userId && u.OrgId == orgId)
                ?? throw new KeyNotFoundException("User not found in this organization.");
    
            if (user.Role == "SUPER_ADMIN")
                throw new InvalidOperationException("Cannot modify a Super Admin account.");
    
            if (request.DisplayName != null)
                user.DisplayName = request.DisplayName.Trim();
    
            if (request.Role != null)
            {
                var validRoles = new[] { "ORG_ADMIN", "MANAGER", "EMPLOYEE" };
                if (!validRoles.Contains(request.Role))
                    throw new ArgumentException("Role must be ORG_ADMIN, MANAGER, or EMPLOYEE.");
                user.Role = request.Role;
            }
    
            if (request.IsActive.HasValue)
                user.IsActive = request.IsActive.Value;
    
            await _uow.Users.UpdateAsync(user);
            await _uow.SaveChangesAsync();
    
            return MapUser(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(UpdateOrgUserAsync));
            throw;
        }
    }

    public async Task<UserDto> ToggleUserActiveAsync(int orgId, int userId, bool isActive)
    {
        try
        {
            var user = await _uow.Users.Query()
                .FirstOrDefaultAsync(u => u.Id == userId && u.OrgId == orgId)
                ?? throw new KeyNotFoundException("User not found in this organization.");
    
            user.IsActive = isActive;
            await _uow.Users.UpdateAsync(user);
            await _uow.SaveChangesAsync();
    
            return MapUser(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(ToggleUserActiveAsync));
            throw;
        }
    }

    public async Task DeleteOrgUserAsync(int orgId, int userId)
    {
        try
        {
            var user = await _uow.Users.Query()
                .FirstOrDefaultAsync(u => u.Id == userId && u.OrgId == orgId)
                ?? throw new KeyNotFoundException("User not found in this organization.");
    
            if (user.Role == "SUPER_ADMIN")
                throw new InvalidOperationException("Cannot delete a Super Admin account.");
    
            user.IsActive = false;
            user.OrgId = null;
            await _uow.Users.UpdateAsync(user);
            await _uow.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(DeleteOrgUserAsync));
            throw;
        }
    }

    public async Task<SuperAdminAuditLogPageDto> GetAuditLogsAsync(
        int? orgId, int? userId, string? entityName,
        DateTime? startDate, DateTime? endDate,
        int page, int pageSize)
    {
        try
        {
            // Build lookups: userId→orgId and orgId→orgName (SuperAdmin bypasses global filters)
            var userOrgMap = await _uow.Users.Query()
                .Where(u => u.OrgId != null)
                .Select(u => new { u.Id, u.OrgId })
                .ToListAsync();
    
            var orgNameById = await _uow.Organizations.Query()
                .Select(o => new { o.Id, o.Name })
                .ToDictionaryAsync(o => o.Id, o => o.Name);
    
            // Filter users by org if orgId supplied
            var eligibleUserIds = orgId.HasValue
                ? userOrgMap.Where(u => u.OrgId == orgId).Select(u => u.Id).ToHashSet()
                : null;
    
            var query = _uow.AuditLogs.Query();
    
            if (eligibleUserIds != null)
                query = query.Where(a => eligibleUserIds.Contains(a.ChangedByUserId));
    
            if (userId.HasValue)
                query = query.Where(a => a.ChangedByUserId == userId.Value);
    
            if (!string.IsNullOrWhiteSpace(entityName))
                query = query.Where(a => a.EntityName == entityName);
    
            if (startDate.HasValue)
                query = query.Where(a => a.ChangedAt >= startDate.Value);
    
            if (endDate.HasValue)
                query = query.Where(a => a.ChangedAt <= endDate.Value.AddDays(1));
    
            var total = await query.CountAsync();
    
            var items = await query
                .OrderByDescending(a => a.ChangedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
    
            var userOrgLookup = userOrgMap.ToDictionary(u => u.Id);
    
            var dtos = items.Select(a =>
            {
                userOrgLookup.TryGetValue(a.ChangedByUserId, out var uo);
                var resolvedOrgId = uo?.OrgId;
                var resolvedOrgName = resolvedOrgId.HasValue && orgNameById.TryGetValue(resolvedOrgId.Value, out var n) ? n : null;
                return new SuperAdminAuditLogDto
                {
                    Id = a.Id,
                    EntityName = a.EntityName,
                    EntityId = a.EntityId,
                    FieldName = a.FieldName,
                    OldValue = a.OldValue,
                    NewValue = a.NewValue,
                    Action = a.Action,
                    Description = a.Description,
                    ChangedByUserId = a.ChangedByUserId,
                    ChangedByName = a.ChangedByName,
                    ChangedAt = a.ChangedAt,
                    IpAddress = a.IpAddress,
                    OrgId = resolvedOrgId,
                    OrgName = resolvedOrgName,
                };
            }).ToList();
    
            return new SuperAdminAuditLogPageDto { Items = dtos, Total = total, Page = page, PageSize = pageSize };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetAuditLogsAsync));
            throw;
        }
    }

    private static OrganizationDto MapOrg(Organization o, int userCount) => new()
    {
        Id = o.Id,
        Name = o.Name,
        Slug = o.Slug,
        Status = o.Status,
        CreatedAt = o.CreatedAt,
        TrialEndsAt = o.TrialEndsAt,
        SuspendedAt = o.SuspendedAt,
        UserCount = userCount,
        UserLimit = o.UserLimit
    };

    private static UserDto MapUser(User u) => new()
    {
        Id = u.Id,
        Email = u.Email,
        DisplayName = u.DisplayName,
        Role = u.Role,
        IsActive = u.IsActive,
        IsFirstLogin = u.IsFirstLogin,
        CreatedAt = u.CreatedAt,
        LastLoginAt = u.LastLoginAt,
        OrgId = u.OrgId
    };

    private static string GenerateTempPassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#";
        var rng = System.Security.Cryptography.RandomNumberGenerator.GetBytes(12);
        return new string(rng.Select(b => chars[b % chars.Length]).ToArray());
    }

    // Ensures any DateTime from JSON deserialization (Kind=Unspecified) is treated as UTC
    private static DateTime? ToUtc(DateTime? dt) =>
        dt.HasValue ? DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc) : null;
}

