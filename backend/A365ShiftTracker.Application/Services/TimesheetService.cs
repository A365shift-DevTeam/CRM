using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class TimesheetService : ITimesheetService
{
    private readonly IUnitOfWork _uow;

    public TimesheetService(IUnitOfWork uow) => _uow = uow;

    // ─── Entries ───────────────────────────────────────────

    public async Task<PagedResult<TimesheetEntryDto>> GetEntriesAsync(int userId, int page, int pageSize, string? customer = null)
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

    public async Task<TimesheetEntryDto> CreateEntryAsync(CreateTimesheetEntryRequest request, int userId)
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

    public async Task<TimesheetEntryDto> UpdateEntryAsync(int id, UpdateTimesheetEntryRequest request, int userId)
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

    public async Task DeleteEntryAsync(int id, int userId)
    {
        var entity = await _uow.TimesheetEntries.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Timesheet entry {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this timesheet entry.");

        await _uow.TimesheetEntries.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    // ─── Columns (shared across users) ───────────────────

    public async Task<IEnumerable<TimesheetColumnDto>> GetColumnsAsync()
    {
        var columns = await _uow.TimesheetColumns.GetAllAsync();

        // Seed defaults if empty
        if (!columns.Any())
        {
            var defaults = GetDefaultColumns();
            foreach (var col in defaults)
                await _uow.TimesheetColumns.AddAsync(col);
            await _uow.SaveChangesAsync();
            columns = await _uow.TimesheetColumns.GetAllAsync();
        }

        return columns.OrderBy(c => c.Order).Select(MapColumnToDto);
    }

    public async Task<TimesheetColumnDto> AddColumnAsync(CreateTimesheetColumnRequest request)
    {
        var allColumns = await _uow.TimesheetColumns.GetAllAsync();
        var order = allColumns.Count();

        var entity = new TimesheetColumn
        {
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

    public async Task<TimesheetColumnDto> UpdateColumnAsync(string colId, UpdateTimesheetColumnRequest request)
    {
        var columns = await _uow.TimesheetColumns.FindAsync(c => c.ColId == colId);
        var entity = columns.FirstOrDefault()
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

    public async Task DeleteColumnAsync(string colId)
    {
        var defaultIds = new[] { "col-id", "col-task", "col-start-datetime", "col-end-datetime",
                                  "col-notes", "col-name", "col-customer", "col-site", "col-attachments" };
        if (defaultIds.Contains(colId))
            throw new InvalidOperationException("Cannot delete default columns.");

        var columns = await _uow.TimesheetColumns.FindAsync(c => c.ColId == colId);
        var entity = columns.FirstOrDefault()
            ?? throw new KeyNotFoundException($"Column '{colId}' not found.");

        await _uow.TimesheetColumns.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    public async Task ReorderColumnsAsync(List<string> orderedColIds)
    {
        var allColumns = await _uow.TimesheetColumns.GetAllAsync();
        foreach (var col in allColumns)
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

        // Build a map of column DB id → colId
        var columns = await _uow.TimesheetColumns.GetAllAsync();
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

    private static List<TimesheetColumn> GetDefaultColumns() =>
    [
        new() { ColId = "col-id", Name = "ID", Type = "text", Required = false, Visible = false, Order = 0, Config = "{\"readOnly\":true}" },
        new() { ColId = "col-task", Name = "Task", Type = "text", Required = true, Visible = true, Order = 1 },
        new() { ColId = "col-start-datetime", Name = "Start Date & Time", Type = "datetime", Required = true, Visible = true, Order = 2 },
        new() { ColId = "col-end-datetime", Name = "End Date & Time", Type = "datetime", Required = false, Visible = true, Order = 3 },
        new() { ColId = "col-notes", Name = "Notes", Type = "text", Required = false, Visible = true, Order = 4, Config = "{\"multiline\":true}" },
        new() { ColId = "col-name", Name = "Person", Type = "text", Required = false, Visible = true, Order = 5 },
        new() { ColId = "col-customer", Name = "Customer", Type = "text", Required = false, Visible = true, Order = 6 },
        new() { ColId = "col-site", Name = "Site", Type = "text", Required = false, Visible = true, Order = 7 },
        new() { ColId = "col-attachments", Name = "Attachments", Type = "file", Required = false, Visible = true, Order = 8 }
    ];
}
