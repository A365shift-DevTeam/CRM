using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;

namespace A365ShiftTracker.Application.Services;

public class ReportService : IReportService
{
    private readonly IUnitOfWork _uow;

    public ReportService(IUnitOfWork uow) => _uow = uow;

    public async Task<List<MonthlyRevenueDto>> GetRevenueByMonthAsync(int userId, DateTime from, DateTime to)
    {
        var incomes = await _uow.Incomes.FindAsync(i =>
            i.UserId == userId && i.Date >= from && i.Date <= to);
        return incomes
            .GroupBy(i => new { i.Date.Year, i.Date.Month })
            .Select(g => new MonthlyRevenueDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Amount = g.Sum(i => i.Amount)
            })
            .OrderBy(r => r.Year).ThenBy(r => r.Month)
            .ToList();
    }

    public async Task<List<CategoryExpenseDto>> GetExpensesByCategoryAsync(int userId, DateTime from, DateTime to)
    {
        var expenses = await _uow.Expenses.FindAsync(e =>
            e.UserId == userId && e.Date >= from && e.Date <= to);
        var total = expenses.Sum(e => e.Amount);
        return expenses
            .GroupBy(e => e.Category ?? "Other")
            .Select(g => new CategoryExpenseDto
            {
                Category = g.Key,
                Amount = g.Sum(e => e.Amount),
                Percentage = total > 0 ? Math.Round(g.Sum(e => e.Amount) / total * 100, 1) : 0
            })
            .OrderByDescending(c => c.Amount)
            .ToList();
    }

    public async Task<PipelineConversionDto> GetPipelineConversionAsync(int userId)
    {
        var projects = await _uow.Projects.FindAsync(p => p.UserId == userId);
        var stages = new[] { "Demo", "Proposal", "Negotiation", "Approval", "Won", "Closed", "Lost" };
        var stageCounts = projects
            .GroupBy(p => p.ActiveStage)
            .ToDictionary(g => g.Key, g => g.Count());

        return new PipelineConversionDto
        {
            Stages = stages.Select((s, i) => new StageCountDto
            {
                Stage = s,
                Count = stageCounts.ContainsKey(i) ? stageCounts[i] : 0
            }).ToList()
        };
    }

    public async Task<List<ContactGrowthDto>> GetContactGrowthAsync(int userId, DateTime from, DateTime to)
    {
        var contacts = await _uow.Contacts.FindAsync(c =>
            c.UserId == userId && c.CreatedAt >= from && c.CreatedAt <= to);
        var allContacts = await _uow.Contacts.FindAsync(c => c.UserId == userId);
        var totalBefore = allContacts.Count(c => c.CreatedAt < from);

        var grouped = contacts
            .GroupBy(c => new { c.CreatedAt.Year, c.CreatedAt.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .ToList();

        var result = new List<ContactGrowthDto>();
        var runningTotal = totalBefore;
        foreach (var g in grouped)
        {
            runningTotal += g.Count();
            result.Add(new ContactGrowthDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                NewContacts = g.Count(),
                TotalContacts = runningTotal
            });
        }
        return result;
    }
}
