using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : BaseApiController
{
    private readonly IReportService _service;

    public ReportsController(IReportService service) => _service = service;

    [HttpGet("revenue")]
    [OutputCache(PolicyName = "StatsCache")]
    public async Task<ActionResult<ApiResponse<List<MonthlyRevenueDto>>>> GetRevenue(
        [FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetRevenueByMonthAsync(userId, from, to);
            return Ok(ApiResponse<List<MonthlyRevenueDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("expenses-by-category")]
    [OutputCache(PolicyName = "StatsCache")]
    public async Task<ActionResult<ApiResponse<List<CategoryExpenseDto>>>> GetExpensesByCategory(
        [FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetExpensesByCategoryAsync(userId, from, to);
            return Ok(ApiResponse<List<CategoryExpenseDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("pipeline-conversion")]
    [OutputCache(PolicyName = "StatsCache")]
    public async Task<ActionResult<ApiResponse<PipelineConversionDto>>> GetPipelineConversion()
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetPipelineConversionAsync(userId);
            return Ok(ApiResponse<PipelineConversionDto>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("contact-growth")]
    [OutputCache(PolicyName = "StatsCache")]
    public async Task<ActionResult<ApiResponse<List<ContactGrowthDto>>>> GetContactGrowth(
        [FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetContactGrowthAsync(userId, from, to);
            return Ok(ApiResponse<List<ContactGrowthDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }
}

