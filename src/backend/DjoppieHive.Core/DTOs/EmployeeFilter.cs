using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.DTOs;

/// <summary>
/// Filter voor het ophalen van medewerkers.
/// </summary>
public record EmployeeFilter(
    /// <summary>
    /// Filter op type medewerker (Personeel, Vrijwilliger, etc.).
    /// </summary>
    EmployeeType? Type = null,

    /// <summary>
    /// Filter op arbeidsregime (Voltijds, Deeltijds, Vrijwilliger).
    /// </summary>
    ArbeidsRegime? Regime = null,

    /// <summary>
    /// Filter op actieve status. Null = alle, true = alleen actief, false = alleen inactief.
    /// </summary>
    bool? IsActive = null,

    /// <summary>
    /// Filter op dienst (DistributionGroup) ID.
    /// </summary>
    Guid? DienstId = null,

    /// <summary>
    /// Zoekterm voor naam of email.
    /// </summary>
    string? SearchTerm = null,

    /// <summary>
    /// Filter op gegevensbron (AzureAD of Handmatig).
    /// </summary>
    GegevensBron? Bron = null
);
