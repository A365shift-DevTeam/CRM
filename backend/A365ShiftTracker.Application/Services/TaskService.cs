using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
namespace A365ShiftTracker.Application.Services;

public class TaskService : ITaskService
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<TaskService> _logger;

    public TaskService(IUnitOfWork uow, ILogger<TaskService> logger)
    {
        _uow = uow;
        _logger = logger;
    }

    public async Task<PagedResult<TaskDto>> GetAllAsync(int userId, int page, int pageSize)
    {
        try
        {
            var paged = await _uow.Tasks.GetPagedAsync(
                t => t.UserId == userId, page, pageSize,
                q => q.OrderByDescending(t => t.CreatedAt));
            return new PagedResult<TaskDto>
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

    public async Task<TaskDto> CreateAsync(CreateTaskRequest request, int userId)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(CreateAsync));
            throw;
        }
    }

    public async Task<TaskDto> UpdateAsync(int id, UpdateTaskRequest request, int userId)
    {
        try
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
            var entity = await _uow.Tasks.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Task {id} not found.");
    
            if (entity.UserId != userId)
                throw new UnauthorizedAccessException("You do not have access to this task.");
    
            await _uow.Tasks.DeleteAsync(entity);
            await _uow.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(DeleteAsync));
            throw;
        }
    }

    // ─── Columns (per-org, shared across users within org) ───

    private IQueryable<TaskColumn> OrgColumns(int orgId)
        => _uow.TaskColumns.Query().IgnoreQueryFilters().Where(c => c.OrgId == orgId && !c.IsDeleted);

    public async Task<List<TaskColumnDto>> GetColumnsAsync(int orgId)
    {
        try
        {
            var columns = await OrgColumns(orgId).OrderBy(c => c.Order).ToListAsync();

            if (!columns.Any())
            {
                var defaults = GetDefaultColumns(orgId);
                foreach (var col in defaults)
                    await _uow.TaskColumns.AddAsync(col);
                await _uow.SaveChangesAsync();
                columns = await OrgColumns(orgId).OrderBy(c => c.Order).ToListAsync();
            }

            return columns.Select(MapColumnToDto).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetColumnsAsync));
            throw;
        }
    }

    public async Task<TaskColumnDto> AddColumnAsync(CreateTaskColumnRequest request, int orgId)
    {
        try
        {
            var order = await OrgColumns(orgId).CountAsync();

            var slug = request.Name.ToLower()
                .Replace(" ", "-")
                .Replace("_", "-");

            var entity = new TaskColumn
            {
                OrgId = orgId,
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(AddColumnAsync));
            throw;
        }
    }

    public async Task<TaskColumnDto> UpdateColumnAsync(string colId, UpdateTaskColumnRequest request, int orgId)
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

            await _uow.TaskColumns.UpdateAsync(entity);
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
            var defaultIds = new[] { "id", "title", "status", "priority", "dueDate" };
            if (defaultIds.Contains(colId))
                throw new InvalidOperationException("Cannot delete default columns.");

            var entity = await OrgColumns(orgId).FirstOrDefaultAsync(c => c.ColId == colId)
                ?? throw new KeyNotFoundException($"Column '{colId}' not found.");

            await _uow.TaskColumns.DeleteAsync(entity);
            await _uow.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(DeleteColumnAsync));
            throw;
        }
    }

    public async Task ReorderColumnsAsync(ReorderTaskColumnsRequest request, int orgId)
    {
        try
        {
            var columns = await OrgColumns(orgId).ToListAsync();
            foreach (var col in columns)
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(ReorderColumnsAsync));
            throw;
        }
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

    private static List<TaskColumn> GetDefaultColumns(int orgId) =>
    [
        new() { OrgId = orgId, ColId = "id", Name = "ID", Type = "number", Required = false, Visible = true, Order = 0, Config = "{\"readOnly\":true,\"autoIncrement\":true}" },
        new() { OrgId = orgId, ColId = "title", Name = "TITLE", Type = "text", Required = true, Visible = true, Order = 1 },
        new() { OrgId = orgId, ColId = "status", Name = "STATUS", Type = "choice", Required = false, Visible = true, Order = 2,
            Config = "{\"options\":[{\"label\":\"Pending\",\"color\":\"#0ea5e9\"},{\"label\":\"In Progress\",\"color\":\"#22c55e\"},{\"label\":\"Completed\",\"color\":\"#10b981\"},{\"label\":\"On Hold\",\"color\":\"#64748b\"}]}" },
        new() { OrgId = orgId, ColId = "priority", Name = "PRIORITY", Type = "choice", Required = false, Visible = true, Order = 3,
            Config = "{\"options\":[{\"label\":\"High\",\"color\":\"#f97316\"},{\"label\":\"Medium\",\"color\":\"#16a34a\"},{\"label\":\"Low\",\"color\":\"#10b981\"}]}" },
        new() { OrgId = orgId, ColId = "dueDate", Name = "DUE DATE", Type = "datetime", Required = false, Visible = true, Order = 4, Config = "{\"dateOnly\":true}" }
    ];
}

