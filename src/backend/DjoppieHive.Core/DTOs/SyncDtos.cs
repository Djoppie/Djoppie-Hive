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
