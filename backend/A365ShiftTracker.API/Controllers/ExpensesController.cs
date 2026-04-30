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
public class ExpensesController : BaseApiController
{
    private readonly IExpenseService _service;

    public ExpensesController(IExpenseService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ExpenseDto>>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetAllAsync(userId, page, pageSize);
            return Ok(ApiResponse<PagedResult<ExpenseDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> Create(CreateExpenseRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var orgId = GetCurrentOrgId() ?? 0;
            if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
            var result = await _service.CreateAsync(request, userId, orgId);
            return Ok(ApiResponse<ExpenseDto>.Ok(result, "Expense created."));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> Update(int id, UpdateExpenseRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.UpdateAsync(id, request, userId);
            return Ok(ApiResponse<ExpenseDto>.Ok(result, "Expense updated."));
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
            await _service.DeleteAsync(id, userId);
            return Ok(ApiResponse<bool>.Ok(true, "Expense deleted."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }
}

