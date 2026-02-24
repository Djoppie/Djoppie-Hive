using DjoppieHive.API.Authorization;
using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Synchronisatie van medewerkers en groepen vanuit Microsoft Graph API.
/// Ondersteunt handmatige sync, status opvragen en sync geschiedenis.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Synchronisatie")]
public class SyncController : ControllerBase
{
    private readonly ISyncService _syncService;
    private readonly ILogger<SyncController> _logger;
    private readonly IWebHostEnvironment _environment;

    public SyncController(
        ISyncService syncService,
        ILogger<SyncController> logger,
        IWebHostEnvironment environment)
    {
        _syncService = syncService;
        _logger = logger;
        _environment = environment;
    }

    /// <summary>
    /// DEV ONLY: Start een synchronisatie zonder authenticatie.
    /// </summary>
    [HttpPost("dev/uitvoeren")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SyncResultaatDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<ActionResult<SyncResultaatDto>> VoerDevSyncUit(CancellationToken cancellationToken)
    {
        if (!_environment.IsDevelopment())
        {
            return Forbid();
        }

        _logger.LogWarning("DEV sync gestart (geen authenticatie)");

        try
        {
            var resultaat = await _syncService.VoerSyncUitAsync("DEV-SYNC", cancellationToken);
            return Ok(resultaat);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Synchronisatie al bezig",
                Detail = ex.Message,
                Status = StatusCodes.Status409Conflict
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DEV sync mislukt");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Synchronisatie mislukt",
                Detail = ex.Message,
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Start een handmatige synchronisatie vanuit Microsoft Graph.
    /// Requires: CanSync (HR Admin, ICT Admin only)
    /// </summary>
    /// <returns>Resultaat van de synchronisatie</returns>
    [HttpPost("uitvoeren")]
    [Authorize(Policy = PolicyNames.CanSync)]
    [ProducesResponseType(typeof(SyncResultaatDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<SyncResultaatDto>> VoerSyncUit(CancellationToken cancellationToken)
    {
        var gebruiker = User.Identity?.Name ?? User.Claims
            .FirstOrDefault(c => c.Type == "preferred_username")?.Value ?? "Onbekend";

        _logger.LogInformation("Synchronisatie aangevraagd door {Gebruiker}", gebruiker);

        try
        {
            var resultaat = await _syncService.VoerSyncUitAsync(gebruiker, cancellationToken);
            return Ok(resultaat);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Synchronisatie kon niet worden gestart");
            return Conflict(new ProblemDetails
            {
                Title = "Synchronisatie al bezig",
                Detail = ex.Message,
                Status = StatusCodes.Status409Conflict
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Synchronisatie mislukt");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Synchronisatie mislukt",
                Detail = ex.Message,
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Haalt de status op van de huidige of laatste synchronisatie.
    /// </summary>
    [HttpGet("status")]
    [ProducesResponseType(typeof(SyncStatusDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SyncStatusDto>> GetStatus(CancellationToken cancellationToken)
    {
        var status = await _syncService.GetSyncStatusAsync(cancellationToken);
        return Ok(status);
    }

    /// <summary>
    /// Haalt de synchronisatiegeschiedenis op.
    /// </summary>
    /// <param name="aantal">Aantal logboekitems om op te halen (standaard 10)</param>
    [HttpGet("geschiedenis")]
    [ProducesResponseType(typeof(IEnumerable<SyncLogboekDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<SyncLogboekDto>>> GetGeschiedenis(
        [FromQuery] int aantal = 10,
        CancellationToken cancellationToken = default)
    {
        var geschiedenis = await _syncService.GetSyncGeschiedenisAsync(aantal, cancellationToken);
        return Ok(geschiedenis);
    }

    /// <summary>
    /// Haalt een preview op van wat er gesynchroniseerd zou worden uit Azure AD/Entra ID.
    /// Voert geen wijzigingen uit - alleen lezen.
    /// Requires: CanSync (HR Admin, ICT Admin only)
    /// </summary>
    /// <returns>Preview van gebruikers en groepen die gesynchroniseerd zouden worden</returns>
    [HttpGet("preview")]
    [Authorize(Policy = PolicyNames.CanSync)]
    [ProducesResponseType(typeof(SyncPreviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SyncPreviewDto>> GetPreview(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Sync preview aangevraagd");

        try
        {
            var preview = await _syncService.GetSyncPreviewAsync(cancellationToken);
            return Ok(preview);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sync preview mislukt");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Preview ophalen mislukt",
                Detail = ex.Message,
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// DEV ONLY: Haalt een preview op zonder authenticatie.
    /// </summary>
    [HttpGet("dev/preview")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SyncPreviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<ActionResult<SyncPreviewDto>> GetDevPreview(CancellationToken cancellationToken)
    {
        if (!_environment.IsDevelopment())
        {
            return Forbid();
        }

        _logger.LogWarning("DEV sync preview (geen authenticatie)");

        try
        {
            var preview = await _syncService.GetSyncPreviewAsync(cancellationToken);
            return Ok(preview);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DEV sync preview mislukt");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Preview ophalen mislukt",
                Detail = ex.Message,
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }
}
