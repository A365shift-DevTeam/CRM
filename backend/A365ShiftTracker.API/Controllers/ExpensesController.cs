using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _service;

    public ExpensesController(IExpenseService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<ExpenseDto>>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(ApiResponse<IEnumerable<ExpenseDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> Create(CreateExpenseRequest request)
    {
        var result = await _service.CreateAsync(request);
        return Ok(ApiResponse<ExpenseDto>.Ok(result, "Expense created."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> Update(int id, UpdateExpenseRequest request)
    {
        var result = await _service.UpdateAsync(id, request);
        return Ok(ApiResponse<ExpenseDto>.Ok(result, "Expense updated."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return Ok(ApiResponse<bool>.Ok(true, "Expense deleted."));
    }
}
