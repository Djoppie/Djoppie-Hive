using DjoppieHive.Core.DTOs;

namespace DjoppieHive.Core.Interfaces;

/// <summary>
/// Service voor het ophalen van dashboard statistieken.
/// </summary>
public interface IStatisticsService
{
    /// <summary>
    /// Haalt alle dashboard statistieken op.
    /// </summary>
    Task<DashboardStatisticsDto> GetDashboardStatisticsAsync(CancellationToken cancellationToken = default);
}
