using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IReportService
{
    Task<List<MonthlyRevenueDto>> GetRevenueByMonthAsync(int userId, DateTime from, DateTime to);
    Task<List<CategoryExpenseDto>> GetExpensesByCategoryAsync(int userId, DateTime from, DateTime to);
    Task<PipelineConversionDto> GetPipelineConversionAsync(int userId);
    Task<List<ContactGrowthDto>> GetContactGrowthAsync(int userId, DateTime from, DateTime to);
}
