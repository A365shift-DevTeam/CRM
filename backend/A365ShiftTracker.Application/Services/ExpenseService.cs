using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class ExpenseService : IExpenseService
{
    private readonly IUnitOfWork _uow;

    public ExpenseService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<ExpenseDto>> GetAllAsync(int userId)
    {
        var expenses = await _uow.Expenses.FindAsync(e => e.UserId == userId);
        return expenses.OrderByDescending(e => e.Date).Select(MapToDto);
    }

    public async Task<ExpenseDto> CreateAsync(CreateExpenseRequest request, int userId)
    {
        var entity = new Expense
        {
            UserId = userId,
            Date = request.Date,
            Category = request.Category,
            Amount = request.Amount,
            Description = request.Description,
            EmployeeName = request.EmployeeName,
            ProjectDepartment = request.ProjectDepartment,
            ReceiptUrl = request.ReceiptUrl,
            Details = request.Details is not null ? JsonSerializer.Serialize(request.Details) : null,
            Status = request.Status ?? "Pending"
        };

        await _uow.Expenses.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<ExpenseDto> UpdateAsync(int id, UpdateExpenseRequest request, int userId)
    {
        var entity = await _uow.Expenses.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Expense {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this expense.");

        entity.Date = request.Date;
        entity.Category = request.Category;
        entity.Amount = request.Amount;
        entity.Description = request.Description;
        entity.EmployeeName = request.EmployeeName;
        entity.ProjectDepartment = request.ProjectDepartment;
        entity.ReceiptUrl = request.ReceiptUrl;
        entity.Status = request.Status ?? entity.Status;
        if (request.Details is not null)
            entity.Details = JsonSerializer.Serialize(request.Details);

        await _uow.Expenses.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var entity = await _uow.Expenses.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Expense {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this expense.");

        await _uow.Expenses.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static ExpenseDto MapToDto(Expense e) => new()
    {
        Id = e.Id, Date = e.Date, Category = e.Category, Amount = e.Amount,
        Description = e.Description, EmployeeName = e.EmployeeName,
        ProjectDepartment = e.ProjectDepartment, ReceiptUrl = e.ReceiptUrl,
        Details = e.Details is not null ? JsonSerializer.Deserialize<object>(e.Details) : null,
        Status = e.Status, CreatedAt = e.CreatedAt
    };
}
