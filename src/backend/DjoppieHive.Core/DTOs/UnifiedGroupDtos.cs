using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.DTOs;

// ============================================
// UNIFIED GROUPS DTOs (Hybrid Groups System)
// ============================================

/// <summary>
/// Filter criteria voor dynamische groepen.
/// Bepaalt welke medewerkers automatisch in de groep worden opgenomen.
/// </summary>
/// <param name="EmployeeTypes">Lijst van medewerkertypen (Personeel, Vrijwilliger, Interim, Extern, Stagiair)</param>
/// <param name="ArbeidsRegimes">Lijst van arbeidsregimes (Voltijds, Deeltijds, Vrijwilliger)</param>
/// <param name="AlleenActief">Alleen actieve medewerkers (standaard true)</param>
/// <param name="DienstIds">Lijst van dienst-IDs om te filteren</param>
/// <param name="SectorIds">Lijst van sector-IDs om te filteren</param>
public record DynamicGroupFilterCriteria(
    List<string>? EmployeeTypes = null,
    List<string>? ArbeidsRegimes = null,
    bool? AlleenActief = true,
    List<string>? DienstIds = null,
    List<string>? SectorIds = null
);

/// <summary>
/// Unified group representatie voor alle drie groeptypes.
/// Combineert Exchange, Dynamic en Local groepen in één formaat.
/// </summary>
/// <param name="Id">Unieke identifier (formaat: raw GUID voor Exchange, "dynamic:{guid}" of "local:{guid}")</param>
/// <param name="DisplayName">Weergavenaam van de groep</param>
/// <param name="Description">Optionele beschrijving</param>
/// <param name="Email">E-mailadres van de groep (indien beschikbaar)</param>
/// <param name="MemberCount">Aantal leden in de groep</param>
/// <param name="Source">Bron: "Exchange", "Dynamic" of "Local"</param>
/// <param name="IsReadOnly">True voor Exchange groepen (niet te bewerken in Hive)</param>
/// <param name="IsSystemGroup">True voor voorgedefinieerde dynamische groepen</param>
/// <param name="LastEvaluatedAt">Laatst berekend (alleen voor Dynamic groepen)</param>
public record UnifiedGroupDto(
    string Id,
    string DisplayName,
    string? Description,
    string? Email,
    int MemberCount,
    string Source,
    bool IsReadOnly,
    bool IsSystemGroup,
    DateTime? LastEvaluatedAt
);

/// <summary>
/// Gedetailleerde unified group met leden.
/// </summary>
/// <param name="Id">Unieke identifier</param>
/// <param name="DisplayName">Weergavenaam van de groep</param>
/// <param name="Description">Optionele beschrijving</param>
/// <param name="Email">E-mailadres van de groep</param>
/// <param name="MemberCount">Aantal leden</param>
/// <param name="Source">Bron: "Exchange", "Dynamic" of "Local"</param>
/// <param name="IsReadOnly">True voor Exchange groepen</param>
/// <param name="IsSystemGroup">True voor systeemgroepen</param>
/// <param name="FilterCriteria">Filter criteria (alleen voor Dynamic groepen)</param>
/// <param name="Members">Lijst van leden in de groep</param>
/// <param name="LastEvaluatedAt">Laatst berekend</param>
/// <param name="CreatedAt">Aanmaakdatum</param>
/// <param name="CreatedBy">Aangemaakt door</param>
public record UnifiedGroupDetailDto(
    string Id,
    string DisplayName,
    string? Description,
    string? Email,
    int MemberCount,
    string Source,
    bool IsReadOnly,
    bool IsSystemGroup,
    DynamicGroupFilterCriteria? FilterCriteria,
    List<EmployeeSummaryDto> Members,
    DateTime? LastEvaluatedAt,
    DateTime CreatedAt,
    string? CreatedBy
);

/// <summary>
/// DTO voor het aanmaken van een lokale groep.
/// </summary>
/// <param name="DisplayName">Naam van de groep</param>
/// <param name="Description">Optionele beschrijving</param>
/// <param name="Email">Optioneel e-mailadres</param>
/// <param name="InitialMemberIds">Optionele lijst van medewerker-IDs om direct toe te voegen</param>
public record CreateLocalGroupDto(
    string DisplayName,
    string? Description = null,
    string? Email = null,
    List<Guid>? InitialMemberIds = null
);

/// <summary>
/// DTO voor het bijwerken van een lokale groep.
/// </summary>
/// <param name="DisplayName">Nieuwe naam (optioneel)</param>
/// <param name="Description">Nieuwe beschrijving (optioneel)</param>
/// <param name="Email">Nieuw e-mailadres (optioneel)</param>
public record UpdateLocalGroupDto(
    string? DisplayName = null,
    string? Description = null,
    string? Email = null
);

/// <summary>
/// DTO voor het aanmaken van een dynamische groep.
/// </summary>
/// <param name="DisplayName">Naam van de groep</param>
/// <param name="Description">Optionele beschrijving</param>
/// <param name="Email">Optioneel e-mailadres</param>
/// <param name="FilterCriteria">Filter criteria voor automatische ledenselectie</param>
public record CreateDynamicGroupDto(
    string DisplayName,
    DynamicGroupFilterCriteria FilterCriteria,
    string? Description = null,
    string? Email = null
);

/// <summary>
/// DTO voor het bijwerken van een dynamische groep.
/// </summary>
/// <param name="DisplayName">Nieuwe naam (optioneel)</param>
/// <param name="Description">Nieuwe beschrijving (optioneel)</param>
/// <param name="Email">Nieuw e-mailadres (optioneel)</param>
/// <param name="FilterCriteria">Nieuwe filter criteria (optioneel)</param>
public record UpdateDynamicGroupDto(
    string? DisplayName = null,
    string? Description = null,
    string? Email = null,
    DynamicGroupFilterCriteria? FilterCriteria = null
);

/// <summary>
/// DTO voor het exporteren van e-mailadressen.
/// </summary>
/// <param name="MailtoLink">mailto: link met alle e-mailadressen</param>
/// <param name="EmailCount">Aantal e-mailadressen</param>
/// <param name="TruncatedWarning">Waarschuwing als de link te lang is</param>
public record EmailExportDto(
    string MailtoLink,
    int EmailCount,
    string? TruncatedWarning = null
);

/// <summary>
/// DTO voor preview van gecombineerde groepen.
/// </summary>
/// <param name="TotalUniqueMembers">Totaal aantal unieke leden over alle geselecteerde groepen</param>
/// <param name="GroupBreakdown">Aantal leden per groep</param>
/// <param name="SampleMembers">Voorbeeld van de eerste leden</param>
public record GroupsPreviewDto(
    int TotalUniqueMembers,
    Dictionary<string, int> GroupBreakdown,
    List<EmployeeSummaryDto> SampleMembers
);
