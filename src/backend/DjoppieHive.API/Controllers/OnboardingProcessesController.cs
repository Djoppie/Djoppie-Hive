using DjoppieHive.API.Authorization;
using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Enums;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Beheer van onboarding en offboarding processen.
/// </summary>
[ApiController]
[Route("api/onboarding-processes")]
[Authorize]
[Tags("Onboarding")]
public class OnboardingProcessesController : ControllerBase
{
    private readonly IOnboardingService _onboardingService;
    private readonly ILogger<OnboardingProcessesController> _logger;

    public OnboardingProcessesController(
        IOnboardingService onboardingService,
        ILogger<OnboardingProcessesController> logger)
    {
        _onboardingService = onboardingService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all onboarding/offboarding processes with optional filtering.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<OnboardingProcessSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<OnboardingProcessSummaryDto>>> GetAll(
        [FromQuery] OnboardingProcessType? type,
        [FromQuery] OnboardingProcessStatus? status,
        [FromQuery] Guid? employeeId,
        [FromQuery] Guid? verantwoordelijkeId,
        [FromQuery] DateTime? startDatumVan,
        [FromQuery] DateTime? startDatumTot,
        [FromQuery] bool? isActive,
        [FromQuery] string? searchQuery,
        CancellationToken cancellationToken)
    {
        var filter = new OnboardingProcessFilter(
            Type: type,
            Status: status,
            EmployeeId: employeeId,
            VerantwoordelijkeId: verantwoordelijkeId,
            StartDatumVan: startDatumVan,
            StartDatumTot: startDatumTot,
            IsActive: isActive ?? true,
            SearchQuery: searchQuery
        );

        var processes = await _onboardingService.GetAllProcessesAsync(filter, cancellationToken);
        return Ok(processes);
    }

    /// <summary>
    /// Gets a specific process by ID with all tasks.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OnboardingProcessDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OnboardingProcessDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var process = await _onboardingService.GetProcessByIdAsync(id, cancellationToken);

        if (process == null)
        {
            return NotFound(new { message = $"Onboarding proces met ID {id} niet gevonden." });
        }

        return Ok(process);
    }

    /// <summary>
    /// Gets all processes for a specific employee.
    /// </summary>
    [HttpGet("employee/{employeeId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<OnboardingProcessSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<OnboardingProcessSummaryDto>>> GetByEmployee(
        Guid employeeId,
        CancellationToken cancellationToken)
    {
        var processes = await _onboardingService.GetProcessesByEmployeeAsync(employeeId, cancellationToken);
        return Ok(processes);
    }

    /// <summary>
    /// Gets processes assigned to the current user.
    /// </summary>
    [HttpGet("my-processes")]
    [ProducesResponseType(typeof(IEnumerable<OnboardingProcessSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<OnboardingProcessSummaryDto>>> GetMyProcesses(
        CancellationToken cancellationToken)
    {
        var userEmail = User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst("email")?.Value
            ?? "unknown";

        var processes = await _onboardingService.GetMyProcessesAsync(userEmail, cancellationToken);
        return Ok(processes);
    }

    /// <summary>
    /// Gets onboarding statistics for dashboard.
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(OnboardingStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<OnboardingStatisticsDto>> GetStatistics(CancellationToken cancellationToken)
    {
        var statistics = await _onboardingService.GetStatisticsAsync(cancellationToken);
        return Ok(statistics);
    }

    /// <summary>
    /// Creates a new onboarding/offboarding process.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = PolicyNames.RequireHrAdmin)]
    [ProducesResponseType(typeof(OnboardingProcessDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<OnboardingProcessDto>> Create(
        [FromBody] CreateOnboardingProcessDto dto,
        CancellationToken cancellationToken)
    {
        var createdBy = User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst("email")?.Value
            ?? "unknown";

        try
        {
            var process = await _onboardingService.CreateProcessAsync(dto, createdBy, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = process.Id }, process);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Creates a new process from a template.
    /// </summary>
    [HttpPost("from-template")]
    [Authorize(Policy = PolicyNames.RequireHrAdmin)]
    [ProducesResponseType(typeof(OnboardingProcessDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<OnboardingProcessDto>> CreateFromTemplate(
        [FromBody] CreateProcessFromTemplateDto dto,
        CancellationToken cancellationToken)
    {
        var createdBy = User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst("email")?.Value
            ?? "unknown";

        try
        {
            var process = await _onboardingService.CreateProcessFromTemplateAsync(dto, createdBy, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = process.Id }, process);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates an existing process.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = PolicyNames.RequireHrAdmin)]
    [ProducesResponseType(typeof(OnboardingProcessDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OnboardingProcessDto>> Update(
        Guid id,
        [FromBody] UpdateOnboardingProcessDto dto,
        CancellationToken cancellationToken)
    {
        var updatedBy = User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst("email")?.Value
            ?? "unknown";

        var process = await _onboardingService.UpdateProcessAsync(id, dto, updatedBy, cancellationToken);

        if (process == null)
        {
            return NotFound(new { message = $"Onboarding proces met ID {id} niet gevonden." });
        }

        return Ok(process);
    }

    /// <summary>
    /// Changes the status of a process.
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = PolicyNames.RequireHrAdmin)]
    [ProducesResponseType(typeof(OnboardingProcessDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OnboardingProcessDto>> ChangeStatus(
        Guid id,
        [FromBody] ChangeProcessStatusDto dto,
        CancellationToken cancellationToken)
    {
        var updatedBy = User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst("email")?.Value
            ?? "unknown";

        try
        {
            var process = await _onboardingService.ChangeProcessStatusAsync(
                id, dto.NieuweStatus, updatedBy, dto.Opmerking, cancellationToken);

            if (process == null)
            {
                return NotFound(new { message = $"Onboarding proces met ID {id} niet gevonden." });
            }

            return Ok(process);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Soft deletes a process.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = PolicyNames.RequireHrAdmin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _onboardingService.DeleteProcessAsync(id, cancellationToken);

        if (!deleted)
        {
            return NotFound(new { message = $"Onboarding proces met ID {id} niet gevonden." });
        }

        return NoContent();
    }
}
