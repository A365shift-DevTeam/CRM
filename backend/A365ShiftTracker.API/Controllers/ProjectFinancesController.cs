using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectFinancesController : BaseApiController
{
    private readonly IProjectFinanceService _service;

    public ProjectFinancesController(IProjectFinanceService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<ProjectFinanceDto>>>> GetAll()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId);
        return Ok(ApiResponse<IEnumerable<ProjectFinanceDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ProjectFinanceDto>>> GetById(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetByIdAsync(id, userId);
        if (result is null) return NotFound(ApiResponse<ProjectFinanceDto>.Fail("Not found."));
        return Ok(ApiResponse<ProjectFinanceDto>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProjectFinanceDto>>> Create(CreateProjectFinanceRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<ProjectFinanceDto>.Ok(result, "Project finance created."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ProjectFinanceDto>>> Update(int id, UpdateProjectFinanceRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.UpdateAsync(id, request, userId);
        return Ok(ApiResponse<ProjectFinanceDto>.Ok(result, "Project finance updated."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetCurrentUserId();
        await _service.DeleteAsync(id, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Project finance deleted."));
    }
}
