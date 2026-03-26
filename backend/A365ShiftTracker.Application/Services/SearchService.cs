using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class SearchService : ISearchService
{
    private readonly IUnitOfWork _uow;

    public SearchService(IUnitOfWork uow) => _uow = uow;

    public async Task<GlobalSearchResultDto> SearchAsync(string query, int userId, string[]? modules = null)
    {
        var result = new GlobalSearchResultDto();
        var q = query.ToLower();
        var searchAll = modules == null || modules.Length == 0;

        if (searchAll || modules!.Contains("contacts"))
        {
            var contacts = await _uow.Contacts.FindAsync(c =>
                c.UserId == userId && (
                    c.Name.ToLower().Contains(q) ||
                    (c.Email != null && c.Email.ToLower().Contains(q)) ||
                    (c.Company != null && c.Company.ToLower().Contains(q))));
            result.Contacts = contacts.Take(10).Select(c => new ContactDto
            {
                Id = c.Id, Name = c.Name, Email = c.Email, Company = c.Company,
                Status = c.Status, EntityType = c.EntityType, Phone = c.Phone, Score = c.Score
            }).ToList();
        }

        if (searchAll || modules!.Contains("projects"))
        {
            var projects = await _uow.Projects.FindAsync(p =>
                p.UserId == userId && (
                    p.Title.ToLower().Contains(q) ||
                    (p.ClientName != null && p.ClientName.ToLower().Contains(q))));
            result.Projects = projects.Take(10).Select(p => new ProjectDto
            {
                Id = p.Id, Title = p.Title, ClientName = p.ClientName,
                ActiveStage = p.ActiveStage, Type = p.Type
            }).ToList();
        }

        if (searchAll || modules!.Contains("tasks"))
        {
            var tasks = await _uow.Tasks.FindAsync(t =>
                t.UserId == userId && t.Title.ToLower().Contains(q));
            result.Tasks = tasks.Take(10).Select(t => new TaskDto
            {
                Id = t.Id, Title = t.Title, Status = t.Status,
                Priority = t.Priority, DueDate = t.DueDate
            }).ToList();
        }

        if (searchAll || modules!.Contains("expenses"))
        {
            var expenses = await _uow.Expenses.FindAsync(e =>
                e.UserId == userId && (
                    (e.Description != null && e.Description.ToLower().Contains(q)) ||
                    (e.Category != null && e.Category.ToLower().Contains(q))));
            result.Expenses = expenses.Take(10).Select(e => new ExpenseDto
            {
                Id = e.Id, Date = e.Date, Category = e.Category,
                Amount = e.Amount, Description = e.Description
            }).ToList();
        }

        return result;
    }

    public async Task<IEnumerable<SavedFilterDto>> GetSavedFiltersAsync(int userId, string? module = null)
    {
        var filters = module != null
            ? await _uow.SavedFilters.FindAsync(f => f.UserId == userId && f.Module == module)
            : await _uow.SavedFilters.FindAsync(f => f.UserId == userId);
        return filters.Select(f => new SavedFilterDto
        {
            Id = f.Id, Name = f.Name, Module = f.Module, FilterJson = f.FilterJson
        });
    }

    public async Task<SavedFilterDto> SaveFilterAsync(CreateSavedFilterRequest request, int userId)
    {
        var entity = new SavedFilter
        {
            UserId = userId,
            Name = request.Name,
            Module = request.Module,
            FilterJson = request.FilterJson
        };
        await _uow.SavedFilters.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return new SavedFilterDto
        {
            Id = entity.Id, Name = entity.Name, Module = entity.Module, FilterJson = entity.FilterJson
        };
    }

    public async Task DeleteFilterAsync(int id, int userId)
    {
        var entity = await _uow.SavedFilters.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Filter {id} not found.");
        if (entity.UserId != userId) throw new UnauthorizedAccessException();
        await _uow.SavedFilters.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }
}
