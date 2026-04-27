using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace A365ShiftTracker.Application.Services;

public class SuperAdminService : ISuperAdminService
{
    private readonly IUnitOfWork _uow;
    private readonly IEmailService _emailService;

    public SuperAdminService(IUnitOfWork uow, IEmailService emailService)
    {
        _uow = uow;
        _emailService = emailService;
    }

    public async Task<OrganizationDto> CreateOrganizationAsync(CreateOrganizationRequest request)
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
            CreatedAt = DateTime.UtcNow
        };

        await _uow.Organizations.AddAsync(org);
        await _uow.SaveChangesAsync();

        return MapOrg(org, 0);
    }

    public async Task<List<OrganizationDto>> GetAllOrganizationsAsync()
    {
        var orgs = await _uow.Organizations.Query()
            .Include(o => o.Members)
            .ToListAsync();

        return orgs.Select(o => MapOrg(o, o.Members.Count)).ToList();
    }

    public async Task<OrganizationDto> UpdateOrganizationStatusAsync(int orgId, string status)
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

    public async Task<UserDto> CreateOrgAdminAsync(int orgId, CreateUserRequest request)
    {
        var org = await _uow.Organizations.GetByIdAsync(orgId)
            ?? throw new KeyNotFoundException($"Organization {orgId} not found.");

        var exists = await _uow.Users.Query().AnyAsync(u => u.Email == request.Email);
        if (exists)
            throw new InvalidOperationException("Email already registered.");

        var tempPassword = GenerateTempPassword();
        var user = new User
        {
            Email = request.Email,
            DisplayName = request.DisplayName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
            Role = "ORG_ADMIN",
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

    public async Task<List<UserDto>> GetOrgUsersAsync(int orgId)
    {
        var users = await _uow.Users.Query()
            .Where(u => u.OrgId == orgId)
            .ToListAsync();

        return users.Select(MapUser).ToList();
    }

    public async Task RemoveUserFromOrgAsync(int orgId, int userId)
    {
        var user = await _uow.Users.Query()
            .FirstOrDefaultAsync(u => u.Id == userId && u.OrgId == orgId)
            ?? throw new KeyNotFoundException("User not found in this organization.");

        if (user.Role == "ORG_ADMIN")
            throw new InvalidOperationException("Cannot remove the Org Admin directly. Update the role first.");

        user.IsActive = false;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
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
        UserCount = userCount
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
