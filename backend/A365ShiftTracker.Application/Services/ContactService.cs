using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class ContactService : IContactService
{
    private readonly IUnitOfWork _uow;

    public ContactService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<ContactDto>> GetAllAsync(int userId)
    {
        var contacts = await _uow.Contacts.FindAsync(c => c.UserId == userId);
        return contacts.Select(MapToDto);
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
        var vendors = await _uow.Contacts.FindAsync(c =>
            c.UserId == userId && (c.EntityType == "Vendor" || c.Status == "Vendor"));
        return vendors.Select(MapToDto);
    }

    // --- Columns (shared across users) ---
    public async Task<IEnumerable<ContactColumnDto>> GetColumnsAsync()
    {
        var columns = await _uow.ContactColumns.GetAllAsync();
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
        Id = c.Id, Name = c.Name, JobTitle = c.JobTitle, Phone = c.Phone,
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
