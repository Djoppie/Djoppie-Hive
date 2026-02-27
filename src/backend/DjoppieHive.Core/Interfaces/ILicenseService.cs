using DjoppieHive.Core.DTOs;

namespace DjoppieHive.Core.Interfaces;

/// <summary>
/// Service voor het beheren en analyseren van Microsoft 365 licenties.
/// </summary>
public interface ILicenseService
{
    /// <summary>
    /// Haalt een volledig overzicht op van alle licenties, gebruikers en aanbevelingen.
    /// </summary>
    Task<LicenseOverviewDto> GetLicenseOverviewAsync(
        LicenseFilterDto? filter = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Haalt alle beschikbare licentie-abonnementen op.
    /// </summary>
    Task<IEnumerable<LicenseSubscriptionDto>> GetSubscriptionsAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Haalt alle gebruikers met hun licenties en gebruiksdata op.
    /// </summary>
    Task<IEnumerable<LicenseUserDto>> GetUsersWithLicensesAsync(
        LicenseFilterDto? filter = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Haalt aanbevelingen op voor licentie-optimalisatie.
    /// </summary>
    Task<IEnumerable<LicenseRecommendationDto>> GetRecommendationsAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Haalt licentie-informatie op voor een specifieke gebruiker.
    /// </summary>
    Task<LicenseUserDto?> GetUserLicenseInfoAsync(
        string userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Haalt de samenvatting op van licentiegebruik.
    /// </summary>
    Task<LicenseSummaryDto> GetSummaryAsync(
        CancellationToken cancellationToken = default);
}
