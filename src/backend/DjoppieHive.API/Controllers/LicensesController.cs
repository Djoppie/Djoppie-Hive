using DjoppieHive.API.Authorization;
using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// API voor Microsoft 365 licentie-analyse en optimalisatie.
/// Geeft inzicht in licentiegebruik en aanbevelingen voor kostenoptimalisatie.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Licenties")]
public class LicensesController : ControllerBase
{
    private readonly ILicenseService _licenseService;
    private readonly ILogger<LicensesController> _logger;

    public LicensesController(
        ILicenseService licenseService,
        ILogger<LicensesController> logger)
    {
        _licenseService = licenseService;
        _logger = logger;
    }

    /// <summary>
    /// Haalt een volledig overzicht op van alle licenties, gebruikers en aanbevelingen.
    /// Requires: HR Admin of ICT Admin
    /// </summary>
    /// <param name="licenseType">Filter op licentietype: "e3" of "f3"</param>
    /// <param name="activityStatus">Filter op activiteitsstatus</param>
    /// <param name="onlyWithRecommendations">Toon alleen gebruikers met aanbevelingen</param>
    /// <param name="department">Filter op afdeling</param>
    /// <param name="inactiveDaysThreshold">Minimaal aantal dagen inactief</param>
    /// <param name="cancellationToken">Annuleringstoken</param>
    /// <returns>Volledig licentie-overzicht</returns>
    [HttpGet("overview")]
    [Authorize(Policy = PolicyNames.RequireIctAdmin)]
    [ProducesResponseType(typeof(LicenseOverviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<LicenseOverviewDto>> GetOverview(
        [FromQuery] string? licenseType = null,
        [FromQuery] string? activityStatus = null,
        [FromQuery] bool? onlyWithRecommendations = null,
        [FromQuery] string? department = null,
        [FromQuery] int? inactiveDaysThreshold = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Licentie-overzicht opgevraagd");

        try
        {
            var filter = new LicenseFilterDto(
                LicenseType: licenseType,
                ActivityStatus: activityStatus,
                OnlyWithRecommendations: onlyWithRecommendations,
                Department: department,
                InactiveDaysThreshold: inactiveDaysThreshold
            );

            var overview = await _licenseService.GetLicenseOverviewAsync(filter, cancellationToken);
            return Ok(overview);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fout bij ophalen licentie-overzicht");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Licentie-overzicht ophalen mislukt",
                Detail = ex.Message,
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Haalt een samenvatting op van licentiegebruik.
    /// Requires: HR Admin of ICT Admin
    /// </summary>
    [HttpGet("summary")]
    [Authorize(Policy = PolicyNames.RequireIctAdmin)]
    [ProducesResponseType(typeof(LicenseSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<LicenseSummaryDto>> GetSummary(
        CancellationToken cancellationToken = default)
    {
        try
        {
            var summary = await _licenseService.GetSummaryAsync(cancellationToken);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fout bij ophalen licentie-samenvatting");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Samenvatting ophalen mislukt",
                Detail = ex.Message,
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Haalt alle beschikbare licentie-abonnementen op.
    /// Requires: HR Admin of ICT Admin
    /// </summary>
    [HttpGet("subscriptions")]
    [Authorize(Policy = PolicyNames.RequireIctAdmin)]
    [ProducesResponseType(typeof(IEnumerable<LicenseSubscriptionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<LicenseSubscriptionDto>>> GetSubscriptions(
        CancellationToken cancellationToken = default)
    {
        try
        {
            var subscriptions = await _licenseService.GetSubscriptionsAsync(cancellationToken);
            return Ok(subscriptions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fout bij ophalen licentie-abonnementen");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Abonnementen ophalen mislukt",
                Detail = ex.Message,
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Haalt alle gebruikers met hun licenties en activiteitsdata op.
    /// Requires: HR Admin of ICT Admin
    /// </summary>
    [HttpGet("users")]
    [Authorize(Policy = PolicyNames.RequireIctAdmin)]
    [ProducesResponseType(typeof(IEnumerable<LicenseUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<LicenseUserDto>>> GetUsers(
        [FromQuery] string? licenseType = null,
        [FromQuery] string? activityStatus = null,
        [FromQuery] bool? onlyWithRecommendations = null,
        [FromQuery] string? department = null,
        [FromQuery] int? inactiveDaysThreshold = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var filter = new LicenseFilterDto(
                LicenseType: licenseType,
                ActivityStatus: activityStatus,
                OnlyWithRecommendations: onlyWithRecommendations,
                Department: department,
                InactiveDaysThreshold: inactiveDaysThreshold
            );

            var users = await _licenseService.GetUsersWithLicensesAsync(filter, cancellationToken);
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fout bij ophalen gebruikers met licenties");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Gebruikers ophalen mislukt",
                Detail = ex.Message,
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Haalt licentie-informatie op voor een specifieke gebruiker.
    /// Requires: HR Admin of ICT Admin
    /// </summary>
    [HttpGet("users/{userId}")]
    [Authorize(Policy = PolicyNames.RequireIctAdmin)]
    [ProducesResponseType(typeof(LicenseUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<LicenseUserDto>> GetUserLicenseInfo(
        string userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _licenseService.GetUserLicenseInfoAsync(userId, cancellationToken);
            if (user == null)
                return NotFound(new ProblemDetails
                {
                    Title = "Gebruiker niet gevonden",
                    Detail = $"Geen licentie-informatie gevonden voor gebruiker {userId}",
                    Status = StatusCodes.Status404NotFound
                });

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fout bij ophalen licentie-info voor gebruiker {UserId}", userId);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Gebruiker ophalen mislukt",
                Detail = ex.Message,
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Haalt aanbevelingen op voor licentie-optimalisatie.
    /// Requires: HR Admin of ICT Admin
    /// </summary>
    [HttpGet("recommendations")]
    [Authorize(Policy = PolicyNames.RequireIctAdmin)]
    [ProducesResponseType(typeof(IEnumerable<LicenseRecommendationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<LicenseRecommendationDto>>> GetRecommendations(
        CancellationToken cancellationToken = default)
    {
        try
        {
            var recommendations = await _licenseService.GetRecommendationsAsync(cancellationToken);
            return Ok(recommendations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fout bij ophalen licentie-aanbevelingen");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Aanbevelingen ophalen mislukt",
                Detail = ex.Message,
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }
}
