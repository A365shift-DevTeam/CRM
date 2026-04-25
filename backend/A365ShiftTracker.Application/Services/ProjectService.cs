using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class ProjectService : IProjectService
{
    private readonly IUnitOfWork _uow;

    public ProjectService(IUnitOfWork uow) => _uow = uow;

    public async Task<PagedResult<ProjectDto>> GetAllAsync(int orgId, int page, int pageSize)
    {
        var paged = await _uow.Projects.GetPagedAsync(
            p => p.OrgId == orgId && !p.IsDeleted,
            page,
            pageSize,
            q => q.OrderByDescending(p => p.Id));
        return new PagedResult<ProjectDto>
        {
            Items = paged.Items.Select(MapToDto),
            TotalCount = paged.TotalCount,
            Page = paged.Page,
            PageSize = paged.PageSize
        };
    }

    public async Task<ProjectDto?> GetByIdAsync(int id, int orgId)
    {
        var project = await _uow.Projects.GetByIdAsync(id);
        if (project is null || project.OrgId != orgId) return null;
        return MapToDto(project);
    }

    public async Task<ProjectDto> CreateAsync(CreateProjectRequest request, int userId, int orgId)
    {
        var entity = new Project
        {
            UserId = userId,
            OrgId = orgId,
            CustomId = request.CustomId,
            Title = request.Title,
            ClientName = request.ClientName,
            ActiveStage = request.ActiveStage,
            DeliveryStage = request.DeliveryStage,
            FinanceStage = request.FinanceStage,
            LegalStage = request.LegalStage,
            Delay = request.Delay,
            Type = request.Type,
            History = request.History is not null ? JsonSerializer.Serialize(request.History) : "[]",
            Stages = request.Stages is not null ? JsonSerializer.Serialize(request.Stages) : null,
            Phone = request.Phone,
            BrandingName = request.BrandingName,
            StartDate = ToUtc(request.StartDate),
            EndDate = ToUtc(request.EndDate)
        };

        await _uow.Projects.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<ProjectDto> UpdateAsync(int id, UpdateProjectRequest request, int userId, int orgId)
    {
        var entity = await _uow.Projects.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Project {id} not found.");

        if (entity.OrgId != orgId)
            throw new UnauthorizedAccessException("You do not have access to this project.");

        entity.CustomId = request.CustomId;
        entity.Title = request.Title;
        entity.ClientName = request.ClientName;
        entity.ActiveStage = request.ActiveStage;
        entity.DeliveryStage = request.DeliveryStage;
        entity.FinanceStage = request.FinanceStage;
        entity.LegalStage = request.LegalStage;
        entity.Delay = request.Delay;
        entity.Type = request.Type;
        if (request.History is not null)
            entity.History = JsonSerializer.Serialize(request.History);
        if (request.Stages is not null)
            entity.Stages = JsonSerializer.Serialize(request.Stages);
        entity.Phone = request.Phone;
        entity.BrandingName = request.BrandingName;
        entity.StartDate = ToUtc(request.StartDate);
        entity.EndDate = ToUtc(request.EndDate);

        await _uow.Projects.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id, int userId, int orgId)
    {
        var entity = await _uow.Projects.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Project {id} not found.");

        if (entity.OrgId != orgId)
            throw new UnauthorizedAccessException("You do not have access to this project.");

        await _uow.Projects.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static DateTime? ToUtc(DateTime? dt) =>
        dt.HasValue ? DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc) : null;

    private static ProjectDto MapToDto(Project p) => new()
    {
        Id = p.Id,
        CustomId = p.CustomId,
        Title = p.Title,
        ClientName = p.ClientName,
        ActiveStage = p.ActiveStage,
        DeliveryStage = p.DeliveryStage,
        FinanceStage = p.FinanceStage,
        LegalStage = p.LegalStage,
        Delay = p.Delay,
        Type = p.Type,
        History = p.History is not null ? JsonSerializer.Deserialize<object>(p.History) : null,
        Stages = p.Stages is not null ? JsonSerializer.Deserialize<object>(p.Stages) : null,
        Phone = p.Phone,
        BrandingName = p.BrandingName,
        StartDate = p.StartDate,
        EndDate = p.EndDate
    };
}
