namespace DjoppieHive.Core.DTOs;

/// <summary>
/// Validatieverzoek weergave.
/// </summary>
public record ValidatieVerzoekDto(
    Guid Id,
    string Type,
    string Beschrijving,
    string? MedewerkerNaam,
    string? MedewerkerEmail,
    string? GroepNaam,
    string Status,
    DateTime AangemaaktOp,
    string? ToegwezenAanRol,
    string? VorigeWaarde
);

/// <summary>
/// Verzoek om een validatie af te handelen.
/// </summary>
public record AfhandelValidatieVerzoekDto(
    string Afhandeling,  // "BevestigVerwijdering", "HandmatigHertoevoegen", "Negeren", "Escaleren"
    string? Notities
);

/// <summary>
/// Detail weergave van een validatieverzoek.
/// </summary>
public record ValidatieVerzoekDetailDto(
    Guid Id,
    string Type,
    string Beschrijving,
    Guid? MedewerkerId,
    string? MedewerkerNaam,
    string? MedewerkerEmail,
    Guid? GroepId,
    string? GroepNaam,
    string Status,
    DateTime AangemaaktOp,
    string? ToegwezenAanRol,
    string? VorigeWaarde,
    string? NieuweWaarde,
    string? AfgehandeldDoor,
    DateTime? AfgehandeldOp,
    string? AfhandelingNotities,
    string? Afhandeling
);
