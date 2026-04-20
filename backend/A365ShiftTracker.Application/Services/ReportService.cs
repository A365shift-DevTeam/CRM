using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace A365ShiftTracker.Application.Services;

public class ReportService : IReportService
{
    private readonly IUnitOfWork _uow;

    public ReportService(IUnitOfWork uow) => _uow = uow;

    public async Task<List<MonthlyRevenueDto>> GetRevenueByMonthAsync(int userId, DateTime from, DateTime to)
    {
        return await _uow.Incomes.Query()
            .Where(i => i.UserId == userId && i.Date >= from && i.Date <= to)
            .GroupBy(i => new { i.Date.Year, i.Date.Month })
            .Select(g => new MonthlyRevenueDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Amount = g.Sum(i => i.Amount)
            })
            .OrderBy(r => r.Year).ThenBy(r => r.Month)
            .ToListAsync();
    }

    public async Task<List<CategoryExpenseDto>> GetExpensesByCategoryAsync(int userId, DateTime from, DateTime to)
    {
        var grouped = await _uow.Expenses.Query()
            .Where(e => e.UserId == userId && e.Date >= from && e.Date <= to)
            .GroupBy(e => e.Category ?? "Other")
            .Select(g => new { Category = g.Key, Amount = g.Sum(e => e.Amount) })
            .OrderByDescending(g => g.Amount)
            .ToListAsync();

        var total = grouped.Sum(g => g.Amount);
        return grouped.Select(g => new CategoryExpenseDto
        {
            Category = g.Category,
            Amount = g.Amount,
            Percentage = total > 0 ? Math.Round(g.Amount / total * 100, 1) : 0
        }).ToList();
    }

    public async Task<PipelineConversionDto> GetPipelineConversionAsync(int userId)
    {
        var stages = new[] { "Demo", "Proposal", "Negotiation", "Approval", "Won", "Closed", "Lost" };

        var stageCounts = await _uow.Projects.Query()
            .Where(p => p.UserId == userId)
            .GroupBy(p => p.ActiveStage)
            .Select(g => new { Stage = g.Key, Count = g.Count() })
            .ToListAsync();

        var countMap = stageCounts.ToDictionary(s => s.Stage, s => s.Count);

        return new PipelineConversionDto
        {
            Stages = stages.Select((s, i) => new StageCountDto
            {
                Stage = s,
                Count = countMap.ContainsKey(i) ? countMap[i] : 0
            }).ToList()
        };
    }

    public async Task<List<ContactGrowthDto>> GetContactGrowthAsync(int userId, DateTime from, DateTime to)
    {
        var grouped = await _uow.Contacts.Query()
            .Where(c => c.UserId == userId && c.CreatedAt >= from && c.CreatedAt <= to)
            .GroupBy(c => new { c.CreatedAt.Year, c.CreatedAt.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, NewContacts = g.Count() })
            .OrderBy(g => g.Year).ThenBy(g => g.Month)
            .ToListAsync();

        var totalBefore = await _uow.Contacts.Query()
            .CountAsync(c => c.UserId == userId && c.CreatedAt < from);

        var result = new List<ContactGrowthDto>();
        var runningTotal = totalBefore;
        foreach (var g in grouped)
        {
            runningTotal += g.NewContacts;
            result.Add(new ContactGrowthDto
            {
                Year = g.Year,
                Month = g.Month,
                NewContacts = g.NewContacts,
                TotalContacts = runningTotal
            });
        }
        return result;
    }
}
