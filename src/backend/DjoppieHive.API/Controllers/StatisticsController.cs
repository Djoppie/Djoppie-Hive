using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Dashboard statistieken en rapportage.
/// Biedt inzicht in aantallen medewerkers, sync status en andere KPI's.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Statistieken")]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _statisticsService;
    private readonly ILogger<StatisticsController> _logger;

    public StatisticsController(
        IStatisticsService statisticsService,
        ILogger<StatisticsController> logger)
    {
        _statisticsService = statisticsService;
        _logger = logger;
    }

    /// <summary>
    /// Haalt alle dashboard statistieken op.
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(DashboardStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardStatisticsDto>> GetDashboardStatistics(
        CancellationToken cancellationToken)
    {
        var stats = await _statisticsService.GetDashboardStatisticsAsync(cancellationToken);
        return Ok(stats);
    }
}
