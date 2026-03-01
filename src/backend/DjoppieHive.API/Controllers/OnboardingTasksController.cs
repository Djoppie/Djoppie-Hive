using DjoppieHive.API.Authorization;
using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Beheer van taken binnen onboarding/offboarding processen.
/// </summary>
[ApiController]
[Route("api/onboarding-tasks")]
[Authorize]
[Tags("Onboarding")]
public class OnboardingTasksController : ControllerBase
{
    private readonly IOnboardingService _onboardingService;
    private readonly ILogger<OnboardingTasksController> _logger;

    public OnboardingTasksController(
        IOnboardingService onboardingService,
        ILogger<OnboardingTasksController> logger)
    {
        _onboardingService = onboardingService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all tasks for a specific process.
    /// </summary>
    [HttpGet("process/{processId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<OnboardingTaskDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<OnboardingTaskDto>>> GetByProcess(
        Guid processId,
        CancellationToken cancellationToken)
    {
        var tasks = await _onboardingService.GetTasksByProcessAsync(processId, cancellationToken);
        return Ok(tasks);
    }

    /// <summary>
    /// Gets tasks assigned to the current user.
    /// </summary>
    [HttpGet("my-tasks")]
    [ProducesResponseType(typeof(IEnumerable<OnboardingTaskDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<OnboardingTaskDto>>> GetMyTasks(
        CancellationToken cancellationToken)
    {
        var userEmail = User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst("email")?.Value
            ?? "unknown";

        var tasks = await _onboardingService.GetMyTasksAsync(userEmail, cancellationToken);
        return Ok(tasks);
    }

    /// <summary>
    /// Gets a specific task by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OnboardingTaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OnboardingTaskDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var task = await _onboardingService.GetTaskByIdAsync(id, cancellationToken);

        if (task == null)
        {
            return NotFound(new { message = $"Taak met ID {id} niet gevonden." });
        }

        return Ok(task);
    }

    /// <summary>
    /// Creates a new task within a process.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = PolicyNames.RequireHrAdmin)]
    [ProducesResponseType(typeof(OnboardingTaskDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<OnboardingTaskDto>> Create(
        [FromBody] CreateOnboardingTaskDto dto,
        CancellationToken cancellationToken)
    {
        var createdBy = User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst("email")?.Value
            ?? "unknown";

        try
        {
            var task = await _onboardingService.CreateTaskAsync(dto, createdBy, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = task.Id }, task);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates an existing task.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = PolicyNames.RequireHrAdmin)]
    [ProducesResponseType(typeof(OnboardingTaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OnboardingTaskDto>> Update(
        Guid id,
        [FromBody] UpdateOnboardingTaskDto dto,
        CancellationToken cancellationToken)
    {
        var updatedBy = User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst("email")?.Value
            ?? "unknown";

        var task = await _onboardingService.UpdateTaskAsync(id, dto, updatedBy, cancellationToken);

        if (task == null)
        {
            return NotFound(new { message = $"Taak met ID {id} niet gevonden." });
        }

        return Ok(task);
    }

    /// <summary>
    /// Changes the status of a task.
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(OnboardingTaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OnboardingTaskDto>> ChangeStatus(
        Guid id,
        [FromBody] ChangeTaskStatusDto dto,
        CancellationToken cancellationToken)
    {
        var updatedBy = User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst("email")?.Value
            ?? "unknown";

        try
        {
            var task = await _onboardingService.ChangeTaskStatusAsync(
                id, dto.NieuweStatus, updatedBy, dto.VoltooiingNotities, cancellationToken);

            if (task == null)
            {
                return NotFound(new { message = $"Taak met ID {id} niet gevonden." });
            }

            return Ok(task);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Assigns a task to someone.
    /// </summary>
    [HttpPatch("{id:guid}/assign")]
    [Authorize(Policy = PolicyNames.RequireHrAdmin)]
    [ProducesResponseType(typeof(OnboardingTaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OnboardingTaskDto>> Assign(
        Guid id,
        [FromBody] AssignTaskDto dto,
        CancellationToken cancellationToken)
    {
        var assignedBy = User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst("email")?.Value
            ?? "unknown";

        var task = await _onboardingService.AssignTaskAsync(id, dto, assignedBy, cancellationToken);

        if (task == null)
        {
            return NotFound(new { message = $"Taak met ID {id} niet gevonden." });
        }

        return Ok(task);
    }

    /// <summary>
    /// Checks if a task can be started (dependencies completed).
    /// </summary>
    [HttpGet("{id:guid}/can-start")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> CanStart(Guid id, CancellationToken cancellationToken)
    {
        var canStart = await _onboardingService.CanStartTaskAsync(id, cancellationToken);
        return Ok(new { canStart });
    }

    /// <summary>
    /// Soft deletes a task.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = PolicyNames.RequireHrAdmin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _onboardingService.DeleteTaskAsync(id, cancellationToken);

        if (!deleted)
        {
            return NotFound(new { message = $"Taak met ID {id} niet gevonden." });
        }

        return NoContent();
    }
}
