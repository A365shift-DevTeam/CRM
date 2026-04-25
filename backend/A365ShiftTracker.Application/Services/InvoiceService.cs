using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace A365ShiftTracker.Application.Services;

public class InvoiceService : IInvoiceService
{
    private readonly IUnitOfWork _uow;

    public InvoiceService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<PagedResult<InvoiceDto>> GetAllAsync(int orgId, int page, int pageSize)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);
        var query = _uow.Invoices.Query()
            .AsNoTracking()
            .Include(i => i.Milestone)
            .Where(i => i.OrgId == orgId && !i.IsDeleted)
            .OrderByDescending(i => i.CreatedAt);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResult<InvoiceDto>
        {
            Items = items.Select(MapToDto),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<InvoiceDto?> GetByIdAsync(int id, int orgId)
    {
        var item = await _uow.Invoices.Query()
            .Include(i => i.Milestone)
            .FirstOrDefaultAsync(i => i.Id == id && i.OrgId == orgId);
        return item == null ? null : MapToDto(item);
    }

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceRequest req, int userId, int orgId)
    {
        // Generate invoice number: INV-{YYYY}-{sequential padded to 4}
        var existingCount = await _uow.Invoices.Query().CountAsync(i => i.OrgId == orgId);
        var number = $"INV-{DateTime.UtcNow.Year}-{(existingCount + 1):D4}";

        var entity = new Invoice
        {
            UserId = userId,
            OrgId = orgId,
            InvoiceNumber = number,
            ProjectFinanceId = req.ProjectFinanceId,
            MilestoneId = req.MilestoneId,
            ClientName = req.ClientName,
            ClientAddress = req.ClientAddress,
            ClientGstin = req.ClientGstin,
            DueDate = req.DueDate,
            SubTotal = req.SubTotal,
            TaxAmount = req.TaxAmount,
            TotalAmount = req.TotalAmount,
            Currency = req.Currency,
            Notes = req.Notes
        };

        await _uow.Invoices.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<InvoiceDto?> UpdateStatusAsync(int id, UpdateInvoiceRequest req, int userId, int orgId)
    {
        var entity = await _uow.Invoices.Query()
            .Include(i => i.Milestone)
            .FirstOrDefaultAsync(i => i.Id == id && i.OrgId == orgId);
        if (entity == null) return null;

        entity.Status = req.Status;
        entity.Notes = req.Notes ?? entity.Notes;
        entity.PdfUrl = req.PdfUrl ?? entity.PdfUrl;
        entity.DueDate = req.DueDate ?? entity.DueDate;

        // If marking Paid, update the milestone PaidDate
        if (req.Status == "Paid" && entity.Milestone != null && entity.Milestone.PaidDate == null)
        {
            entity.Milestone.PaidDate = DateTime.UtcNow;
        }

        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<bool> DeleteAsync(int id, int userId, int orgId)
    {
        var entity = await _uow.Invoices.Query()
            .FirstOrDefaultAsync(i => i.Id == id && i.OrgId == orgId);
        if (entity == null) return false;
        await _uow.Invoices.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<List<InvoiceDto>> GetByProjectFinanceAsync(int projectFinanceId, int orgId)
    {
        var items = await _uow.Invoices.Query()
            .Where(i => i.ProjectFinanceId == projectFinanceId && i.OrgId == orgId)
            .Include(i => i.Milestone)
            .OrderByDescending(i => i.InvoiceDate)
            .ToListAsync();
        return items.Select(MapToDto).ToList();
    }

    private static InvoiceDto MapToDto(Invoice i) => new()
    {
        Id = i.Id,
        InvoiceNumber = i.InvoiceNumber,
        ProjectFinanceId = i.ProjectFinanceId,
        MilestoneId = i.MilestoneId,
        ClientName = i.ClientName,
        ClientAddress = i.ClientAddress,
        ClientGstin = i.ClientGstin,
        InvoiceDate = i.InvoiceDate,
        DueDate = i.DueDate,
        SubTotal = i.SubTotal,
        TaxAmount = i.TaxAmount,
        TotalAmount = i.TotalAmount,
        Currency = i.Currency,
        Status = i.Status,
        Notes = i.Notes,
        PdfUrl = i.PdfUrl,
        CreatedAt = i.CreatedAt,
        MilestoneName = i.Milestone?.Name,
        MilestonePercentage = i.Milestone?.Percentage,
    };
}
