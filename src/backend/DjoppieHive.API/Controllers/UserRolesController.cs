using DjoppieHive.API.Authorization;
using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Beheer van gebruikersrollen en autorisaties.
/// Alleen toegankelijk voor ICT Super Admin.
/// Ondersteunt toewijzen van rollen aan gebruikers met optionele sector/dienst scope.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyNames.CanManageRoles)]
[Tags("Rollenbeheer")]
public class UserRolesController : ControllerBase
{
    private readonly IUserRoleService _userRoleService;
    private readonly ILogger<UserRolesController> _logger;

    public UserRolesController(
        IUserRoleService userRoleService,
        ILogger<UserRolesController> logger)
    {
        _userRoleService = userRoleService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all user role assignments.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserRoleDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UserRoleDto>>> GetAll(CancellationToken cancellationToken)
    {
        var roles = await _userRoleService.GetAllAsync(cancellationToken);
        return Ok(roles);
    }

    /// <summary>
    /// Gets a specific user role assignment by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(UserRoleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserRoleDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var role = await _userRoleService.GetByIdAsync(id, cancellationToken);

        if (role == null)
        {
            return NotFound(new { message = $"Gebruikersrol met ID {id} niet gevonden." });
        }

        return Ok(role);
    }

    /// <summary>
    /// Gets all role assignments for a specific user.
    /// </summary>
    [HttpGet("user/{entraObjectId}")]
    [ProducesResponseType(typeof(IEnumerable<UserRoleDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UserRoleDto>>> GetByUserId(
        string entraObjectId,
        CancellationToken cancellationToken)
    {
        var roles = await _userRoleService.GetByUserIdAsync(entraObjectId, cancellationToken);
        return Ok(roles);
    }

    /// <summary>
    /// Creates a new user role assignment.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(UserRoleDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserRoleDto>> Create(
        [FromBody] CreateUserRoleDto dto,
        CancellationToken cancellationToken)
    {
        var currentUser = User.Identity?.Name ?? User.Claims
            .FirstOrDefault(c => c.Type == "preferred_username")?.Value ?? "Onbekend";

        try
        {
            var role = await _userRoleService.CreateAsync(dto, currentUser, cancellationToken);

            _logger.LogInformation(
                "Rol {Role} toegekend aan {Email} door {User}",
                dto.Role, dto.Email, currentUser);

            return CreatedAtAction(nameof(GetById), new { id = role.Id }, role);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Ongeldige roltoekennning poging");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates an existing user role assignment.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(UserRoleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserRoleDto>> Update(
        Guid id,
        [FromBody] UpdateUserRoleDto dto,
        CancellationToken cancellationToken)
    {
        var currentUser = User.Identity?.Name ?? User.Claims
            .FirstOrDefault(c => c.Type == "preferred_username")?.Value ?? "Onbekend";

        try
        {
            var role = await _userRoleService.UpdateAsync(id, dto, currentUser, cancellationToken);

            if (role == null)
            {
                return NotFound(new { message = $"Gebruikersrol met ID {id} niet gevonden." });
            }

            _logger.LogInformation(
                "Rol {RoleId} bijgewerkt door {User}",
                id, currentUser);

            return Ok(role);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Ongeldige rolupdate poging");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Deletes a user role assignment.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var currentUser = User.Identity?.Name ?? User.Claims
            .FirstOrDefault(c => c.Type == "preferred_username")?.Value ?? "Onbekend";

        var deleted = await _userRoleService.DeleteAsync(id, cancellationToken);

        if (!deleted)
        {
            return NotFound(new { message = $"Gebruikersrol met ID {id} niet gevonden." });
        }

        _logger.LogInformation("Rol {RoleId} verwijderd door {User}", id, currentUser);

        return NoContent();
    }

    /// <summary>
    /// Searches users who can be assigned roles.
    /// </summary>
    [HttpGet("search/users")]
    [ProducesResponseType(typeof(IEnumerable<UserSearchResultDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UserSearchResultDto>>> SearchUsers(
        [FromQuery] string q,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
        {
            return Ok(Array.Empty<UserSearchResultDto>());
        }

        var users = await _userRoleService.SearchUsersAsync(q, cancellationToken);
        return Ok(users);
    }

    /// <summary>
    /// Gets all available role definitions.
    /// </summary>
    [HttpGet("definitions")]
    [AllowAnonymous] // Role definitions are public info
    [ProducesResponseType(typeof(IEnumerable<RoleDefinitionDto>), StatusCodes.Status200OK)]
    public ActionResult<IEnumerable<RoleDefinitionDto>> GetRoleDefinitions()
    {
        var definitions = _userRoleService.GetRoleDefinitions();
        return Ok(definitions);
    }
}
