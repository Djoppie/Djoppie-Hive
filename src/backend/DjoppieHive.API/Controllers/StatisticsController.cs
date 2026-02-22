using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Controller voor dashboard statistieken.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
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

    // ============================================
    // TEST ENDPOINTS (geen authenticatie vereist)
    // ============================================

    /// <summary>
    /// [TEST] Haalt dashboard statistieken op zonder authenticatie.
    /// </summary>
    [HttpGet("test/dashboard")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(DashboardStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardStatisticsDto>> TestGetDashboardStatistics(
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Test dashboard statistieken ophalen");
        var stats = await _statisticsService.GetDashboardStatisticsAsync(cancellationToken);
        return Ok(stats);
    }
}
