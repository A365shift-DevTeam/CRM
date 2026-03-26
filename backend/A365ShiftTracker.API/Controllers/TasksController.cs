using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _service;

    public TasksController(ITaskService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<TaskDto>>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(ApiResponse<IEnumerable<TaskDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<TaskDto>>> Create(CreateTaskRequest request)
    {
        var result = await _service.CreateAsync(request);
        return Ok(ApiResponse<TaskDto>.Ok(result, "Task created."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<TaskDto>>> Update(int id, UpdateTaskRequest request)
    {
        var result = await _service.UpdateAsync(id, request);
        return Ok(ApiResponse<TaskDto>.Ok(result, "Task updated."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return Ok(ApiResponse<bool>.Ok(true, "Task deleted."));
    }
}
