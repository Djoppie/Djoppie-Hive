using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.DTOs;

/// <summary>
/// Filter criteria voor event ontvangers.
/// </summary>
public record EventFilterCriteria(
    bool AlleenActief = true,
    IEnumerable<string>? Sectoren = null,
    IEnumerable<EmployeeType>? EmployeeTypes = null,
    IEnumerable<ArbeidsRegime>? ArbeidsRegimes = null,
    Guid? DistributieGroepId = null
);

/// <summary>
/// DTO voor een event/uitnodiging.
/// </summary>
public record EventDto(
    Guid Id,
    string Titel,
    string Beschrijving,
    DateTime Datum,
    string Type,
    string Status,
    EventFilterCriteria? FilterCriteria,
    Guid? DistributieGroepId,
    string? DistributieGroepNaam,
    int AantalDeelnemers,
    string? AangemaaktDoor,
    DateTime AangemaaktOp,
    DateTime? VerstuurdOp,
    string? VerstuurdDoor
);

/// <summary>
/// DTO voor deelnemer aan een event.
/// </summary>
public record EventParticipantDto(
    Guid EmployeeId,
    string DisplayName,
    string Email,
    string? JobTitle,
    string? Department,
    bool EmailVerstuurd,
    DateTime? EmailVerstuurdOp
);

/// <summary>
/// Detail DTO voor een event met deelnemers.
/// </summary>
public record EventDetailDto(
    Guid Id,
    string Titel,
    string Beschrijving,
    DateTime Datum,
    string Type,
    string Status,
    EventFilterCriteria? FilterCriteria,
    Guid? DistributieGroepId,
    string? DistributieGroepNaam,
    IEnumerable<EventParticipantDto> Deelnemers,
    string? AangemaaktDoor,
    DateTime AangemaaktOp,
    DateTime? VerstuurdOp,
    string? VerstuurdDoor
);

/// <summary>
/// DTO voor het aanmaken van een event.
/// </summary>
public record CreateEventDto(
    string Titel,
    string Beschrijving,
    DateTime Datum,
    EventType Type,
    EventFilterCriteria? FilterCriteria = null,
    Guid? DistributieGroepId = null
);

/// <summary>
/// DTO voor het bijwerken van een event.
/// </summary>
public record UpdateEventDto(
    string? Titel = null,
    string? Beschrijving = null,
    DateTime? Datum = null,
    EventType? Type = null,
    EventFilterCriteria? FilterCriteria = null,
    Guid? DistributieGroepId = null
);

/// <summary>
/// DTO voor preview van ontvangers.
/// </summary>
public record EventRecipientsPreviewDto(
    int TotaalAantal,
    IEnumerable<EventParticipantDto> VoorbeeldOntvangers
);
