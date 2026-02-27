using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Service voor het beheren en analyseren van Microsoft 365 licenties via Graph API.
/// </summary>
public class LicenseService : ILicenseService
{
    private readonly GraphServiceClient _graphClient;
    private readonly ILogger<LicenseService> _logger;

    // Thresholds voor aanbevelingen
    private const int InactiveDaysForRemoval = 90;
    private const int InactiveDaysForReview = 60;
    private const int InactiveDaysWarning = 30;

    // Geschatte maandelijkse kosten (EUR)
    private const decimal E3MonthlyCost = 35.00m;
    private const decimal F3MonthlyCost = 8.00m;

    public LicenseService(
        GraphServiceClient graphClient,
        ILogger<LicenseService> logger)
    {
        _graphClient = graphClient;
        _logger = logger;
    }

    public async Task<LicenseOverviewDto> GetLicenseOverviewAsync(
        LicenseFilterDto? filter = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Ophalen licentie-overzicht...");

        var subscriptions = await GetSubscriptionsAsync(cancellationToken);
        var users = await GetUsersWithLicensesAsync(filter, cancellationToken);
        var recommendations = await GetRecommendationsAsync(cancellationToken);
        var summary = await GetSummaryAsync(cancellationToken);

        return new LicenseOverviewDto(
            Subscriptions: subscriptions,
            Users: users,
            Recommendations: recommendations,
            Summary: summary
        );
    }

    public async Task<IEnumerable<LicenseSubscriptionDto>> GetSubscriptionsAsync(
        CancellationToken cancellationToken = default)
    {
        try
        {
            var subscribedSkus = await _graphClient.SubscribedSkus
                .GetAsync(cancellationToken: cancellationToken);

            if (subscribedSkus?.Value == null)
                return Enumerable.Empty<LicenseSubscriptionDto>();

            return subscribedSkus.Value
                .Where(sku => sku.CapabilityStatus == "Enabled")
                .Select(sku =>
                {
                    var total = sku.PrepaidUnits?.Enabled ?? 0;
                    var used = sku.ConsumedUnits ?? 0;
                    var available = Math.Max(0, total - used);
                    var percentage = total > 0 ? (decimal)used / total * 100 : 0;

                    return new LicenseSubscriptionDto(
                        SkuId: sku.SkuId?.ToString() ?? "",
                        SkuPartNumber: sku.SkuPartNumber ?? "",
                        DisplayName: Microsoft365Skus.GetDisplayName(sku.SkuPartNumber ?? ""),
                        TotalLicenses: total,
                        UsedLicenses: used,
                        AvailableLicenses: available,
                        PercentageUsed: Math.Round(percentage, 1),
                        Status: GetSubscriptionStatus(available, total)
                    );
                })
                .OrderByDescending(s => Microsoft365Skus.IsE3License(s.SkuPartNumber))
                .ThenByDescending(s => Microsoft365Skus.IsF3License(s.SkuPartNumber))
                .ThenBy(s => s.DisplayName)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fout bij ophalen subscribed SKUs");
            throw;
        }
    }

    public async Task<IEnumerable<LicenseUserDto>> GetUsersWithLicensesAsync(
        LicenseFilterDto? filter = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Get all users with licenses
            var users = await _graphClient.Users
                .GetAsync(requestConfig =>
                {
                    requestConfig.QueryParameters.Select = new[]
                    {
                        "id", "displayName", "mail", "userPrincipalName",
                        "department", "jobTitle", "assignedLicenses",
                        "signInActivity", "accountEnabled"
                    };
                    requestConfig.QueryParameters.Top = 999;
                    requestConfig.QueryParameters.Filter = "assignedLicenses/$count ne 0";
                    requestConfig.Headers.Add("ConsistencyLevel", "eventual");
                    requestConfig.QueryParameters.Count = true;
                }, cancellationToken);

            if (users?.Value == null)
                return Enumerable.Empty<LicenseUserDto>();

            // Get SKU mapping
            var skuMap = await GetSkuMappingAsync(cancellationToken);

            var result = new List<LicenseUserDto>();

            foreach (var user in users.Value.Where(u => u.AccountEnabled == true))
            {
                var licenseUser = MapUserToLicenseDto(user, skuMap);

                // Apply filters
                if (filter != null)
                {
                    if (!string.IsNullOrEmpty(filter.LicenseType))
                    {
                        var hasLicenseType = filter.LicenseType.ToLower() switch
                        {
                            "e3" => licenseUser.AssignedLicenses.Any(l =>
                                Microsoft365Skus.IsE3License(l)),
                            "f3" => licenseUser.AssignedLicenses.Any(l =>
                                Microsoft365Skus.IsF3License(l)),
                            _ => true
                        };
                        if (!hasLicenseType) continue;
                    }

                    if (!string.IsNullOrEmpty(filter.ActivityStatus) &&
                        licenseUser.ActivityStatus != filter.ActivityStatus)
                        continue;

                    if (filter.OnlyWithRecommendations == true &&
                        !licenseUser.HasRecommendation)
                        continue;

                    if (!string.IsNullOrEmpty(filter.Department) &&
                        licenseUser.Department != filter.Department)
                        continue;

                    if (filter.InactiveDaysThreshold.HasValue &&
                        licenseUser.DaysSinceLastSignIn < filter.InactiveDaysThreshold.Value)
                        continue;
                }

                result.Add(licenseUser);
            }

            return result
                .OrderByDescending(u => u.DaysSinceLastSignIn)
                .ThenBy(u => u.DisplayName)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fout bij ophalen gebruikers met licenties");
            throw;
        }
    }

    public async Task<IEnumerable<LicenseRecommendationDto>> GetRecommendationsAsync(
        CancellationToken cancellationToken = default)
    {
        var users = await GetUsersWithLicensesAsync(null, cancellationToken);
        var recommendations = new List<LicenseRecommendationDto>();

        foreach (var user in users)
        {
            var recommendation = GenerateRecommendation(user);
            if (recommendation != null)
            {
                recommendations.Add(recommendation);
            }
        }

        return recommendations
            .OrderByDescending(r => r.Severity == "high")
            .ThenByDescending(r => r.Severity == "medium")
            .ThenByDescending(r => r.DaysSinceActivity)
            .ToList();
    }

    public async Task<LicenseUserDto?> GetUserLicenseInfoAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _graphClient.Users[userId]
                .GetAsync(requestConfig =>
                {
                    requestConfig.QueryParameters.Select = new[]
                    {
                        "id", "displayName", "mail", "userPrincipalName",
                        "department", "jobTitle", "assignedLicenses",
                        "signInActivity", "accountEnabled"
                    };
                }, cancellationToken);

            if (user == null) return null;

            var skuMap = await GetSkuMappingAsync(cancellationToken);
            return MapUserToLicenseDto(user, skuMap);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fout bij ophalen licentie-info voor gebruiker {UserId}", userId);
            return null;
        }
    }

    public async Task<LicenseSummaryDto> GetSummaryAsync(
        CancellationToken cancellationToken = default)
    {
        var subscriptions = await GetSubscriptionsAsync(cancellationToken);
        var recommendations = await GetRecommendationsAsync(cancellationToken);

        var e3Subs = subscriptions.Where(s => Microsoft365Skus.IsE3License(s.SkuPartNumber)).ToList();
        var f3Subs = subscriptions.Where(s => Microsoft365Skus.IsF3License(s.SkuPartNumber)).ToList();

        var totalE3 = e3Subs.Sum(s => s.TotalLicenses);
        var usedE3 = e3Subs.Sum(s => s.UsedLicenses);
        var totalF3 = f3Subs.Sum(s => s.TotalLicenses);
        var usedF3 = f3Subs.Sum(s => s.UsedLicenses);

        // Calculate potential savings
        var potentialSavings = recommendations.Sum(r => r.EstimatedMonthlySavings ?? 0);

        return new LicenseSummaryDto(
            TotalE3Licenses: totalE3,
            UsedE3Licenses: usedE3,
            AvailableE3Licenses: Math.Max(0, totalE3 - usedE3),
            TotalF3Licenses: totalF3,
            UsedF3Licenses: usedF3,
            AvailableF3Licenses: Math.Max(0, totalF3 - usedF3),
            TotalRecommendations: recommendations.Count(),
            PotentialSavings: (int)Math.Round(potentialSavings)
        );
    }

    #region Private Helper Methods

    private async Task<Dictionary<string, string>> GetSkuMappingAsync(
        CancellationToken cancellationToken)
    {
        var subscribedSkus = await _graphClient.SubscribedSkus
            .GetAsync(cancellationToken: cancellationToken);

        return subscribedSkus?.Value?
            .Where(s => s.SkuId.HasValue)
            .ToDictionary(
                s => s.SkuId!.Value.ToString(),
                s => s.SkuPartNumber ?? "Unknown"
            ) ?? new Dictionary<string, string>();
    }

    private LicenseUserDto MapUserToLicenseDto(User user, Dictionary<string, string> skuMap)
    {
        var assignedLicenses = user.AssignedLicenses?
            .Select(l => skuMap.TryGetValue(l.SkuId?.ToString() ?? "", out var name) ? name : "Unknown")
            .Where(l => l != "Unknown")
            .ToList() ?? new List<string>();

        var primaryLicense = assignedLicenses
            .FirstOrDefault(l => Microsoft365Skus.IsE3License(l))
            ?? assignedLicenses.FirstOrDefault(l => Microsoft365Skus.IsF3License(l))
            ?? assignedLicenses.FirstOrDefault()
            ?? "Geen";

        var lastSignIn = user.SignInActivity?.LastSignInDateTime?.DateTime;
        var daysSinceSignIn = lastSignIn.HasValue
            ? (int)(DateTime.UtcNow - lastSignIn.Value).TotalDays
            : -1;

        var activityStatus = GetActivityStatus(lastSignIn, daysSinceSignIn);

        // Determine if user has recommendation
        var hasE3 = assignedLicenses.Any(l => Microsoft365Skus.IsE3License(l));
        var hasRecommendation = (daysSinceSignIn >= InactiveDaysWarning && hasE3) ||
                                 daysSinceSignIn >= InactiveDaysForRemoval ||
                                 !lastSignIn.HasValue;

        return new LicenseUserDto(
            UserId: user.Id ?? "",
            DisplayName: user.DisplayName ?? "Onbekend",
            Email: user.Mail ?? user.UserPrincipalName ?? "",
            Department: user.Department,
            JobTitle: user.JobTitle,
            AssignedLicenses: assignedLicenses,
            PrimaryLicense: Microsoft365Skus.GetDisplayName(primaryLicense),
            LastSignInDate: lastSignIn,
            DaysSinceLastSignIn: daysSinceSignIn,
            Usage: null, // Usage data requires Reports.Read.All permission
            ActivityStatus: activityStatus,
            HasRecommendation: hasRecommendation
        );
    }

    private static string GetActivityStatus(DateTime? lastSignIn, int daysSinceSignIn)
    {
        if (!lastSignIn.HasValue)
            return ActivityStatus.NeverSignedIn;

        return daysSinceSignIn switch
        {
            >= 90 => ActivityStatus.Inactive90Days,
            >= 60 => ActivityStatus.Inactive60Days,
            >= 30 => ActivityStatus.Inactive30Days,
            _ => ActivityStatus.Active
        };
    }

    private static string GetSubscriptionStatus(int available, int total)
    {
        if (total == 0) return "unknown";
        var percentAvailable = (decimal)available / total * 100;

        return percentAvailable switch
        {
            <= 5 => "critical",
            <= 15 => "warning",
            _ => "healthy"
        };
    }

    private LicenseRecommendationDto? GenerateRecommendation(LicenseUserDto user)
    {
        var hasE3 = user.AssignedLicenses.Any(l => Microsoft365Skus.IsE3License(l));
        var hasF3 = user.AssignedLicenses.Any(l => Microsoft365Skus.IsF3License(l));

        // Never signed in with E3 license
        if (user.DaysSinceLastSignIn == -1 && hasE3)
        {
            return new LicenseRecommendationDto(
                UserId: user.UserId,
                UserDisplayName: user.DisplayName,
                UserEmail: user.Email,
                CurrentLicense: user.PrimaryLicense,
                RecommendationType: RecommendationType.RemoveLicense,
                RecommendationTitle: "Licentie vrijgeven",
                RecommendationDescription: "Gebruiker heeft nog nooit ingelogd. Overweeg de licentie vrij te geven.",
                Severity: "high",
                DaysSinceActivity: 999,
                EstimatedMonthlySavings: E3MonthlyCost
            );
        }

        // Inactive for 90+ days with E3 - recommend removal
        if (user.DaysSinceLastSignIn >= InactiveDaysForRemoval && hasE3)
        {
            return new LicenseRecommendationDto(
                UserId: user.UserId,
                UserDisplayName: user.DisplayName,
                UserEmail: user.Email,
                CurrentLicense: user.PrimaryLicense,
                RecommendationType: RecommendationType.RemoveLicense,
                RecommendationTitle: "Licentie vrijgeven",
                RecommendationDescription: $"Gebruiker is al {user.DaysSinceLastSignIn} dagen niet ingelogd. Overweeg de licentie vrij te geven of over te zetten.",
                Severity: "high",
                DaysSinceActivity: user.DaysSinceLastSignIn,
                EstimatedMonthlySavings: E3MonthlyCost
            );
        }

        // Inactive for 60+ days with E3 - recommend downgrade
        if (user.DaysSinceLastSignIn >= InactiveDaysForReview && hasE3)
        {
            return new LicenseRecommendationDto(
                UserId: user.UserId,
                UserDisplayName: user.DisplayName,
                UserEmail: user.Email,
                CurrentLicense: user.PrimaryLicense,
                RecommendationType: RecommendationType.DowngradeToF3,
                RecommendationTitle: "Downgrade naar F3",
                RecommendationDescription: $"Gebruiker is al {user.DaysSinceLastSignIn} dagen niet actief. Overweeg downgrade naar F3-licentie.",
                Severity: "medium",
                DaysSinceActivity: user.DaysSinceLastSignIn,
                EstimatedMonthlySavings: E3MonthlyCost - F3MonthlyCost
            );
        }

        // Inactive for 30+ days with E3 - recommend review
        if (user.DaysSinceLastSignIn >= InactiveDaysWarning && hasE3)
        {
            return new LicenseRecommendationDto(
                UserId: user.UserId,
                UserDisplayName: user.DisplayName,
                UserEmail: user.Email,
                CurrentLicense: user.PrimaryLicense,
                RecommendationType: RecommendationType.ReviewUsage,
                RecommendationTitle: "Gebruik controleren",
                RecommendationDescription: $"Gebruiker is al {user.DaysSinceLastSignIn} dagen niet actief. Controleer of E3-licentie nog nodig is.",
                Severity: "low",
                DaysSinceActivity: user.DaysSinceLastSignIn,
                EstimatedMonthlySavings: null
            );
        }

        return null;
    }

    #endregion
}
