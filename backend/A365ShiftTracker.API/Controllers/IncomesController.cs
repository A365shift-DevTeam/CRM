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
        try
        {
            var userId = GetCurrentUserId();
            var isAdmin = GetCurrentRole() is "ORG_ADMIN" or "SUPER_ADMIN";
            var result = await _service.GetAllAsync(userId, isAdmin, page, pageSize);
            return Ok(ApiResponse<PagedResult<IncomeDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<IncomeDto>>> Create(CreateIncomeRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var orgId = GetCurrentOrgId() ?? 0;
            if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
            var result = await _service.CreateAsync(request, userId, orgId);
            return Ok(ApiResponse<IncomeDto>.Ok(result, "Income created."));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<IncomeDto>>> Update(int id, UpdateIncomeRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var isAdmin = GetCurrentRole() is "ORG_ADMIN" or "SUPER_ADMIN";
            var result = await _service.UpdateAsync(id, request, userId, isAdmin);
            return Ok(ApiResponse<IncomeDto>.Ok(result, "Income updated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var isAdmin = GetCurrentRole() is "ORG_ADMIN" or "SUPER_ADMIN";
            await _service.DeleteAsync(id, userId, isAdmin);
            return Ok(ApiResponse<bool>.Ok(true, "Income deleted."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }
}

