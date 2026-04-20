using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace A365ShiftTracker.Application.Services;

public class ContactService : IContactService
{
    private readonly IUnitOfWork _uow;

    public ContactService(IUnitOfWork uow) => _uow = uow;

    public async Task<PagedResult<ContactDto>> GetAllAsync(int userId, int page, int pageSize)
    {
        var paged = await _uow.Contacts.GetPagedAsync(
            c => c.UserId == userId,
            page,
            pageSize,
            q => q.OrderByDescending(c => c.Id));
        return new PagedResult<ContactDto>
        {
            Items = paged.Items.Select(MapToDto),
            TotalCount = paged.TotalCount,
            Page = paged.Page,
            PageSize = paged.PageSize
        };
    }

    public async Task<ContactDto> CreateAsync(CreateContactRequest req, int userId)
    {
        var entity = MapFromRequest(new Contact(), req);
        entity.UserId = userId;
        entity.Score = CalculateLeadScore(entity);
        await _uow.Contacts.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<ContactDto> UpdateAsync(int id, UpdateContactRequest req, int userId)
    {
        var entity = await _uow.Contacts.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Contact {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this contact.");

        MapFromRequest(entity, req);
        entity.Score = CalculateLeadScore(entity);
        await _uow.Contacts.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var entity = await _uow.Contacts.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Contact {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this contact.");

        await _uow.Contacts.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    public async Task<IEnumerable<ContactDto>> GetVendorsAsync(int userId)
    {
        return await _uow.Contacts.Query()
            .Where(c => c.UserId == userId && (c.EntityType == "Vendor" || c.Status == "Vendor"))
            .Select(c => new ContactDto
            {
                Id = c.Id, CompanyId = c.CompanyId, Name = c.Name, JobTitle = c.JobTitle, Phone = c.Phone,
                Email = c.Email, Company = c.Company, Location = c.Location,
                ClientAddress = c.ClientAddress, ClientCountry = c.ClientCountry,
                Gstin = c.Gstin, Pan = c.Pan, Cin = c.Cin,
                InternationalTaxId = c.InternationalTaxId, MsmeStatus = c.MsmeStatus,
                TdsSection = c.TdsSection, TdsRate = c.TdsRate,
                EntityType = c.EntityType, Status = c.Status,
                Rating = c.Rating, Reviews = c.Reviews, Years = c.Years,
                Margin = c.Margin, Avatar = c.Avatar, MatchScore = c.MatchScore,
                MatchLabel = c.MatchLabel, MatchPercentage = c.MatchPercentage,
                Services = c.Services, Notes = c.Notes, Score = c.Score
            })
            .ToListAsync();
    }

    // --- Columns (shared across users) ---
    public async Task<IEnumerable<ContactColumnDto>> GetColumnsAsync()
    {
        var columns = await _uow.ContactColumns.GetAllAsync();

        // Seed default columns if table is empty
        if (!columns.Any())
        {
            columns = await SeedDefaultContactColumns();
        }

        return columns.OrderBy(c => c.Order).Select(c => new ContactColumnDto
        {
            Id = c.Id,
            ColId = c.ColId,
            Name = c.Name,
            Type = c.Type,
            Visible = c.Visible,
            Required = c.Required,
            Order = c.Order,
            Config = c.Config is not null ? JsonSerializer.Deserialize<object>(c.Config) : null
        });
    }

    private async Task<IEnumerable<ContactColumn>> SeedDefaultContactColumns()
    {
        var defaults = new List<ContactColumn>
        {
            new() { ColId = "name", Name = "Name", Type = "text", Visible = true, Required = true, Order = 0, Config = "{}" },
            new() { ColId = "jobTitle", Name = "Job Title", Type = "text", Visible = true, Required = false, Order = 1, Config = "{}" },
            new() { ColId = "phone", Name = "Phone", Type = "text", Visible = true, Required = false, Order = 2, Config = "{}" },
            new() { ColId = "company", Name = "Company", Type = "text", Visible = true, Required = false, Order = 3, Config = "{}" },
            new() { ColId = "location", Name = "Location", Type = "location", Visible = true, Required = false, Order = 4, Config = "{}" },
            new() { ColId = "clientAddress", Name = "Client Address", Type = "text", Visible = true, Required = false, Order = 5, Config = "{}" },
            new() { ColId = "clientCountry", Name = "Country", Type = "text", Visible = true, Required = false, Order = 6, Config = "{}" },
            new() { ColId = "gstin", Name = "GSTIN", Type = "text", Visible = false, Required = false, Order = 7, Config = "{}" },
            new() { ColId = "pan", Name = "PAN", Type = "text", Visible = false, Required = false, Order = 8, Config = "{}" },
            new() { ColId = "cin", Name = "CIN", Type = "text", Visible = false, Required = false, Order = 9, Config = "{}" },
            new() { ColId = "internationalTaxId", Name = "Intl Tax ID (VAT/EIN)", Type = "text", Visible = false, Required = false, Order = 10, Config = "{}" },
            new() { ColId = "msmeStatus", Name = "MSME Status", Type = "text", Visible = false, Required = false, Order = 11, Config = "{}" },
            new() { ColId = "tdsSection", Name = "TDS Section", Type = "text", Visible = false, Required = false, Order = 12, Config = "{}" },
            new() { ColId = "tdsRate", Name = "TDS Rate", Type = "number", Visible = false, Required = false, Order = 13, Config = "{}" },
            new() { ColId = "type", Name = "Entity Type", Type = "choice", Visible = true, Required = false, Order = 14,
                Config = JsonSerializer.Serialize(new { options = new[] {
                    new { label = "Company", color = "#3b82f6" },
                    new { label = "Individual", color = "#8b5cf6" },
                    new { label = "Vendor", color = "#10b981" }
                }})
            },
            new() { ColId = "status", Name = "Status", Type = "choice", Visible = true, Required = false, Order = 15,
                Config = JsonSerializer.Serialize(new { options = new[] {
                    new { label = "Active", color = "#10b981" },
                    new { label = "Inactive", color = "#94a3b8" },
                    new { label = "Lead", color = "#3b82f6" },
                    new { label = "Customer", color = "#06b6d4" }
                }})
            }
        };

        foreach (var col in defaults)
            await _uow.ContactColumns.AddAsync(col);

        await _uow.SaveChangesAsync();
        return defaults;
    }

    public async Task<IEnumerable<ContactColumnDto>> SaveColumnsAsync(List<ContactColumnDto> columns)
    {
        // Delete existing and re-insert
        var existing = await _uow.ContactColumns.GetAllAsync();
        foreach (var col in existing)
            await _uow.ContactColumns.DeleteAsync(col);

        foreach (var dto in columns)
        {
            await _uow.ContactColumns.AddAsync(new ContactColumn
            {
                ColId = dto.ColId,
                Name = dto.Name,
                Type = dto.Type,
                Visible = dto.Visible,
                Required = dto.Required,
                Order = dto.Order,
                Config = dto.Config is not null ? JsonSerializer.Serialize(dto.Config) : null
            });
        }

        await _uow.SaveChangesAsync();
        return await GetColumnsAsync();
    }

    public async Task<ContactColumnDto> AddColumnAsync(CreateContactColumnRequest request)
    {
        var allColumns = await _uow.ContactColumns.GetAllAsync();
        var order = allColumns.Count();

        var entity = new ContactColumn
        {
            ColId = $"col-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            Name = request.Name,
            Type = request.Type,
            Required = request.Required,
            Visible = request.Visible,
            Order = order,
            Config = request.Config is not null ? JsonSerializer.Serialize(request.Config) : null
        };

        await _uow.ContactColumns.AddAsync(entity);
        await _uow.SaveChangesAsync();

        return new ContactColumnDto
        {
            Id = entity.Id,
            ColId = entity.ColId,
            Name = entity.Name,
            Type = entity.Type,
            Required = entity.Required,
            Visible = entity.Visible,
            Order = entity.Order,
            Config = entity.Config is not null ? JsonSerializer.Deserialize<object>(entity.Config) : null
        };
    }

    public async Task<ContactColumnDto> UpdateColumnAsync(string colId, UpdateContactColumnRequest request)
    {
        var columns = await _uow.ContactColumns.FindAsync(c => c.ColId == colId);
        var entity = columns.FirstOrDefault()
            ?? throw new KeyNotFoundException($"Column '{colId}' not found.");

        if (request.Name is not null) entity.Name = request.Name;
        if (request.Type is not null) entity.Type = request.Type;
        if (request.Required.HasValue) entity.Required = request.Required.Value;
        if (request.Visible.HasValue) entity.Visible = request.Visible.Value;
        if (request.Config is not null) entity.Config = JsonSerializer.Serialize(request.Config);

        await _uow.ContactColumns.UpdateAsync(entity);
        await _uow.SaveChangesAsync();

        return new ContactColumnDto
        {
            Id = entity.Id,
            ColId = entity.ColId,
            Name = entity.Name,
            Type = entity.Type,
            Required = entity.Required,
            Visible = entity.Visible,
            Order = entity.Order,
            Config = entity.Config is not null ? JsonSerializer.Deserialize<object>(entity.Config) : null
        };
    }

    public async Task DeleteColumnAsync(string colId)
    {
        var columns = await _uow.ContactColumns.FindAsync(c => c.ColId == colId);
        var entity = columns.FirstOrDefault()
            ?? throw new KeyNotFoundException($"Column '{colId}' not found.");

        await _uow.ContactColumns.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    public async Task ReorderColumnsAsync(List<string> orderedColIds)
    {
        var columns = await _uow.ContactColumns.Query()
            .Where(c => orderedColIds.Contains(c.ColId))
            .ToListAsync();

        foreach (var col in columns)
        {
            var newOrder = orderedColIds.IndexOf(col.ColId);
            if (newOrder >= 0) col.Order = newOrder;
        }

        await _uow.SaveChangesAsync();
    }

    // --- Vendor Responses ---
    public async Task<IEnumerable<VendorResponseDto>> GetVendorResponsesAsync(int vendorId)
    {
        var responses = await _uow.VendorResponses.FindAsync(r => r.VendorId == vendorId);
        return responses.OrderByDescending(r => r.CreatedAt).Select(r => new VendorResponseDto
        {
            Id = r.Id,
            VendorId = r.VendorId,
            Response = r.Response is not null ? JsonSerializer.Deserialize<object>(r.Response) : null,
            CreatedAt = r.CreatedAt
        });
    }

    public async Task<VendorResponseDto> CreateVendorResponseAsync(CreateVendorResponseRequest request)
    {
        var entity = new VendorResponse
        {
            VendorId = request.VendorId,
            Response = request.Response is not null ? JsonSerializer.Serialize(request.Response) : null
        };

        await _uow.VendorResponses.AddAsync(entity);
        await _uow.SaveChangesAsync();

        return new VendorResponseDto
        {
            Id = entity.Id,
            VendorId = entity.VendorId,
            Response = request.Response,
            CreatedAt = entity.CreatedAt
        };
    }

    // --- Vendor Emails ---
    public async Task<VendorEmailDto> SaveEmailSentAsync(CreateVendorEmailRequest request)
    {
        var entity = new VendorEmail
        {
            VendorId = request.VendorId,
            Subject = request.Subject,
            Body = request.Body,
            Recipients = request.Recipients
        };

        await _uow.VendorEmails.AddAsync(entity);
        await _uow.SaveChangesAsync();

        return new VendorEmailDto
        {
            Id = entity.Id,
            VendorId = entity.VendorId,
            Subject = entity.Subject,
            Body = entity.Body,
            Recipients = entity.Recipients,
            Status = entity.Status,
            SentAt = entity.SentAt
        };
    }

    // --- Mapping helpers ---
    private static decimal CalculateLeadScore(Contact c)
    {
        decimal score = 0;
        // Status weight (max 20)
        score += c.Status switch
        {
            "Active" => 20, "Vendor" => 15, "Lead" => 10, "Customer" => 25, _ => 5
        };
        // Rating (max 25)
        score += (c.Rating ?? 0) * 5;
        // Reviews count (max 20)
        if (int.TryParse(c.Reviews, out var reviewCount))
            score += Math.Min(reviewCount * 2, 20);
        // Match percentage (max 30)
        score += (c.MatchPercentage ?? 0) * 0.3m;
        // Years in business (max 5)
        score += Math.Min((c.Years ?? 0) * 1m, 5);
        return Math.Min(Math.Round(score, 1), 100);
    }

    private static ContactDto MapToDto(Contact c) => new()
    {
        Id = c.Id, CompanyId = c.CompanyId, Name = c.Name, JobTitle = c.JobTitle, Phone = c.Phone,
        Email = c.Email, Company = c.Company, Location = c.Location,
        ClientAddress = c.ClientAddress, ClientCountry = c.ClientCountry,
        Gstin = c.Gstin, Pan = c.Pan, Cin = c.Cin,
        InternationalTaxId = c.InternationalTaxId, MsmeStatus = c.MsmeStatus,
        TdsSection = c.TdsSection, TdsRate = c.TdsRate,
        EntityType = c.EntityType, Status = c.Status,
        Rating = c.Rating, Reviews = c.Reviews, Years = c.Years,
        Margin = c.Margin, Avatar = c.Avatar, MatchScore = c.MatchScore,
        MatchLabel = c.MatchLabel, MatchPercentage = c.MatchPercentage,
        Services = c.Services, Notes = c.Notes, Score = c.Score
    };

    private static Contact MapFromRequest(Contact c, CreateContactRequest req)
    {
        c.CompanyId = req.CompanyId;
        c.Name = req.Name; c.JobTitle = req.JobTitle; c.Phone = req.Phone;
        c.Email = req.Email; c.Company = req.Company; c.Location = req.Location;
        c.ClientAddress = req.ClientAddress; c.ClientCountry = req.ClientCountry;
        c.Gstin = req.Gstin; c.Pan = req.Pan; c.Cin = req.Cin;
        c.InternationalTaxId = req.InternationalTaxId; c.MsmeStatus = req.MsmeStatus;
        c.TdsSection = req.TdsSection; c.TdsRate = req.TdsRate;
        c.EntityType = req.EntityType; c.Status = req.Status;
        c.Rating = req.Rating; c.Reviews = req.Reviews; c.Years = req.Years;
        c.Margin = req.Margin; c.Avatar = req.Avatar; c.MatchScore = req.MatchScore;
        c.MatchLabel = req.MatchLabel; c.MatchPercentage = req.MatchPercentage;
        c.Services = req.Services; c.Notes = req.Notes;
        return c;
    }
}
