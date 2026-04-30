using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
namespace A365ShiftTracker.Application.Services;

public class TimesheetService : ITimesheetService
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<TimesheetService> _logger;

    public TimesheetService(IUnitOfWork uow, ILogger<TimesheetService> logger)
    {
        _uow = uow;
        _logger = logger;
    }

    // ─── Entries ───────────────────────────────────────────

    public async Task<PagedResult<TimesheetEntryDto>> GetEntriesAsync(int userId, int page, int pageSize, string? customer = null)
    {
        try
        {
            var paged = await _uow.TimesheetEntries.GetPagedAsync(
                t => t.UserId == userId && (customer == null || t.Customer == customer),
                page, pageSize,
                q => q.OrderByDescending(t => t.StartDatetime));
            return new PagedResult<TimesheetEntryDto>
            {
                Items = paged.Items.Select(MapEntryToDto),
                TotalCount = paged.TotalCount, Page = paged.Page, PageSize = paged.PageSize
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetEntriesAsync));
            throw;
        }
    }

    public async Task<TimesheetEntryDto> CreateEntryAsync(CreateTimesheetEntryRequest request, int userId)
    {
        try
        {
            var valuesJson = request.Values is not null ? JsonSerializer.Serialize(request.Values) : null;
    
            var entity = new TimesheetEntry
            {
                UserId = userId,
                Task = request.Task,
                StartDatetime = request.StartDatetime,
                EndDatetime = request.EndDatetime,
                Notes = request.Notes,
                Person = request.Person,
                Customer = request.Customer,
                Site = request.Site,
                Attachments = request.Attachments,
                Values = valuesJson
            };
    
            // Extract dedicated column values from the Values JSON when top-level fields are null
            await ExtractDedicatedFieldsFromValues(entity);
    
            await _uow.TimesheetEntries.AddAsync(entity);
            await _uow.SaveChangesAsync();
            return MapEntryToDto(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(CreateEntryAsync));
            throw;
        }
    }

    public async Task<TimesheetEntryDto> UpdateEntryAsync(int id, UpdateTimesheetEntryRequest request, int userId)
    {
        try
        {
            var entity = await _uow.TimesheetEntries.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Timesheet entry {id} not found.");
    
            if (entity.UserId != userId)
                throw new UnauthorizedAccessException("You do not have access to this timesheet entry.");
    
            entity.Task = request.Task;
            entity.StartDatetime = request.StartDatetime;
            entity.EndDatetime = request.EndDatetime;
            entity.Notes = request.Notes;
            entity.Person = request.Person;
            entity.Customer = request.Customer;
            entity.Site = request.Site;
            entity.Attachments = request.Attachments;
            if (request.Values is not null)
                entity.Values = JsonSerializer.Serialize(request.Values);
    
            // Extract dedicated column values from the Values JSON when top-level fields are null
            await ExtractDedicatedFieldsFromValues(entity);
    
            await _uow.TimesheetEntries.UpdateAsync(entity);
            await _uow.SaveChangesAsync();
            return MapEntryToDto(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(UpdateEntryAsync));
            throw;
        }
    }

    public async Task DeleteEntryAsync(int id, int userId)
    {
        try
        {
            var entity = await _uow.TimesheetEntries.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Timesheet entry {id} not found.");
    
            if (entity.UserId != userId)
                throw new UnauthorizedAccessException("You do not have access to this timesheet entry.");
    
            await _uow.TimesheetEntries.DeleteAsync(entity);
            await _uow.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(DeleteEntryAsync));
            throw;
        }
    }

    // ─── Columns (per-org, shared across users within org) ───

    private IQueryable<TimesheetColumn> OrgColumns(int orgId)
        => _uow.TimesheetColumns.Query().IgnoreQueryFilters().Where(c => c.OrgId == orgId && !c.IsDeleted);

    public async Task<IEnumerable<TimesheetColumnDto>> GetColumnsAsync(int orgId)
    {
        try
        {
            var columns = await OrgColumns(orgId).OrderBy(c => c.Order).ToListAsync();

            if (!columns.Any())
            {
                var defaults = GetDefaultColumns(orgId);
                foreach (var col in defaults)
                    await _uow.TimesheetColumns.AddAsync(col);
                await _uow.SaveChangesAsync();
                columns = await OrgColumns(orgId).OrderBy(c => c.Order).ToListAsync();
            }

            return columns.Select(MapColumnToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetColumnsAsync));
            throw;
        }
    }

    public async Task<TimesheetColumnDto> AddColumnAsync(CreateTimesheetColumnRequest request, int orgId)
    {
        try
        {
            var order = await OrgColumns(orgId).CountAsync();

            var entity = new TimesheetColumn
            {
                OrgId = orgId,
                ColId = $"col-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                Name = request.Name,
                Type = request.Type,
                Required = request.Required,
                Visible = request.Visible,
                Order = order,
                Config = request.Config is not null ? JsonSerializer.Serialize(request.Config) : null
            };

            await _uow.TimesheetColumns.AddAsync(entity);
            await _uow.SaveChangesAsync();
            return MapColumnToDto(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(AddColumnAsync));
            throw;
        }
    }

    public async Task<TimesheetColumnDto> UpdateColumnAsync(string colId, UpdateTimesheetColumnRequest request, int orgId)
    {
        try
        {
            var entity = await OrgColumns(orgId).FirstOrDefaultAsync(c => c.ColId == colId)
                ?? throw new KeyNotFoundException($"Column '{colId}' not found.");
    
            if (request.Name is not null) entity.Name = request.Name;
            if (request.Type is not null) entity.Type = request.Type;
            if (request.Required.HasValue) entity.Required = request.Required.Value;
            if (request.Visible.HasValue) entity.Visible = request.Visible.Value;
            if (request.Config is not null) entity.Config = JsonSerializer.Serialize(request.Config);
    
            await _uow.TimesheetColumns.UpdateAsync(entity);
            await _uow.SaveChangesAsync();
            return MapColumnToDto(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(UpdateColumnAsync));
            throw;
        }
    }

    public async Task DeleteColumnAsync(string colId, int orgId)
    {
        try
        {
            var defaultIds = new[] { "col-id", "col-task", "col-start-datetime", "col-end-datetime",
                                      "col-notes", "col-name", "col-customer", "col-site", "col-attachments" };
            if (defaultIds.Contains(colId))
                throw new InvalidOperationException("Cannot delete default columns.");

            var entity = await OrgColumns(orgId).FirstOrDefaultAsync(c => c.ColId == colId)
                ?? throw new KeyNotFoundException($"Column '{colId}' not found.");

            await _uow.TimesheetColumns.DeleteAsync(entity);
            await _uow.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(DeleteColumnAsync));
            throw;
        }
    }

    public async Task ReorderColumnsAsync(List<string> orderedColIds, int orgId)
    {
        try
        {
            var columns = await OrgColumns(orgId).ToListAsync();
            foreach (var col in columns)
            {
                var newOrder = orderedColIds.IndexOf(col.ColId);
                if (newOrder >= 0)
                {
                    col.Order = newOrder;
                    await _uow.TimesheetColumns.UpdateAsync(col);
                }
            }
            await _uow.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(ReorderColumnsAsync));
            throw;
        }
    }

    // ─── Field Extraction from Values JSON ─────────────────
    // The frontend sends all data inside the "values" dict keyed by column DB id.
    // This method maps those values back to the dedicated entity columns.
    private async Task ExtractDedicatedFieldsFromValues(TimesheetEntry entity)
    {
        if (string.IsNullOrEmpty(entity.Values)) return;

        Dictionary<string, JsonElement>? valuesDict;
        try
        {
            valuesDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(entity.Values);
        }
        catch
        {
            return;
        }
        if (valuesDict == null || valuesDict.Count == 0) return;

        // Build a map of column DB id → colId (bypass org filter — colId is stable across orgs)
        var columns = await _uow.TimesheetColumns.Query().IgnoreQueryFilters().ToListAsync();
        var idToColId = columns.ToDictionary(c => c.Id.ToString(), c => c.ColId);

        foreach (var kvp in valuesDict)
        {
            if (!idToColId.TryGetValue(kvp.Key, out var colId)) continue;
            var val = kvp.Value.GetString();

            switch (colId)
            {
                case "col-task":
                    entity.Task ??= val;
                    break;
                case "col-start-datetime":
                    if (entity.StartDatetime == null && DateTime.TryParse(val, out var startDt))
                        entity.StartDatetime = startDt.ToUniversalTime();
                    break;
                case "col-end-datetime":
                    if (entity.EndDatetime == null && DateTime.TryParse(val, out var endDt))
                        entity.EndDatetime = endDt.ToUniversalTime();
                    break;
                case "col-notes":
                    entity.Notes ??= val;
                    break;
                case "col-name":
                    entity.Person ??= val;
                    break;
                case "col-customer":
                    entity.Customer ??= val;
                    break;
                case "col-site":
                    entity.Site ??= val;
                    break;
                case "col-attachments":
                    entity.Attachments ??= val;
                    break;
            }
        }
    }

    // ─── Helpers ───────────────────────────────────────────

    private static TimesheetEntryDto MapEntryToDto(TimesheetEntry e) => new()
    {
        Id = e.Id, Task = e.Task, StartDatetime = e.StartDatetime,
        EndDatetime = e.EndDatetime, Notes = e.Notes, Person = e.Person,
        Customer = e.Customer, Site = e.Site, Attachments = e.Attachments,
        Values = e.Values is not null ? JsonSerializer.Deserialize<object>(e.Values) : null,
        CreatedAt = e.CreatedAt
    };

    private static TimesheetColumnDto MapColumnToDto(TimesheetColumn c) => new()
    {
        Id = c.Id, ColId = c.ColId, Name = c.Name, Type = c.Type,
        Required = c.Required, Visible = c.Visible, Order = c.Order,
        Config = c.Config is not null ? JsonSerializer.Deserialize<object>(c.Config) : null
    };

    private static List<TimesheetColumn> GetDefaultColumns(int orgId) =>
    [
        new() { OrgId = orgId, ColId = "col-id", Name = "ID", Type = "text", Required = false, Visible = false, Order = 0, Config = "{\"readOnly\":true}" },
        new() { OrgId = orgId, ColId = "col-task", Name = "Task", Type = "text", Required = true, Visible = true, Order = 1 },
        new() { OrgId = orgId, ColId = "col-start-datetime", Name = "Start Date & Time", Type = "datetime", Required = true, Visible = true, Order = 2 },
        new() { OrgId = orgId, ColId = "col-end-datetime", Name = "End Date & Time", Type = "datetime", Required = false, Visible = true, Order = 3 },
        new() { OrgId = orgId, ColId = "col-notes", Name = "Notes", Type = "text", Required = false, Visible = true, Order = 4, Config = "{\"multiline\":true}" },
        new() { OrgId = orgId, ColId = "col-name", Name = "Person", Type = "text", Required = false, Visible = true, Order = 5 },
        new() { OrgId = orgId, ColId = "col-customer", Name = "Customer", Type = "text", Required = false, Visible = true, Order = 6 },
        new() { OrgId = orgId, ColId = "col-site", Name = "Site", Type = "text", Required = false, Visible = true, Order = 7 },
        new() { OrgId = orgId, ColId = "col-attachments", Name = "Attachments", Type = "file", Required = false, Visible = true, Order = 8 }
    ];
}

