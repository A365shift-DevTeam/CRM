using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace A365ShiftTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("api/audit-logs")]
public class AuditLogsController : BaseApiController
{
    private readonly IUnitOfWork _uow;

    public AuditLogsController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    // GET /api/audit-logs?entityName=Contact&entityId=42&page=1&pageSize=50
    [HttpGet]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string entityName,
        [FromQuery] int entityId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var query = _uow.AuditLogs.Query()
                .Where(a => a.EntityName == entityName && a.EntityId == entityId)
                .OrderByDescending(a => a.ChangedAt);

            var total = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    EntityName = a.EntityName,
                    EntityId = a.EntityId,
                    FieldName = a.FieldName,
                    OldValue = a.OldValue,
                    NewValue = a.NewValue,
                    Action = a.Action,
                    Description = a.Description,
                    ChangedByUserId = a.ChangedByUserId,
                    ChangedByName = a.ChangedByName,
                    ChangedAt = a.ChangedAt,
                    IpAddress = a.IpAddress
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(new { items, total, page, pageSize }, "Audit logs retrieved"));
        }
        catch (Exception ex) { return InternalError(ex); }
    }
}

