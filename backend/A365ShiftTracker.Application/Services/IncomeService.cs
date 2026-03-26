using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class IncomeService : IIncomeService
{
    private readonly IUnitOfWork _uow;

    public IncomeService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<IncomeDto>> GetAllAsync()
    {
        var incomes = await _uow.Incomes.GetAllAsync();
        return incomes.OrderByDescending(i => i.Date).Select(MapToDto);
    }

    public async Task<IncomeDto> CreateAsync(CreateIncomeRequest request)
    {
        var entity = new Income
        {
            Date = request.Date,
            Category = request.Category,
            Amount = request.Amount,
            Description = request.Description,
            EmployeeName = request.EmployeeName,
            ProjectDepartment = request.ProjectDepartment,
            ReceiptUrl = request.ReceiptUrl
        };

        await _uow.Incomes.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<IncomeDto> UpdateAsync(int id, UpdateIncomeRequest request)
    {
        var entity = await _uow.Incomes.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Income {id} not found.");

        entity.Date = request.Date;
        entity.Category = request.Category;
        entity.Amount = request.Amount;
        entity.Description = request.Description;
        entity.EmployeeName = request.EmployeeName;
        entity.ProjectDepartment = request.ProjectDepartment;
        entity.ReceiptUrl = request.ReceiptUrl;

        await _uow.Incomes.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _uow.Incomes.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Income {id} not found.");
        await _uow.Incomes.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static IncomeDto MapToDto(Income i) => new()
    {
        Id = i.Id, Date = i.Date, Category = i.Category, Amount = i.Amount,
        Description = i.Description, EmployeeName = i.EmployeeName,
        ProjectDepartment = i.ProjectDepartment, ReceiptUrl = i.ReceiptUrl,
        CreatedAt = i.CreatedAt
    };
}
