using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Controller voor synchronisatie van Microsoft Graph gegevens.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
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
    /// </summary>
    /// <returns>Resultaat van de synchronisatie</returns>
    [HttpPost("uitvoeren")]
    [ProducesResponseType(typeof(SyncResultaatDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
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
}
