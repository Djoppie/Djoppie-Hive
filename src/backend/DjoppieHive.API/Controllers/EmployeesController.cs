using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Enums;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly ILogger<EmployeesController> _logger;

    public EmployeesController(
        IEmployeeService employeeService,
        ILogger<EmployeesController> logger)
    {
        _employeeService = employeeService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all employees from the database with optional filtering.
    /// </summary>
    /// <param name="type">Filter by employee type (Personeel, Vrijwilliger, Interim, Extern, Stagiair)</param>
    /// <param name="regime">Filter by arbeidsregime (Voltijds, Deeltijds, Vrijwilliger)</param>
    /// <param name="isActive">Filter by active status (true/false)</param>
    /// <param name="dienstId">Filter by dienst (DistributionGroup) ID</param>
    /// <param name="searchTerm">Search term for name or email</param>
    /// <param name="bron">Filter by data source (AzureAD, Handmatig)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet]
    [AllowAnonymous] // Development: Remove in production
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetAll(
        [FromQuery] EmployeeType? type = null,
        [FromQuery] ArbeidsRegime? regime = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] Guid? dienstId = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] GegevensBron? bron = null,
        CancellationToken cancellationToken = default)
    {
        var filter = new EmployeeFilter(type, regime, isActive, dienstId, searchTerm, bron);
        var employees = await _employeeService.GetAllAsync(filter, cancellationToken);
        return Ok(employees);
    }

    /// <summary>
    /// Gets an employee by their internal database ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous] // Development: Remove in production
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
    /// </summary>
    [HttpPost]
    [AllowAnonymous] // Development: Remove in production
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
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
    /// </summary>
    [HttpDelete("{id:guid}")]
    [AllowAnonymous] // Development: Remove in production
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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
    [AllowAnonymous] // Development: Remove in production
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
    [AllowAnonymous] // Development: Remove in production
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

        var employees = await _employeeService.SearchEmployeesAsync(q, cancellationToken);
        return Ok(employees);
    }
}
