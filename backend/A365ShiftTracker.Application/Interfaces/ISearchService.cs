using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface ISearchService
{
    Task<GlobalSearchResultDto> SearchAsync(string query, int userId, string[]? modules = null);
    Task<IEnumerable<SavedFilterDto>> GetSavedFiltersAsync(int userId, string? module = null);
    Task<SavedFilterDto> SaveFilterAsync(CreateSavedFilterRequest request, int userId);
    Task DeleteFilterAsync(int id, int userId);
}
