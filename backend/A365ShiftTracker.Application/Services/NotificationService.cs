using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _uow;

    private static readonly (string Label, int Ageing)[] DefaultStages =
    [
        ("Demo", 7),
        ("Proposal", 15),
        ("Negotiation", 30),
        ("Approval", 15),
        ("Won", 30),
        ("Closed", 90),
        ("Lost", 60)
    ];

    public NotificationService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<NotificationDto>> GetAllAsync(int userId)
    {
        var notifications = await _uow.Notifications.FindAsync(n => n.UserId == userId);
        return notifications.OrderByDescending(n => n.CreatedAt).Select(MapToDto);
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _uow.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task MarkAsReadAsync(int id, int userId)
    {
        var entity = await _uow.Notifications.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Notification {id} not found.");
        if (entity.UserId != userId) throw new UnauthorizedAccessException();
        entity.IsRead = true;
        await _uow.Notifications.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        var unread = await _uow.Notifications.FindAsync(n => n.UserId == userId && !n.IsRead);
        foreach (var n in unread)
        {
            n.IsRead = true;
            await _uow.Notifications.UpdateAsync(n);
        }
        await _uow.SaveChangesAsync();
    }

    public async Task<NotificationDto> CreateAsync(CreateNotificationRequest request)
    {
        var entity = new Notification
        {
            UserId = request.UserId,
            Title = request.Title,
            Message = request.Message,
            Type = request.Type,
            EntityType = request.EntityType,
            EntityId = request.EntityId
        };
        await _uow.Notifications.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var entity = await _uow.Notifications.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Notification {id} not found.");
        if (entity.UserId != userId) throw new UnauthorizedAccessException();
        await _uow.Notifications.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    public async Task<IEnumerable<AlertDto>> GenerateAlertsAsync(int userId)
    {
        var alerts = new List<AlertDto>();
        var today = DateTime.UtcNow.Date;

        // --- 1. Payment Due Alerts (Milestones with overdue InvoiceDate) ---
        var projectFinances = await _uow.ProjectFinances.FindAsync(pf => pf.UserId == userId);
        foreach (var pf in projectFinances)
        {
            var milestones = await _uow.Milestones.FindAsync(m => m.ProjectFinanceId == pf.Id);
            foreach (var milestone in milestones)
            {
                if (milestone.InvoiceDate == null || milestone.Status == "Paid") continue;

                var daysOverdue = (today - milestone.InvoiceDate.Value.Date).Days;
                if (daysOverdue < 0) continue;

                var severity = daysOverdue > 15 ? "critical" : daysOverdue > 0 ? "warning" : "info";
                var title = daysOverdue == 0
                    ? $"Payment due today — {pf.ClientName}"
                    : $"Payment overdue by {daysOverdue}d — {pf.ClientName}";
                var milestoneAmount = pf.DealValue.HasValue && milestone.Percentage.HasValue
                    ? pf.DealValue.Value * milestone.Percentage.Value / 100
                    : (decimal?)null;

                alerts.Add(new AlertDto
                {
                    Category = "payment_due",
                    Severity = severity,
                    Title = title,
                    Message = $"Milestone \"{milestone.Name ?? "Payment"}\" for {pf.ClientName} ({pf.ProjectId}) was due on {milestone.InvoiceDate.Value:MMM dd, yyyy}. Status: {milestone.Status}.",
                    EntityType = "ProjectFinance",
                    EntityId = pf.Id,
                    DaysOverdue = daysOverdue,
                    ProjectName = pf.ProjectId,
                    ClientName = pf.ClientName,
                    Amount = milestoneAmount,
                    Currency = pf.Currency,
                    DueDate = milestone.InvoiceDate
                });
            }

            // --- 1b. Stakeholder Payout Pending ---
            var stakeholders = await _uow.Stakeholders.FindAsync(s => s.ProjectFinanceId == pf.Id);
            foreach (var sh in stakeholders)
            {
                if (sh.PayoutStatus == "Paid" || string.IsNullOrWhiteSpace(sh.Name)) continue;
                var daysPending = (today - sh.CreatedAt.Date).Days;
                if (daysPending < 7) continue;

                alerts.Add(new AlertDto
                {
                    Category = "stakeholder_payout",
                    Severity = daysPending > 30 ? "critical" : "warning",
                    Title = $"Stakeholder payout pending — {sh.Name}",
                    Message = $"Payout for {sh.Name} ({sh.Percentage}%) on project {pf.ProjectId} ({pf.ClientName}) is pending for {daysPending} days.",
                    EntityType = "ProjectFinance",
                    EntityId = pf.Id,
                    DaysOverdue = daysPending,
                    ProjectName = pf.ProjectId,
                    ClientName = pf.ClientName,
                    Amount = pf.DealValue.HasValue && sh.Percentage.HasValue ? pf.DealValue.Value * sh.Percentage.Value / 100 : null,
                    Currency = pf.Currency
                });
            }
        }

        // --- 2. Sales Aging Alerts ---
        var projects = await _uow.Projects.FindAsync(p => p.UserId == userId);
        foreach (var project in projects)
        {
            var stageIndex = project.ActiveStage;
            if (stageIndex < 0 || stageIndex >= DefaultStages.Length) continue;

            var (stageLabel, ageingDays) = DefaultStages[stageIndex];

            DateTime? stageEnteredAt = null;
            if (!string.IsNullOrWhiteSpace(project.History))
            {
                try
                {
                    using var doc = JsonDocument.Parse(project.History);
                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var entry in doc.RootElement.EnumerateArray())
                        {
                            var toStage = entry.TryGetProperty("toStage", out var ts) ? ts.GetInt32() : -1;
                            if (toStage == stageIndex && entry.TryGetProperty("timestamp", out var tsVal))
                            {
                                if (DateTime.TryParse(tsVal.GetString(), out var dt))
                                    stageEnteredAt = dt;
                            }
                        }
                    }
                }
                catch { /* ignore parse errors */ }
            }

            stageEnteredAt ??= project.CreatedAt;

            var daysInStage = (today - stageEnteredAt.Value.Date).Days;
            if (daysInStage <= ageingDays) continue;

            var overdueDays = daysInStage - ageingDays;

            alerts.Add(new AlertDto
            {
                Category = "sales_aging",
                Severity = overdueDays > 30 ? "critical" : "warning",
                Title = $"{project.Title ?? project.CustomId} stuck in {stageLabel}",
                Message = $"\"{project.Title}\" ({project.CustomId}) for {project.ClientName} has been in {stageLabel} for {daysInStage}d (limit: {ageingDays}d). Overdue by {overdueDays}d.",
                EntityType = "Project",
                EntityId = project.Id,
                DaysOverdue = overdueDays,
                ProjectName = project.Title,
                ClientName = project.ClientName,
                StageName = stageLabel
            });
        }

        // --- 3. Task Overdue Alerts ---
        var tasks = await _uow.Tasks.FindAsync(t => t.UserId == userId);
        foreach (var task in tasks)
        {
            if (task.DueDate == null || task.Status == "Completed" || task.Status == "Done") continue;
            var daysOverdue = (today - task.DueDate.Value.Date).Days;
            if (daysOverdue < 0) continue;

            alerts.Add(new AlertDto
            {
                Category = "task_overdue",
                Severity = daysOverdue > 7 ? "critical" : daysOverdue > 0 ? "warning" : "info",
                Title = daysOverdue == 0 ? $"Task due today — {task.Title}" : $"Task overdue by {daysOverdue}d — {task.Title}",
                Message = $"Task \"{task.Title}\" (Priority: {task.Priority}) was due on {task.DueDate.Value:MMM dd, yyyy}. Status: {task.Status}.",
                EntityType = "Task",
                EntityId = task.Id,
                DaysOverdue = daysOverdue,
                ProjectName = task.Title,
                DueDate = task.DueDate
            });
        }

        // --- 4. Pending Expense Alerts (old pending expenses) ---
        var expenses = await _uow.Expenses.FindAsync(e => e.UserId == userId);
        foreach (var expense in expenses)
        {
            if (expense.Status == "Paid") continue;
            var daysPending = (today - expense.Date.Date).Days;
            if (daysPending < 7) continue;

            alerts.Add(new AlertDto
            {
                Category = "expense_pending",
                Severity = daysPending > 30 ? "critical" : "warning",
                Title = $"Expense unpaid — {expense.Category ?? "Uncategorized"}",
                Message = $"Expense of {expense.Amount:N0} for \"{expense.Description ?? expense.Category}\" ({expense.ProjectDepartment ?? "General"}) dated {expense.Date:MMM dd, yyyy} is still {expense.Status}. Pending for {daysPending}d.",
                EntityType = "Expense",
                EntityId = expense.Id,
                DaysOverdue = daysPending,
                Amount = expense.Amount,
                DueDate = expense.Date
            });
        }

        // --- 5. Income Not Received Alerts ---
        var incomes = await _uow.Incomes.FindAsync(i => i.UserId == userId);
        foreach (var income in incomes)
        {
            if (income.Status == "Paid") continue;
            var daysPending = (today - income.Date.Date).Days;
            if (daysPending < 7) continue;

            alerts.Add(new AlertDto
            {
                Category = "income_pending",
                Severity = daysPending > 30 ? "critical" : "warning",
                Title = $"Income not received — {income.Category ?? "Uncategorized"}",
                Message = $"Income of {income.Amount:N0} for \"{income.Description ?? income.Category}\" ({income.ProjectDepartment ?? "General"}) dated {income.Date:MMM dd, yyyy} is still {income.Status}. Pending for {daysPending}d.",
                EntityType = "Income",
                EntityId = income.Id,
                DaysOverdue = daysPending,
                Amount = income.Amount,
                DueDate = income.Date
            });
        }

        // --- 6. Upcoming Payment Reminders (milestones due within next 3 days) ---
        foreach (var pf in projectFinances)
        {
            var milestones = await _uow.Milestones.FindAsync(m => m.ProjectFinanceId == pf.Id);
            foreach (var milestone in milestones)
            {
                if (milestone.InvoiceDate == null || milestone.Status == "Paid") continue;
                var daysUntilDue = (milestone.InvoiceDate.Value.Date - today).Days;
                if (daysUntilDue < 1 || daysUntilDue > 3) continue;

                var milestoneAmount = pf.DealValue.HasValue && milestone.Percentage.HasValue
                    ? pf.DealValue.Value * milestone.Percentage.Value / 100
                    : (decimal?)null;

                alerts.Add(new AlertDto
                {
                    Category = "payment_upcoming",
                    Severity = "info",
                    Title = $"Payment due in {daysUntilDue}d — {pf.ClientName}",
                    Message = $"Milestone \"{milestone.Name ?? "Payment"}\" for {pf.ClientName} ({pf.ProjectId}) is due on {milestone.InvoiceDate.Value:MMM dd, yyyy}.",
                    EntityType = "ProjectFinance",
                    EntityId = pf.Id,
                    DaysOverdue = 0,
                    ProjectName = pf.ProjectId,
                    ClientName = pf.ClientName,
                    Amount = milestoneAmount,
                    Currency = pf.Currency,
                    DueDate = milestone.InvoiceDate
                });
            }
        }

        // --- 7. Upcoming Task Reminders (tasks due within next 3 days) ---
        foreach (var task in tasks)
        {
            if (task.DueDate == null || task.Status == "Completed" || task.Status == "Done") continue;
            var daysUntilDue = (task.DueDate.Value.Date - today).Days;
            if (daysUntilDue < 1 || daysUntilDue > 3) continue;

            alerts.Add(new AlertDto
            {
                Category = "task_upcoming",
                Severity = "info",
                Title = $"Task due in {daysUntilDue}d — {task.Title}",
                Message = $"Task \"{task.Title}\" (Priority: {task.Priority}) is due on {task.DueDate.Value:MMM dd, yyyy}.",
                EntityType = "Task",
                EntityId = task.Id,
                DaysOverdue = 0,
                ProjectName = task.Title,
                DueDate = task.DueDate
            });
        }

        // Sort: critical first, then warning, then info; within same severity by days overdue
        return alerts
            .OrderByDescending(a => a.Severity == "critical" ? 2 : a.Severity == "warning" ? 1 : 0)
            .ThenByDescending(a => a.DaysOverdue);
    }

    private static NotificationDto MapToDto(Notification n) => new()
    {
        Id = n.Id,
        Title = n.Title,
        Message = n.Message,
        Type = n.Type,
        IsRead = n.IsRead,
        EntityType = n.EntityType,
        EntityId = n.EntityId,
        CreatedAt = n.CreatedAt
    };
}
