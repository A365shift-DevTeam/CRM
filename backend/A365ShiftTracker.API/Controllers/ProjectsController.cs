using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : BaseApiController
{
    private readonly IProjectService _service;
    private readonly IStorageLimitService _limits;

    public ProjectsController(IProjectService service, IStorageLimitService limits)
    {
        _service = service;
        _limits = limits;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ProjectDto>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId, page, pageSize);
        return Ok(ApiResponse<PagedResult<ProjectDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ProjectDto>>> GetById(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetByIdAsync(id, userId);
        if (result is null) return NotFound(ApiResponse<ProjectDto>.Fail("Project not found."));
        return Ok(ApiResponse<ProjectDto>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProjectDto>>> Create(CreateProjectRequest request)
    {
        var userId = GetCurrentUserId();
        var (allowed, current, limit) = await _limits.CheckLimitAsync(userId, "Projects");
        if (!allowed)
            return StatusCode(402, ApiResponse<object>.Fail($"Project limit reached ({current}/{limit}). Please upgrade your plan."));
        var result = await _service.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<ProjectDto>.Ok(result, "Project created."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ProjectDto>>> Update(int id, UpdateProjectRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.UpdateAsync(id, request, userId);
        return Ok(ApiResponse<ProjectDto>.Ok(result, "Project updated."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetCurrentUserId();
        await _service.DeleteAsync(id, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Project deleted."));
    }
}
