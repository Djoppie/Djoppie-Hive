namespace DjoppieHive.Core.DTOs;

/// <summary>
/// Resultaat van een synchronisatieoperatie.
/// </summary>
public record SyncResultaatDto(
    Guid SyncLogboekId,
    DateTime GeStartOp,
    DateTime VoltooidOp,
    string Status,
    int GroepenVerwerkt,
    int MedewerkersToegevoegd,
    int MedewerkersBijgewerkt,
    int MedewerkersVerwijderd,
    int LidmaatschappenToegevoegd,
    int LidmaatschappenVerwijderd,
    int ValidatieVerzoekenAangemaakt,
    string? Foutmelding
);

/// <summary>
/// Status van de synchronisatie.
/// </summary>
public record SyncStatusDto(
    bool IsSyncBezig,
    DateTime? LaatsteSyncOp,
    string? LaatsteSyncStatus,
    Guid? HuidigeSyncId
);

/// <summary>
/// Logboekitem van een synchronisatie.
/// </summary>
public record SyncLogboekDto(
    Guid Id,
    DateTime GeStartOp,
    DateTime? VoltooidOp,
    string Status,
    string? GestartDoor,
    int GroepenVerwerkt,
    int MedewerkersToegevoegd,
    int MedewerkersBijgewerkt,
    int MedewerkersVerwijderd,
    int ValidatieVerzoekenAangemaakt
);

/// <summary>
/// Preview van een gebruiker uit Azure AD/Entra ID.
/// </summary>
public record ADUserPreviewDto(
    string Id,
    string DisplayName,
    string? GivenName,
    string? Surname,
    string Email,
    string? JobTitle,
    string? Department,
    string? MobilePhone,
    bool AccountEnabled,
    bool BestaatAl,
    Guid? BestaandeMedewerkerId
);

/// <summary>
/// Preview van een groep uit Azure AD/Entra ID.
/// </summary>
public record ADGroupPreviewDto(
    string Id,
    string DisplayName,
    string? Description,
    string? Email,
    string Niveau,
    int AantalLeden,
    bool BestaatAl
);

/// <summary>
/// Volledige preview van wat er gesynchroniseerd zou worden.
/// </summary>
public record SyncPreviewDto(
    IEnumerable<ADUserPreviewDto> Gebruikers,
    IEnumerable<ADGroupPreviewDto> Groepen,
    SyncPreviewStatisticsDto Statistieken,
    DateTime OpgehaaldOp
);

/// <summary>
/// Statistieken voor de sync preview.
/// </summary>
public record SyncPreviewStatisticsDto(
    int TotaalGebruikers,
    int ActieveGebruikers,
    int InactieveGebruikers,
    int NieuweGebruikers,
    int BestaandeGebruikers,
    int TotaalGroepen,
    int NieuweGroepen,
    int BestaandeGroepen
);
