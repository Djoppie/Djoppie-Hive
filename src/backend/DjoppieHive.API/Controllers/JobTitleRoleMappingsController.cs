using DjoppieHive.API.Authorization;
using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Entities;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Beheer van JobTitle-naar-rol mappings voor automatische roltoewijzing.
/// Alleen toegankelijk voor ICT Super Admin.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyNames.CanManageRoles)]
[Tags("Automatische Roltoewijzing")]
public class JobTitleRoleMappingsController : ControllerBase
{
    private readonly IJobTitleRoleMappingService _mappingService;
    private readonly ILogger<JobTitleRoleMappingsController> _logger;

    public JobTitleRoleMappingsController(
        IJobTitleRoleMappingService mappingService,
        ILogger<JobTitleRoleMappingsController> logger)
    {
        _mappingService = mappingService;
        _logger = logger;
    }

    #region CRUD Endpoints

    /// <summary>
    /// Gets all JobTitle-to-role mappings.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<JobTitleRoleMappingDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<JobTitleRoleMappingDto>>> GetAll(CancellationToken cancellationToken)
    {
        var mappings = await _mappingService.GetAllMappingsAsync(cancellationToken);
        return Ok(mappings);
    }

    /// <summary>
    /// Gets a specific mapping by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(JobTitleRoleMappingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<JobTitleRoleMappingDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var mapping = await _mappingService.GetMappingByIdAsync(id, cancellationToken);

        if (mapping == null)
        {
            return NotFound(new { message = $"Mapping met ID {id} niet gevonden." });
        }

        return Ok(mapping);
    }

    /// <summary>
    /// Creates a new JobTitle-to-role mapping.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(JobTitleRoleMappingDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<JobTitleRoleMappingDto>> Create(
        [FromBody] CreateJobTitleRoleMappingDto dto,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();

        try
        {
            var mapping = await _mappingService.CreateMappingAsync(dto, currentUser, cancellationToken);

            _logger.LogInformation(
                "JobTitle mapping aangemaakt: '{Pattern}' -> {Role} door {User}",
                dto.JobTitlePattern, dto.Role, currentUser);

            return CreatedAtAction(nameof(GetById), new { id = mapping.Id }, mapping);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Ongeldige mapping aanmaak poging");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates an existing mapping.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(JobTitleRoleMappingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<JobTitleRoleMappingDto>> Update(
        Guid id,
        [FromBody] UpdateJobTitleRoleMappingDto dto,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();

        try
        {
            var mapping = await _mappingService.UpdateMappingAsync(id, dto, currentUser, cancellationToken);

            if (mapping == null)
            {
                return NotFound(new { message = $"Mapping met ID {id} niet gevonden." });
            }

            _logger.LogInformation("Mapping {MappingId} bijgewerkt door {User}", id, currentUser);

            return Ok(mapping);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Ongeldige mapping update poging");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Deletes a mapping.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();

        var deleted = await _mappingService.DeleteMappingAsync(id, cancellationToken);

        if (!deleted)
        {
            return NotFound(new { message = $"Mapping met ID {id} niet gevonden." });
        }

        _logger.LogInformation("Mapping {MappingId} verwijderd door {User}", id, currentUser);

        return NoContent();
    }

    #endregion

    #region Auto-Assignment Endpoints

    /// <summary>
    /// Finds the matching mapping for a given job title (for testing/preview).
    /// </summary>
    [HttpGet("match")]
    [ProducesResponseType(typeof(JobTitleRoleMappingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<JobTitleRoleMappingDto>> FindMatch(
        [FromQuery] string jobTitle,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(jobTitle))
        {
            return BadRequest(new { message = "JobTitle parameter is verplicht." });
        }

        var mapping = await _mappingService.FindMatchingMappingAsync(jobTitle, cancellationToken);

        if (mapping == null)
        {
            return NotFound(new { message = $"Geen matching mapping gevonden voor '{jobTitle}'." });
        }

        return Ok(mapping);
    }

    /// <summary>
    /// Previews which roles would be assigned to all employees without actually assigning.
    /// </summary>
    [HttpGet("auto-assign/preview")]
    [ProducesResponseType(typeof(AutoRoleAssignmentSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AutoRoleAssignmentSummaryDto>> PreviewAutoAssignment(
        [FromQuery] bool onlyNew = false,
        CancellationToken cancellationToken = default)
    {
        var summary = await _mappingService.PreviewAutoAssignmentAsync(onlyNew, cancellationToken);
        return Ok(summary);
    }

    /// <summary>
    /// Automatically assigns roles to a single employee based on their job title.
    /// </summary>
    [HttpPost("auto-assign/employee/{employeeId:guid}")]
    [ProducesResponseType(typeof(AutoRoleAssignmentResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AutoRoleAssignmentResultDto>> AssignRoleForEmployee(
        Guid employeeId,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();

        var result = await _mappingService.AssignRoleForEmployeeAsync(employeeId, currentUser, cancellationToken);

        _logger.LogInformation(
            "Automatische roltoewijzing voor {EmployeeId}: {RoleAssigned} door {User}",
            employeeId, result.RoleAssigned, currentUser);

        return Ok(result);
    }

    /// <summary>
    /// Automatically assigns roles to all employees based on their job titles.
    /// </summary>
    [HttpPost("auto-assign")]
    [ProducesResponseType(typeof(AutoRoleAssignmentSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AutoRoleAssignmentSummaryDto>> AssignRolesForAllEmployees(
        [FromQuery] bool onlyNew = false,
        CancellationToken cancellationToken = default)
    {
        var currentUser = GetCurrentUser();

        var summary = await _mappingService.AssignRolesForAllEmployeesAsync(
            currentUser, onlyNew, cancellationToken);

        _logger.LogInformation(
            "Bulk automatische roltoewijzing: {Assigned} toegekend, {Skipped} overgeslagen door {User}",
            summary.RolesAssigned, summary.RolesSkipped, currentUser);

        return Ok(summary);
    }

    #endregion

    #region Helper Endpoints

    /// <summary>
    /// Gets all available scope determination types.
    /// </summary>
    [HttpGet("scope-types")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<ScopeDeterminationTypeDto>), StatusCodes.Status200OK)]
    public ActionResult<IEnumerable<ScopeDeterminationTypeDto>> GetScopeTypes()
    {
        var types = Enum.GetValues<ScopeDeterminationType>()
            .Select(t => new ScopeDeterminationTypeDto(
                (int)t,
                t.ToString(),
                GetScopeTypeDisplayName(t)));

        return Ok(types);
    }

    #endregion

    #region Private Methods

    private string GetCurrentUser()
    {
        return User.Identity?.Name ?? User.Claims
            .FirstOrDefault(c => c.Type == "preferred_username")?.Value ?? "Onbekend";
    }

    private static string GetScopeTypeDisplayName(ScopeDeterminationType type) => type switch
    {
        ScopeDeterminationType.None => "Geen scope (globaal)",
        ScopeDeterminationType.FromSectorMembership => "Automatisch vanuit sector-lidmaatschap",
        ScopeDeterminationType.FromDienstMembership => "Automatisch vanuit dienst-lidmaatschap",
        ScopeDeterminationType.FromPrimaryDienst => "Automatisch vanuit primaire dienst",
        _ => type.ToString()
    };

    #endregion
}

/// <summary>
/// DTO for scope determination type enum values.
/// </summary>
public record ScopeDeterminationTypeDto(int Value, string Name, string DisplayName);
