using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Enums;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Controller for managing volunteers (vrijwilligers).
/// Volunteers are employees with EmployeeType = Vrijwilliger and have additional VrijwilligerDetails.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VrijwilligersController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly ILogger<VrijwilligersController> _logger;

    public VrijwilligersController(
        IEmployeeService employeeService,
        ILogger<VrijwilligersController> logger)
    {
        _employeeService = employeeService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all volunteers with their VrijwilligerDetails.
    /// </summary>
    [HttpGet]
    [AllowAnonymous] // Development: Remove in production
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetAll(CancellationToken cancellationToken)
    {
        var volunteers = await _employeeService.GetVolunteersAsync(cancellationToken);
        return Ok(volunteers);
    }

    /// <summary>
    /// Gets a specific volunteer by ID with their VrijwilligerDetails.
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous] // Development: Remove in production
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmployeeDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var employee = await _employeeService.GetByIdAsync(id, cancellationToken);

        if (employee == null)
        {
            return NotFound(new { message = $"Volunteer with ID {id} not found." });
        }

        if (employee.EmployeeType != EmployeeType.Vrijwilliger.ToString())
        {
            return BadRequest(new { message = $"Employee with ID {id} is not a volunteer." });
        }

        return Ok(employee);
    }

    /// <summary>
    /// Creates a new volunteer (creates Employee + VrijwilligerDetails).
    /// EmployeeType must be Vrijwilliger.
    /// </summary>
    [HttpPost]
    [AllowAnonymous] // Development: Remove in production
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmployeeDto>> Create(
        [FromBody] CreateEmployeeDto dto,
        CancellationToken cancellationToken)
    {
        // Validate that EmployeeType is Vrijwilliger
        if (dto.EmployeeType != EmployeeType.Vrijwilliger)
        {
            return BadRequest(new
            {
                message = "EmployeeType must be Vrijwilliger when creating a volunteer through this endpoint."
            });
        }

        // Validate that ArbeidsRegime is Vrijwilliger
        if (dto.ArbeidsRegime != ArbeidsRegime.Vrijwilliger)
        {
            _logger.LogWarning(
                "Creating volunteer with ArbeidsRegime {Regime}. Consider using ArbeidsRegime.Vrijwilliger.",
                dto.ArbeidsRegime);
        }

        try
        {
            var volunteer = await _employeeService.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = volunteer.Id }, volunteer);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while creating volunteer");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates a volunteer and their VrijwilligerDetails.
    /// Note: Azure-synced volunteers can only update specific fields.
    /// </summary>
    [HttpPut("{id:guid}")]
    [AllowAnonymous] // Development: Remove in production
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmployeeDto>> Update(
        Guid id,
        [FromBody] UpdateEmployeeDto dto,
        CancellationToken cancellationToken)
    {
        // Verify that the employee exists and is a volunteer
        var existing = await _employeeService.GetByIdAsync(id, cancellationToken);
        if (existing == null)
        {
            return NotFound(new { message = $"Volunteer with ID {id} not found." });
        }

        if (existing.EmployeeType != EmployeeType.Vrijwilliger.ToString())
        {
            return BadRequest(new { message = $"Employee with ID {id} is not a volunteer." });
        }

        // Prevent changing EmployeeType away from Vrijwilliger
        if (dto.EmployeeType.HasValue && dto.EmployeeType.Value != EmployeeType.Vrijwilliger)
        {
            return BadRequest(new
            {
                message = "Cannot change EmployeeType from Vrijwilliger to another type through this endpoint."
            });
        }

        try
        {
            var updated = await _employeeService.UpdateAsync(id, dto, cancellationToken);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while updating volunteer {VolunteerId}", id);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates only the VrijwilligerDetails for a volunteer.
    /// Employee data remains unchanged.
    /// </summary>
    [HttpPut("{id:guid}/details")]
    [AllowAnonymous] // Development: Remove in production
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmployeeDto>> UpdateDetails(
        Guid id,
        [FromBody] VrijwilligerDetailsUpsertDto detailsDto,
        CancellationToken cancellationToken)
    {
        // Verify that the employee exists and is a volunteer
        var existing = await _employeeService.GetByIdAsync(id, cancellationToken);
        if (existing == null)
        {
            return NotFound(new { message = $"Volunteer with ID {id} not found." });
        }

        if (existing.EmployeeType != EmployeeType.Vrijwilliger.ToString())
        {
            return BadRequest(new { message = $"Employee with ID {id} is not a volunteer." });
        }

        try
        {
            // Create UpdateEmployeeDto with only VrijwilligerDetails
            var updateDto = new UpdateEmployeeDto(
                VrijwilligerDetails: detailsDto
            );

            var updated = await _employeeService.UpdateAsync(id, updateDto, cancellationToken);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while updating volunteer details for {VolunteerId}", id);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Soft deletes a volunteer (sets IsActive = false).
    /// </summary>
    [HttpDelete("{id:guid}")]
    [AllowAnonymous] // Development: Remove in production
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        // Verify that the employee exists and is a volunteer
        var existing = await _employeeService.GetByIdAsync(id, cancellationToken);
        if (existing == null)
        {
            return NotFound(new { message = $"Volunteer with ID {id} not found." });
        }

        if (existing.EmployeeType != EmployeeType.Vrijwilliger.ToString())
        {
            return BadRequest(new { message = $"Employee with ID {id} is not a volunteer." });
        }

        var deleted = await _employeeService.DeleteAsync(id, cancellationToken);

        if (!deleted)
        {
            return NotFound(new { message = $"Volunteer with ID {id} not found." });
        }

        _logger.LogInformation("Soft-deleted volunteer {VolunteerId}", id);
        return NoContent();
    }

    /// <summary>
    /// Gets all volunteers for a specific dienst (DistributionGroup).
    /// </summary>
    [HttpGet("dienst/{dienstId:guid}")]
    [AllowAnonymous] // Development: Remove in production
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetByDienst(
        Guid dienstId,
        CancellationToken cancellationToken)
    {
        var filter = new EmployeeFilter(
            Type: EmployeeType.Vrijwilliger,
            DienstId: dienstId,
            IsActive: true
        );

        var volunteers = await _employeeService.GetAllAsync(filter, cancellationToken);
        return Ok(volunteers);
    }

    /// <summary>
    /// Searches volunteers by name or email.
    /// </summary>
    [HttpGet("search")]
    [AllowAnonymous] // Development: Remove in production
    [ProducesResponseType(typeof(IEnumerable<EmployeeSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeSummaryDto>>> Search(
        [FromQuery] string q,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
        {
            return Ok(Array.Empty<EmployeeSummaryDto>());
        }

        // Get all volunteers and filter by search term
        var filter = new EmployeeFilter(
            Type: EmployeeType.Vrijwilliger,
            SearchTerm: q,
            IsActive: true
        );

        var volunteers = await _employeeService.GetAllAsync(filter, cancellationToken);

        // Convert to summary DTOs
        var summaries = volunteers.Select(v => new EmployeeSummaryDto(
            v.Id,
            v.DisplayName,
            v.Email,
            v.JobTitle,
            v.EmployeeType,
            v.ArbeidsRegime,
            v.IsActive,
            v.DienstNaam
        ));

        return Ok(summaries);
    }
}
