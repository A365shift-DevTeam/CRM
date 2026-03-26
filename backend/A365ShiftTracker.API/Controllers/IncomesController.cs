using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
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
    public async Task<ActionResult<ApiResponse<IEnumerable<IncomeDto>>>> GetAll()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId);
        return Ok(ApiResponse<IEnumerable<IncomeDto>>.Ok(result));
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
        var result = await _service.UpdateAsync(id, request, userId);
        return Ok(ApiResponse<IncomeDto>.Ok(result, "Income updated."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetCurrentUserId();
        await _service.DeleteAsync(id, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Income deleted."));
    }
}
