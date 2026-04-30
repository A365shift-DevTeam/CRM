using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;
using Microsoft.Extensions.Logging;
namespace A365ShiftTracker.Application.Services;

public class ExpenseService : IExpenseService
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<ExpenseService> _logger;

    public ExpenseService(IUnitOfWork uow, ILogger<ExpenseService> logger)
    {
        _uow = uow;
        _logger = logger;
    }

    public async Task<PagedResult<ExpenseDto>> GetAllAsync(int userId, int page, int pageSize)
    {
        try
        {
            var paged = await _uow.Expenses.GetPagedAsync(
                e => e.UserId == userId, page, pageSize,
                q => q.OrderByDescending(e => e.Date));
            return new PagedResult<ExpenseDto>
            {
                Items = paged.Items.Select(MapToDto),
                TotalCount = paged.TotalCount, Page = paged.Page, PageSize = paged.PageSize
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetAllAsync));
            throw;
        }
    }

    public async Task<ExpenseDto> CreateAsync(CreateExpenseRequest request, int userId, int orgId)
    {
        try
        {
            var entity = new Expense
            {
                UserId = userId,
                OrgId = orgId,
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(CreateAsync));
            throw;
        }
    }

    public async Task<ExpenseDto> UpdateAsync(int id, UpdateExpenseRequest request, int userId)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(UpdateAsync));
            throw;
        }
    }

    public async Task DeleteAsync(int id, int userId)
    {
        try
        {
            var entity = await _uow.Expenses.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Expense {id} not found.");
    
            if (entity.UserId != userId)
                throw new UnauthorizedAccessException("You do not have access to this expense.");
    
            await _uow.Expenses.DeleteAsync(entity);
            await _uow.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(DeleteAsync));
            throw;
        }
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

