using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Stub implementation of ILicenseService when Graph API is not configured.
/// Returns empty data indicating license management is not available without Graph credentials.
/// </summary>
public class StubLicenseService : ILicenseService
{
    public Task<LicenseOverviewDto> GetLicenseOverviewAsync(
        LicenseFilterDto? filter = null,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new LicenseOverviewDto(
            Subscriptions: Enumerable.Empty<LicenseSubscriptionDto>(),
            Users: Enumerable.Empty<LicenseUserDto>(),
            Recommendations: Enumerable.Empty<LicenseRecommendationDto>(),
            Summary: new LicenseSummaryDto(
                TotalE3Licenses: 0,
                UsedE3Licenses: 0,
                AvailableE3Licenses: 0,
                TotalF3Licenses: 0,
                UsedF3Licenses: 0,
                AvailableF3Licenses: 0,
                TotalRecommendations: 0,
                PotentialSavings: 0
            )
        ));
    }

    public Task<IEnumerable<LicenseSubscriptionDto>> GetSubscriptionsAsync(
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Enumerable.Empty<LicenseSubscriptionDto>());
    }

    public Task<IEnumerable<LicenseUserDto>> GetUsersWithLicensesAsync(
        LicenseFilterDto? filter = null,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Enumerable.Empty<LicenseUserDto>());
    }

    public Task<IEnumerable<LicenseRecommendationDto>> GetRecommendationsAsync(
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Enumerable.Empty<LicenseRecommendationDto>());
    }

    public Task<LicenseUserDto?> GetUserLicenseInfoAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult<LicenseUserDto?>(null);
    }

    public Task<LicenseSummaryDto> GetSummaryAsync(
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new LicenseSummaryDto(
            TotalE3Licenses: 0,
            UsedE3Licenses: 0,
            AvailableE3Licenses: 0,
            TotalF3Licenses: 0,
            UsedF3Licenses: 0,
            AvailableF3Licenses: 0,
            TotalRecommendations: 0,
            PotentialSavings: 0
        ));
    }
}
