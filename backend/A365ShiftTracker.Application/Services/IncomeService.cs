using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class IncomeService : IIncomeService
{
    private readonly IUnitOfWork _uow;

    public IncomeService(IUnitOfWork uow) => _uow = uow;

    public async Task<PagedResult<IncomeDto>> GetAllAsync(int userId, int page, int pageSize)
    {
        var paged = await _uow.Incomes.GetPagedAsync(
            i => i.UserId == userId, page, pageSize,
            q => q.OrderByDescending(i => i.Date));
        return new PagedResult<IncomeDto>
        {
            Items = paged.Items.Select(MapToDto),
            TotalCount = paged.TotalCount, Page = paged.Page, PageSize = paged.PageSize
        };
    }

    public async Task<IncomeDto> CreateAsync(CreateIncomeRequest request, int userId)
    {
        var entity = new Income
        {
            UserId = userId,
            Date = request.Date,
            Category = request.Category,
            Amount = request.Amount,
            Description = request.Description,
            EmployeeName = request.EmployeeName,
            ProjectDepartment = request.ProjectDepartment,
            ReceiptUrl = request.ReceiptUrl,
            Status = request.Status ?? "Pending",
            Source = request.Source,
            InvoiceId = request.InvoiceId,
        };

        await _uow.Incomes.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<IncomeDto> UpdateAsync(int id, UpdateIncomeRequest request, int userId)
    {
        var entity = await _uow.Incomes.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Income {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this income.");

        entity.Date = request.Date;
        entity.Category = request.Category;
        entity.Amount = request.Amount;
        entity.Description = request.Description;
        entity.EmployeeName = request.EmployeeName;
        entity.ProjectDepartment = request.ProjectDepartment;
        entity.ReceiptUrl = request.ReceiptUrl;
        entity.Status = request.Status ?? entity.Status;
        entity.Source = request.Source ?? entity.Source;
        entity.InvoiceId = request.InvoiceId ?? entity.InvoiceId;

        await _uow.Incomes.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var entity = await _uow.Incomes.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Income {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this income.");

        await _uow.Incomes.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static IncomeDto MapToDto(Income i) => new()
    {
        Id = i.Id, Date = i.Date, Category = i.Category, Amount = i.Amount,
        Description = i.Description, EmployeeName = i.EmployeeName,
        ProjectDepartment = i.ProjectDepartment, ReceiptUrl = i.ReceiptUrl,
        Status = i.Status, Source = i.Source, InvoiceId = i.InvoiceId,
        CreatedAt = i.CreatedAt,
    };
}
