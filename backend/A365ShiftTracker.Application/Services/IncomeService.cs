using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;
using Microsoft.Extensions.Logging;
namespace A365ShiftTracker.Application.Services;

public class IncomeService : IIncomeService
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<IncomeService> _logger;

    public IncomeService(IUnitOfWork uow, ILogger<IncomeService> logger)
    {
        _uow = uow;
        _logger = logger;
    }

    public async Task<PagedResult<IncomeDto>> GetAllAsync(int userId, bool isOrgAdmin, int page, int pageSize)
    {
        try
        {
            // ORG_ADMIN sees all org incomes (org-scoped by EF global filter).
            // Other roles see only their own entries.
            var paged = isOrgAdmin
                ? await _uow.Incomes.GetPagedAsync(
                    _ => true, page, pageSize,
                    q => q.OrderByDescending(i => i.Date))
                : await _uow.Incomes.GetPagedAsync(
                    i => i.UserId == userId, page, pageSize,
                    q => q.OrderByDescending(i => i.Date));
    
            return new PagedResult<IncomeDto>
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

    public async Task<IncomeDto> CreateAsync(CreateIncomeRequest request, int userId, int orgId)
    {
        try
        {
            var entity = new Income
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
                Status = request.Status ?? "Pending",
                Source = request.Source,
                InvoiceId = request.InvoiceId,
            };
    
            await _uow.Incomes.AddAsync(entity);
            await _uow.SaveChangesAsync();
            return MapToDto(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(CreateAsync));
            throw;
        }
    }

    public async Task<IncomeDto> UpdateAsync(int id, UpdateIncomeRequest request, int userId, bool isOrgAdmin)
    {
        try
        {
            var entity = await _uow.Incomes.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Income {id} not found.");
    
            if (!isOrgAdmin && entity.UserId != userId)
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(UpdateAsync));
            throw;
        }
    }

    public async Task DeleteAsync(int id, int userId, bool isOrgAdmin)
    {
        try
        {
            var entity = await _uow.Incomes.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Income {id} not found.");
    
            if (!isOrgAdmin && entity.UserId != userId)
                throw new UnauthorizedAccessException("You do not have access to this income.");
    
            await _uow.Incomes.DeleteAsync(entity);
            await _uow.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(DeleteAsync));
            throw;
        }
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

