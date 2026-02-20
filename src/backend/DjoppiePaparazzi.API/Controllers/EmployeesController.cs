using DjoppiePaparazzi.Core.DTOs;
using DjoppiePaparazzi.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppiePaparazzi.API.Controllers;

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
    /// Gets all employees from MG- distribution groups.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetAll(CancellationToken cancellationToken)
    {
        var employees = await _employeeService.GetAllEmployeesAsync(cancellationToken);
        return Ok(employees);
    }

    /// <summary>
    /// Gets an employee by their Entra Object ID.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmployeeDto>> GetById(string id, CancellationToken cancellationToken)
    {
        var employee = await _employeeService.GetEmployeeByIdAsync(id, cancellationToken);

        if (employee == null)
        {
            return NotFound();
        }

        return Ok(employee);
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
}
