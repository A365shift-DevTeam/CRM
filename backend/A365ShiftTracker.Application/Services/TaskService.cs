using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class TaskService : ITaskService
{
    private readonly IUnitOfWork _uow;

    public TaskService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<TaskDto>> GetAllAsync(int userId)
    {
        var tasks = await _uow.Tasks.FindAsync(t => t.UserId == userId);
        return tasks.Select(MapToDto);
    }

    public async Task<TaskDto> CreateAsync(CreateTaskRequest request, int userId)
    {
        var entity = new TaskItem
        {
            UserId = userId,
            Title = request.Title,
            Status = request.Status,
            Priority = request.Priority,
            DueDate = request.DueDate,
            Values = request.Values is not null ? JsonSerializer.Serialize(request.Values) : null
        };

        // Extract dedicated fields from Values JSON if top-level fields are defaults
        ExtractDedicatedFieldsFromValues(entity);

        await _uow.Tasks.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<TaskDto> UpdateAsync(int id, UpdateTaskRequest request, int userId)
    {
        var entity = await _uow.Tasks.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Task {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this task.");

        entity.Title = request.Title;
        entity.Status = request.Status;
        entity.Priority = request.Priority;
        entity.DueDate = request.DueDate;
        if (request.Values is not null)
            entity.Values = JsonSerializer.Serialize(request.Values);

        // Extract dedicated fields from Values JSON if top-level fields are defaults
        ExtractDedicatedFieldsFromValues(entity);

        await _uow.Tasks.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var entity = await _uow.Tasks.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Task {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this task.");

        await _uow.Tasks.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    // ─── Columns (shared across users) ───────────────────

    public async Task<List<TaskColumnDto>> GetColumnsAsync()
    {
        var columns = await _uow.TaskColumns.GetAllAsync();

        // Seed defaults if empty
        if (!columns.Any())
        {
            var defaults = GetDefaultColumns();
            foreach (var col in defaults)
                await _uow.TaskColumns.AddAsync(col);
            await _uow.SaveChangesAsync();
            columns = await _uow.TaskColumns.GetAllAsync();
        }

        return columns.OrderBy(c => c.Order).Select(MapColumnToDto).ToList();
    }

    public async Task<TaskColumnDto> AddColumnAsync(CreateTaskColumnRequest request)
    {
        var allColumns = await _uow.TaskColumns.GetAllAsync();
        var order = allColumns.Count();

        var slug = request.Name.ToLower()
            .Replace(" ", "-")
            .Replace("_", "-");

        var entity = new TaskColumn
        {
            ColId = $"col-{slug}",
            Name = request.Name,
            Type = request.Type,
            Required = request.Required,
            Visible = request.Visible,
            Order = order,
            Config = request.Config is not null ? JsonSerializer.Serialize(request.Config) : null
        };

        await _uow.TaskColumns.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapColumnToDto(entity);
    }

    public async Task<TaskColumnDto> UpdateColumnAsync(string colId, UpdateTaskColumnRequest request)
    {
        var columns = await _uow.TaskColumns.FindAsync(c => c.ColId == colId);
        var entity = columns.FirstOrDefault()
            ?? throw new KeyNotFoundException($"Column '{colId}' not found.");

        if (request.Name is not null) entity.Name = request.Name;
        if (request.Type is not null) entity.Type = request.Type;
        if (request.Required.HasValue) entity.Required = request.Required.Value;
        if (request.Visible.HasValue) entity.Visible = request.Visible.Value;
        if (request.Config is not null) entity.Config = JsonSerializer.Serialize(request.Config);

        await _uow.TaskColumns.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
        return MapColumnToDto(entity);
    }

    public async Task DeleteColumnAsync(string colId)
    {
        var defaultIds = new[] { "id", "title", "status", "priority", "dueDate" };
        if (defaultIds.Contains(colId))
            throw new InvalidOperationException("Cannot delete default columns.");

        var columns = await _uow.TaskColumns.FindAsync(c => c.ColId == colId);
        var entity = columns.FirstOrDefault()
            ?? throw new KeyNotFoundException($"Column '{colId}' not found.");

        await _uow.TaskColumns.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    public async Task ReorderColumnsAsync(ReorderTaskColumnsRequest request)
    {
        var allColumns = await _uow.TaskColumns.GetAllAsync();
        foreach (var col in allColumns)
        {
            var newOrder = request.OrderedColIds.IndexOf(col.ColId);
            if (newOrder >= 0)
            {
                col.Order = newOrder;
                await _uow.TaskColumns.UpdateAsync(col);
            }
        }
        await _uow.SaveChangesAsync();
    }

    // ─── Field Extraction from Values JSON ─────────────────
    // The frontend sends all data inside the "values" dict keyed by colId.
    // This method maps those values back to the dedicated entity columns.
    private static void ExtractDedicatedFieldsFromValues(TaskItem entity)
    {
        if (string.IsNullOrEmpty(entity.Values)) return;

        Dictionary<string, JsonElement>? valuesDict;
        try
        {
            valuesDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(entity.Values);
        }
        catch { return; }
        if (valuesDict == null || valuesDict.Count == 0) return;

        if (valuesDict.TryGetValue("title", out var titleEl))
        {
            var val = titleEl.GetString();
            if (!string.IsNullOrEmpty(val)) entity.Title = val;
        }

        if (valuesDict.TryGetValue("status", out var statusEl))
        {
            var val = statusEl.GetString();
            if (!string.IsNullOrEmpty(val)) entity.Status = val;
        }

        if (valuesDict.TryGetValue("priority", out var priorityEl))
        {
            var val = priorityEl.GetString();
            if (!string.IsNullOrEmpty(val)) entity.Priority = val;
        }

        if (valuesDict.TryGetValue("dueDate", out var dueDateEl))
        {
            var val = dueDateEl.GetString();
            if (!string.IsNullOrEmpty(val) && DateTime.TryParse(val, out var dt))
                entity.DueDate = dt.ToUniversalTime();
        }
    }

    // ─── Helpers ───────────────────────────────────────────

    private static TaskDto MapToDto(TaskItem t) => new()
    {
        Id = t.Id,
        Title = t.Title,
        Status = t.Status,
        Priority = t.Priority,
        DueDate = t.DueDate,
        Values = t.Values is not null ? JsonSerializer.Deserialize<object>(t.Values) : null
    };

    private static TaskColumnDto MapColumnToDto(TaskColumn c) => new()
    {
        Id = c.Id, ColId = c.ColId, Name = c.Name, Type = c.Type,
        Required = c.Required, Visible = c.Visible, Order = c.Order,
        Config = c.Config is not null ? JsonSerializer.Deserialize<object>(c.Config) : null
    };

    private static List<TaskColumn> GetDefaultColumns() =>
    [
        new() { ColId = "id", Name = "ID", Type = "number", Required = false, Visible = true, Order = 0, Config = "{\"readOnly\":true,\"autoIncrement\":true}" },
        new() { ColId = "title", Name = "TITLE", Type = "text", Required = true, Visible = true, Order = 1 },
        new() { ColId = "status", Name = "STATUS", Type = "choice", Required = false, Visible = true, Order = 2,
            Config = "{\"options\":[{\"label\":\"Pending\",\"color\":\"#0ea5e9\"},{\"label\":\"In Progress\",\"color\":\"#22c55e\"},{\"label\":\"Completed\",\"color\":\"#10b981\"},{\"label\":\"On Hold\",\"color\":\"#64748b\"}]}" },
        new() { ColId = "priority", Name = "PRIORITY", Type = "choice", Required = false, Visible = true, Order = 3,
            Config = "{\"options\":[{\"label\":\"High\",\"color\":\"#f97316\"},{\"label\":\"Medium\",\"color\":\"#16a34a\"},{\"label\":\"Low\",\"color\":\"#10b981\"}]}" },
        new() { ColId = "dueDate", Name = "DUE DATE", Type = "datetime", Required = false, Visible = true, Order = 4, Config = "{\"dateOnly\":true}" }
    ];
}
