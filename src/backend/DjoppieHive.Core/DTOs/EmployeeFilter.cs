using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.DTOs;

/// <summary>
/// Filter voor het ophalen van medewerkers.
/// </summary>
/// <param name="Type">Filter op type medewerker (Personeel, Vrijwilliger, etc.)</param>
/// <param name="Regime">Filter op arbeidsregime (Voltijds, Deeltijds, Vrijwilliger)</param>
/// <param name="IsActive">Filter op actieve status (null = alle, true = actief, false = inactief)</param>
/// <param name="DienstId">Filter op dienst (DistributionGroup) ID</param>
/// <param name="SectorId">Filter op sector ID</param>
/// <param name="SearchTerm">Zoekterm voor naam of email</param>
/// <param name="Bron">Filter op gegevensbron (AzureAD of Handmatig)</param>
public record EmployeeFilter(
    EmployeeType? Type = null,

    ArbeidsRegime? Regime = null,

    bool? IsActive = null,

    Guid? DienstId = null,

    Guid? SectorId = null,

    string? SearchTerm = null,

    GegevensBron? Bron = null
);
