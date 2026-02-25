using DjoppieHive.API.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Endpoint voor het ophalen van de huidige ingelogde gebruiker.
/// Toont gebruikersinfo, rollen en rechten.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Gebruiker")]
public class MeController : ControllerBase
{
    private readonly IUserContextService _userContext;
    private readonly ILogger<MeController> _logger;

    public MeController(
        IUserContextService userContext,
        ILogger<MeController> logger)
    {
        _userContext = userContext;
        _logger = logger;
    }

    /// <summary>
    /// Haalt informatie op over de huidige ingelogde gebruiker.
    /// </summary>
    /// <returns>Gebruikersinformatie inclusief rollen en rechten</returns>
    [HttpGet]
    [ProducesResponseType(typeof(CurrentUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CurrentUserDto>> GetCurrentUser()
    {
        var userId = _userContext.GetCurrentUserId();
        var email = _userContext.GetCurrentUserEmail();
        var name = _userContext.GetCurrentUserName();
        var roles = _userContext.GetCurrentUserRoles().ToList();

        var sectorId = await _userContext.GetCurrentUserSectorIdAsync();
        var dienstId = await _userContext.GetCurrentUserDienstIdAsync();
        var employeeId = await _userContext.GetCurrentEmployeeIdAsync();

        _logger.LogInformation(
            "Gebruiker {Email} heeft rollen opgehaald: {Roles}",
            email, string.Join(", ", roles));

        var currentUser = new CurrentUserDto(
            Id: userId ?? "unknown",
            Email: email ?? "unknown",
            DisplayName: name ?? email ?? "unknown",
            Roles: roles,
            Permissions: GetPermissionsForRoles(roles),
            IsAdmin: _userContext.IsAdmin(),
            SectorId: sectorId?.ToString(),
            DienstId: dienstId?.ToString(),
            EmployeeId: employeeId?.ToString()
        );

        return Ok(currentUser);
    }

    private static List<string> GetPermissionsForRoles(List<string> roles)
    {
        var permissions = new HashSet<string>();

        foreach (var role in roles)
        {
            switch (role.ToLowerInvariant())
            {
                case AppRoles.IctSuperAdmin:
                    permissions.Add("view_all_employees");
                    permissions.Add("edit_employees");
                    permissions.Add("delete_employees");
                    permissions.Add("validate_changes");
                    permissions.Add("manage_groups");
                    permissions.Add("manage_settings");
                    permissions.Add("export_data");
                    permissions.Add("view_audit_logs");
                    permissions.Add("sync_data");
                    permissions.Add("manage_roles");
                    break;

                case AppRoles.HrAdmin:
                    permissions.Add("view_all_employees");
                    permissions.Add("edit_employees");
                    permissions.Add("delete_employees");
                    permissions.Add("validate_changes");
                    permissions.Add("manage_groups");
                    permissions.Add("export_data");
                    permissions.Add("view_audit_logs");
                    permissions.Add("sync_data");
                    break;

                case AppRoles.SectorManager:
                    permissions.Add("view_sector_employees");
                    permissions.Add("edit_employees");
                    permissions.Add("validate_changes");
                    permissions.Add("export_data");
                    break;

                case AppRoles.Diensthoofd:
                    permissions.Add("view_dienst_employees");
                    permissions.Add("edit_employees");
                    permissions.Add("validate_changes");
                    break;

                case AppRoles.Medewerker:
                    permissions.Add("view_own_profile");
                    break;
            }
        }

        return permissions.ToList();
    }
}

/// <summary>
/// DTO voor de huidige ingelogde gebruiker.
/// </summary>
public record CurrentUserDto(
    string Id,
    string Email,
    string DisplayName,
    List<string> Roles,
    List<string> Permissions,
    bool IsAdmin,
    string? SectorId,
    string? DienstId,
    string? EmployeeId
);
