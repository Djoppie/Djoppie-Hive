using DjoppieHive.API.Authorization;
using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Enums;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Beheer van medewerkers, vrijwilligers en interims.
/// Ondersteunt CRUD operaties, zoeken, filteren en GDPR data export.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Medewerkers")]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly IUserContextService _userContext;
    private readonly ILogger<EmployeesController> _logger;

    public EmployeesController(
        IEmployeeService employeeService,
        IUserContextService userContext,
        ILogger<EmployeesController> logger)
    {
        _employeeService = employeeService;
        _userContext = userContext;
        _logger = logger;
    }

    /// <summary>
    /// Gets all employees from the database with optional filtering.
    /// Results are automatically scoped based on user role:
    /// - ICT/HR Admin: All employees
    /// - Sector Manager: Only employees in their sector
    /// - Diensthoofd: Only employees in their dienst
    /// - Medewerker: Only themselves
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetAll(
        [FromQuery] EmployeeType? type = null,
        [FromQuery] ArbeidsRegime? regime = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] Guid? dienstId = null,
        [FromQuery] Guid? sectorId = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] GegevensBron? bron = null,
        CancellationToken cancellationToken = default)
    {
        // Apply scope-based filtering for non-admin users
        var effectiveSectorId = sectorId;
        var effectiveDienstId = dienstId;

        if (!_userContext.IsAdmin())
        {
            // Sector managers can only see their sector
            if (_userContext.HasRole(AppRoles.SectorManager))
            {
                effectiveSectorId = await _userContext.GetCurrentUserSectorIdAsync();
            }
            // Diensthoofden can only see their dienst
            else if (_userContext.HasRole(AppRoles.Diensthoofd))
            {
                effectiveDienstId = await _userContext.GetCurrentUserDienstIdAsync();
            }
            // Medewerkers can only see themselves - handled by filter below
            else if (_userContext.HasRole(AppRoles.Medewerker))
            {
                var employeeId = await _userContext.GetCurrentEmployeeIdAsync();
                if (employeeId.HasValue)
                {
                    var employee = await _employeeService.GetByIdAsync(employeeId.Value, cancellationToken);
                    return Ok(employee != null ? new[] { employee } : Array.Empty<EmployeeDto>());
                }
                return Ok(Array.Empty<EmployeeDto>());
            }
        }

        var filter = new EmployeeFilter(type, regime, isActive, effectiveDienstId, effectiveSectorId, searchTerm, bron);
        var employees = await _employeeService.GetAllAsync(filter, cancellationToken);
        return Ok(employees);
    }

    /// <summary>
    /// Gets an employee by their internal database ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmployeeDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var employee = await _employeeService.GetByIdAsync(id, cancellationToken);

        if (employee == null)
        {
            return NotFound(new { message = $"Employee with ID {id} not found." });
        }

        return Ok(employee);
    }

    /// <summary>
    /// Creates a new employee in the database.
    /// Requires: CanEditEmployees (HR Admin, ICT Admin, Sector Manager, Diensthoofd)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = PolicyNames.CanEditEmployees)]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<EmployeeDto>> Create(
        [FromBody] CreateEmployeeDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var employee = await _employeeService.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = employee.Id }, employee);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while creating employee");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates an existing employee in the database.
    /// Note: Azure-synced employees can only update specific fields (EmployeeType, ArbeidsRegime, DienstId, dates, phone).
    /// Requires: CanEditEmployees (HR Admin, ICT Admin, Sector Manager, Diensthoofd)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = PolicyNames.CanEditEmployees)]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<EmployeeDto>> Update(
        Guid id,
        [FromBody] UpdateEmployeeDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var employee = await _employeeService.UpdateAsync(id, dto, cancellationToken);

            if (employee == null)
            {
                return NotFound(new { message = $"Employee with ID {id} not found." });
            }

            return Ok(employee);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while updating employee {EmployeeId}", id);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Soft deletes an employee (sets IsActive = false).
    /// Requires: CanDeleteEmployees (HR Admin, ICT Admin only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = PolicyNames.CanDeleteEmployees)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _employeeService.DeleteAsync(id, cancellationToken);

        if (!deleted)
        {
            return NotFound(new { message = $"Employee with ID {id} not found." });
        }

        return NoContent();
    }

    /// <summary>
    /// Gets all employees belonging to a specific dienst (DistributionGroup).
    /// </summary>
    [HttpGet("dienst/{dienstId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetByDienst(
        Guid dienstId,
        CancellationToken cancellationToken)
    {
        var employees = await _employeeService.GetByDienstAsync(dienstId, cancellationToken);
        return Ok(employees);
    }

    /// <summary>
    /// Gets all volunteers (employees with EmployeeType = Vrijwilliger).
    /// </summary>
    [HttpGet("vrijwilligers")]
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetVolunteers(CancellationToken cancellationToken)
    {
        var volunteers = await _employeeService.GetVolunteersAsync(cancellationToken);
        return Ok(volunteers);
    }

    /// <summary>
    /// Searches employees by name or email.
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(IEnumerable<EmployeeSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeSummaryDto>>> Search(
        [FromQuery] string q,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
        {
            return Ok(Array.Empty<EmployeeSummaryDto>());
        }

        var employees = await _employeeService.SearchEmployeesAsync(q, cancellationToken);
        return Ok(employees);
    }

    /// <summary>
    /// Exports all personal data for a specific employee (GDPR Article 15 - Right of Access).
    /// Returns a complete JSON export of all data stored about the employee.
    /// Requires: CanViewAuditLogs (HR Admin, ICT Admin only)
    /// </summary>
    [HttpGet("{id:guid}/export")]
    [Authorize(Policy = PolicyNames.CanViewAuditLogs)]
    [ProducesResponseType(typeof(GdprExportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<GdprExportDto>> ExportPersonalData(
        Guid id,
        CancellationToken cancellationToken)
    {
        var exportedBy = _userContext.GetCurrentUserName() ?? "Unknown";
        var export = await _employeeService.ExportPersonalDataAsync(id, exportedBy, cancellationToken);

        if (export == null)
        {
            return NotFound(new { message = $"Employee with ID {id} not found." });
        }

        // Set filename for download
        var employeeName = export.PersonalData.DisplayName.Replace(" ", "_");
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        Response.Headers.ContentDisposition = $"attachment; filename=\"GDPR_Export_{employeeName}_{timestamp}.json\"";

        _logger.LogInformation(
            "GDPR data export completed for employee {EmployeeId} by {ExportedBy}",
            id, exportedBy);

        return Ok(export);
    }

    /// <summary>
    /// Updates the validation status of an employee.
    /// Used by HR/managers to approve or reject employee data.
    /// Requires: CanEditEmployees (HR Admin, ICT Admin, Sector Manager, Diensthoofd)
    /// </summary>
    [HttpPut("{id:guid}/validatie")]
    [Authorize(Policy = PolicyNames.CanEditEmployees)]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<EmployeeDto>> UpdateValidatieStatus(
        Guid id,
        [FromBody] UpdateValidatieStatusDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var gevalideerdDoor = _userContext.GetCurrentUserName() ?? _userContext.GetCurrentUserEmail() ?? "Unknown";
            var employee = await _employeeService.UpdateValidatieStatusAsync(id, dto.Status, gevalideerdDoor, dto.Opmerkingen, cancellationToken);

            if (employee == null)
            {
                return NotFound(new { message = $"Employee with ID {id} not found." });
            }

            _logger.LogInformation(
                "Validation status updated for employee {EmployeeId} to {Status} by {ValidatedBy}",
                id, dto.Status, gevalideerdDoor);

            return Ok(employee);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while updating validation status for employee {EmployeeId}", id);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Gets the count of employees that need validation (status Nieuw or InReview).
    /// Filtered by user's sector for non-admin users.
    /// Used for badge display in navigation.
    /// </summary>
    [HttpGet("validatie/aantal")]
    [Authorize]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<ActionResult<int>> GetValidatieAantal(CancellationToken cancellationToken)
    {
        var sectorId = await _userContext.GetCurrentUserSectorIdAsync();
        var count = await _employeeService.GetValidatieAantalAsync(sectorId, cancellationToken);
        return Ok(count);
    }
}

/// <summary>
/// DTO for updating employee validation status
/// </summary>
public record UpdateValidatieStatusDto(
    ValidatieStatus Status,
    string? Opmerkingen = null
);
