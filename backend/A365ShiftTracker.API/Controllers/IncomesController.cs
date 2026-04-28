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
public class IncomesController : BaseApiController
{
    private readonly IIncomeService _service;

    public IncomesController(IIncomeService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<IncomeDto>>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        var userId = GetCurrentUserId();
        var isAdmin = GetCurrentRole() is "ORG_ADMIN" or "SUPER_ADMIN";
        var result = await _service.GetAllAsync(userId, isAdmin, page, pageSize);
        return Ok(ApiResponse<PagedResult<IncomeDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<IncomeDto>>> Create(CreateIncomeRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.CreateAsync(request, userId);
        return Ok(ApiResponse<IncomeDto>.Ok(result, "Income created."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<IncomeDto>>> Update(int id, UpdateIncomeRequest request)
    {
        var userId = GetCurrentUserId();
        var isAdmin = GetCurrentRole() is "ORG_ADMIN" or "SUPER_ADMIN";
        var result = await _service.UpdateAsync(id, request, userId, isAdmin);
        return Ok(ApiResponse<IncomeDto>.Ok(result, "Income updated."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetCurrentUserId();
        var isAdmin = GetCurrentRole() is "ORG_ADMIN" or "SUPER_ADMIN";
        await _service.DeleteAsync(id, userId, isAdmin);
        return Ok(ApiResponse<bool>.Ok(true, "Income deleted."));
    }
}
