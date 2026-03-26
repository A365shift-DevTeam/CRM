using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SearchController : BaseApiController
{
    private readonly ISearchService _service;

    public SearchController(ISearchService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<GlobalSearchResultDto>>> Search(
        [FromQuery] string q, [FromQuery] string? modules = null)
    {
        var userId = GetCurrentUserId();
        var moduleArray = modules?.Split(',', StringSplitOptions.RemoveEmptyEntries);
        var result = await _service.SearchAsync(q, userId, moduleArray);
        return Ok(ApiResponse<GlobalSearchResultDto>.Ok(result));
    }

    [HttpGet("filters")]
    public async Task<ActionResult<ApiResponse<IEnumerable<SavedFilterDto>>>> GetFilters(
        [FromQuery] string? module = null)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetSavedFiltersAsync(userId, module);
        return Ok(ApiResponse<IEnumerable<SavedFilterDto>>.Ok(result));
    }

    [HttpPost("filters")]
    public async Task<ActionResult<ApiResponse<SavedFilterDto>>> SaveFilter(CreateSavedFilterRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.SaveFilterAsync(request, userId);
        return Ok(ApiResponse<SavedFilterDto>.Ok(result, "Filter saved."));
    }

    [HttpDelete("filters/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteFilter(int id)
    {
        var userId = GetCurrentUserId();
        await _service.DeleteFilterAsync(id, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Filter deleted."));
    }
}
