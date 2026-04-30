using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
namespace A365ShiftTracker.Application.Services;

public class SearchService : ISearchService
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<SearchService> _logger;

    public SearchService(IUnitOfWork uow, ILogger<SearchService> logger)
    {
        _uow = uow;
        _logger = logger;
    }

    public async Task<GlobalSearchResultDto> SearchAsync(string query, int userId, string[]? modules = null)
    {
        try
        {
            var result = new GlobalSearchResultDto();
            var q = query.ToLower();
            var searchAll = modules == null || modules.Length == 0;
    
            if (searchAll || modules!.Contains("contacts"))
            {
                // Name is encrypted — match on Company and Email (non-encrypted columns)
                result.Contacts = await _uow.Contacts.Query()
                    .Where(c => c.UserId == userId && (
                        (c.Company != null && c.Company.ToLower().Contains(q)) ||
                        (c.Email != null && c.Email.ToLower().Contains(q))))
                    .Select(c => new ContactDto
                    {
                        Id = c.Id, Name = c.Name, Email = c.Email, Company = c.Company,
                        Status = c.Status, EntityType = c.EntityType, Phone = c.Phone, Score = c.Score
                    })
                    .Take(10)
                    .ToListAsync();
            }
    
            if (searchAll || modules!.Contains("projects"))
            {
                // ClientName is encrypted — match on Title only
                result.Projects = await _uow.Projects.Query()
                    .Where(p => p.UserId == userId && p.Title.ToLower().Contains(q))
                    .Select(p => new ProjectDto
                    {
                        Id = p.Id, Title = p.Title, ClientName = p.ClientName,
                        ActiveStage = p.ActiveStage, Type = p.Type
                    })
                    .Take(10)
                    .ToListAsync();
            }
    
            if (searchAll || modules!.Contains("tasks"))
            {
                result.Tasks = await _uow.Tasks.Query()
                    .Where(t => t.UserId == userId && t.Title.ToLower().Contains(q))
                    .Select(t => new TaskDto
                    {
                        Id = t.Id, Title = t.Title, Status = t.Status,
                        Priority = t.Priority, DueDate = t.DueDate
                    })
                    .Take(10)
                    .ToListAsync();
            }
    
            if (searchAll || modules!.Contains("expenses"))
            {
                result.Expenses = await _uow.Expenses.Query()
                    .Where(e => e.UserId == userId && (
                        (e.Description != null && e.Description.ToLower().Contains(q)) ||
                        (e.Category != null && e.Category.ToLower().Contains(q))))
                    .Select(e => new ExpenseDto
                    {
                        Id = e.Id, Date = e.Date, Category = e.Category,
                        Amount = e.Amount, Description = e.Description
                    })
                    .Take(10)
                    .ToListAsync();
            }
    
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(SearchAsync));
            throw;
        }
    }

    public async Task<IEnumerable<SavedFilterDto>> GetSavedFiltersAsync(int userId, string? module = null)
        => await _uow.SavedFilters.GetProjectedListAsync(
            f => f.UserId == userId && (module == null || f.Module == module),
            f => new SavedFilterDto { Id = f.Id, Name = f.Name, Module = f.Module, FilterJson = f.FilterJson });

    public async Task<SavedFilterDto> SaveFilterAsync(CreateSavedFilterRequest request, int userId)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(SaveFilterAsync));
            throw;
        }
    }

    public async Task DeleteFilterAsync(int id, int userId)
    {
        try
        {
            var entity = await _uow.SavedFilters.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Filter {id} not found.");
            if (entity.UserId != userId) throw new UnauthorizedAccessException();
            await _uow.SavedFilters.DeleteAsync(entity);
            await _uow.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(DeleteFilterAsync));
            throw;
        }
    }
}

