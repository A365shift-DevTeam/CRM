using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class ExpenseService : IExpenseService
{
    private readonly IUnitOfWork _uow;

    public ExpenseService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<ExpenseDto>> GetAllAsync()
    {
        var expenses = await _uow.Expenses.GetAllAsync();
        return expenses.OrderByDescending(e => e.Date).Select(MapToDto);
    }

    public async Task<ExpenseDto> CreateAsync(CreateExpenseRequest request)
    {
        var entity = new Expense
        {
            Date = request.Date,
            Category = request.Category,
            Amount = request.Amount,
            Description = request.Description,
            EmployeeName = request.EmployeeName,
            ProjectDepartment = request.ProjectDepartment,
            ReceiptUrl = request.ReceiptUrl,
            Details = request.Details is not null ? JsonSerializer.Serialize(request.Details) : null
        };

        await _uow.Expenses.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<ExpenseDto> UpdateAsync(int id, UpdateExpenseRequest request)
    {
        var entity = await _uow.Expenses.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Expense {id} not found.");

        entity.Date = request.Date;
        entity.Category = request.Category;
        entity.Amount = request.Amount;
        entity.Description = request.Description;
        entity.EmployeeName = request.EmployeeName;
        entity.ProjectDepartment = request.ProjectDepartment;
        entity.ReceiptUrl = request.ReceiptUrl;
        if (request.Details is not null)
            entity.Details = JsonSerializer.Serialize(request.Details);

        await _uow.Expenses.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _uow.Expenses.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Expense {id} not found.");
        await _uow.Expenses.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static ExpenseDto MapToDto(Expense e) => new()
    {
        Id = e.Id, Date = e.Date, Category = e.Category, Amount = e.Amount,
        Description = e.Description, EmployeeName = e.EmployeeName,
        ProjectDepartment = e.ProjectDepartment, ReceiptUrl = e.ReceiptUrl,
        Details = e.Details is not null ? JsonSerializer.Deserialize<object>(e.Details) : null,
        CreatedAt = e.CreatedAt
    };
}
