namespace DjoppieHive.Core.DTOs;

/// <summary>
/// Overzicht van alle licenties in de tenant.
/// </summary>
public record LicenseOverviewDto(
    IEnumerable<LicenseSubscriptionDto> Subscriptions,
    IEnumerable<LicenseUserDto> Users,
    IEnumerable<LicenseRecommendationDto> Recommendations,
    LicenseSummaryDto Summary
);

/// <summary>
/// Samenvatting van licentiegebruik.
/// </summary>
public record LicenseSummaryDto(
    int TotalE3Licenses,
    int UsedE3Licenses,
    int AvailableE3Licenses,
    int TotalF3Licenses,
    int UsedF3Licenses,
    int AvailableF3Licenses,
    int TotalRecommendations,
    int PotentialSavings
);

/// <summary>
/// Een Microsoft 365 licentie-abonnement.
/// </summary>
public record LicenseSubscriptionDto(
    string SkuId,
    string SkuPartNumber,
    string DisplayName,
    int TotalLicenses,
    int UsedLicenses,
    int AvailableLicenses,
    decimal PercentageUsed,
    string Status
);

/// <summary>
/// Een gebruiker met hun toegewezen licenties en gebruiksdata.
/// </summary>
public record LicenseUserDto(
    string UserId,
    string DisplayName,
    string Email,
    string? Department,
    string? JobTitle,
    IEnumerable<string> AssignedLicenses,
    string PrimaryLicense,
    DateTime? LastSignInDate,
    int DaysSinceLastSignIn,
    LicenseUsageDto? Usage,
    string ActivityStatus,
    bool HasRecommendation
);

/// <summary>
/// Gebruiksgegevens per gebruiker.
/// </summary>
public record LicenseUsageDto(
    bool HasEmailActivity,
    int EmailsSent,
    int EmailsReceived,
    bool HasTeamsActivity,
    int TeamsChatMessages,
    int TeamsMeetingsAttended,
    bool HasOneDriveActivity,
    long OneDriveStorageUsedBytes,
    bool HasSharePointActivity,
    DateTime? LastActivityDate
);

/// <summary>
/// Aanbeveling voor licentie-optimalisatie.
/// </summary>
public record LicenseRecommendationDto(
    string UserId,
    string UserDisplayName,
    string UserEmail,
    string CurrentLicense,
    string RecommendationType,
    string RecommendationTitle,
    string RecommendationDescription,
    string Severity,
    int DaysSinceActivity,
    decimal? EstimatedMonthlySavings
);

/// <summary>
/// Filter voor licentie-queries.
/// </summary>
public record LicenseFilterDto(
    string? LicenseType = null,
    string? ActivityStatus = null,
    bool? OnlyWithRecommendations = null,
    string? Department = null,
    int? InactiveDaysThreshold = null
);

/// <summary>
/// Bekende Microsoft 365 SKU's.
/// </summary>
public static class Microsoft365Skus
{
    // Microsoft 365 E3
    public const string M365E3 = "05e9a617-0261-4cee-bb44-138d3ef5d965";
    public const string M365E3_PartNumber = "SPE_E3";

    // Microsoft 365 F3 (Frontline)
    public const string M365F3 = "66b55226-6b4f-492c-910c-a3b7a3c9d993";
    public const string M365F3_PartNumber = "SPE_F1";

    // Office 365 E3
    public const string O365E3 = "6fd2c87f-b296-42f0-b197-1e91e994b900";
    public const string O365E3_PartNumber = "ENTERPRISEPACK";

    // Office 365 F3
    public const string O365F3 = "4b585984-651b-448a-9e53-3b10f069cf7f";
    public const string O365F3_PartNumber = "DESKLESSPACK";

    // Display names
    public static string GetDisplayName(string skuPartNumber) => skuPartNumber switch
    {
        "SPE_E3" => "Microsoft 365 E3",
        "SPE_F1" => "Microsoft 365 F3",
        "ENTERPRISEPACK" => "Office 365 E3",
        "DESKLESSPACK" => "Office 365 F3",
        "SPE_E5" => "Microsoft 365 E5",
        "ENTERPRISEPREMIUM" => "Office 365 E5",
        "SPE_F3" => "Microsoft 365 F3",
        "EXCHANGESTANDARD" => "Exchange Online Plan 1",
        "EXCHANGEENTERPRISE" => "Exchange Online Plan 2",
        _ => skuPartNumber
    };

    // Check if SKU is E3 type
    public static bool IsE3License(string skuPartNumber) =>
        skuPartNumber is "SPE_E3" or "ENTERPRISEPACK" or "SPE_E5" or "ENTERPRISEPREMIUM";

    // Check if SKU is F3 type
    public static bool IsF3License(string skuPartNumber) =>
        skuPartNumber is "SPE_F1" or "DESKLESSPACK" or "SPE_F3";
}

/// <summary>
/// Aanbevelingstypen.
/// </summary>
public static class RecommendationType
{
    public const string RemoveLicense = "REMOVE_LICENSE";
    public const string DowngradeToF3 = "DOWNGRADE_TO_F3";
    public const string UpgradeToE3 = "UPGRADE_TO_E3";
    public const string ReviewUsage = "REVIEW_USAGE";
}

/// <summary>
/// Activiteitsstatus.
/// </summary>
public static class ActivityStatus
{
    public const string Active = "Actief";
    public const string Inactive30Days = "Inactief (30+ dagen)";
    public const string Inactive60Days = "Inactief (60+ dagen)";
    public const string Inactive90Days = "Inactief (90+ dagen)";
    public const string NeverSignedIn = "Nooit ingelogd";
}
