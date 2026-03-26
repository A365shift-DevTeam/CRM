using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : BaseApiController
{
    private readonly IReportService _service;

    public ReportsController(IReportService service) => _service = service;

    [HttpGet("revenue")]
    public async Task<ActionResult<ApiResponse<List<MonthlyRevenueDto>>>> GetRevenue(
        [FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetRevenueByMonthAsync(userId, from, to);
        return Ok(ApiResponse<List<MonthlyRevenueDto>>.Ok(result));
    }

    [HttpGet("expenses-by-category")]
    public async Task<ActionResult<ApiResponse<List<CategoryExpenseDto>>>> GetExpensesByCategory(
        [FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetExpensesByCategoryAsync(userId, from, to);
        return Ok(ApiResponse<List<CategoryExpenseDto>>.Ok(result));
    }

    [HttpGet("pipeline-conversion")]
    public async Task<ActionResult<ApiResponse<PipelineConversionDto>>> GetPipelineConversion()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetPipelineConversionAsync(userId);
        return Ok(ApiResponse<PipelineConversionDto>.Ok(result));
    }

    [HttpGet("contact-growth")]
    public async Task<ActionResult<ApiResponse<List<ContactGrowthDto>>>> GetContactGrowth(
        [FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetContactGrowthAsync(userId, from, to);
        return Ok(ApiResponse<List<ContactGrowthDto>>.Ok(result));
    }
}
