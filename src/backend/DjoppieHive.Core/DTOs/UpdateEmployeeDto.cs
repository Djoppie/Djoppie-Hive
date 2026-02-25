using DjoppieHive.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace DjoppieHive.Core.DTOs;

/// <summary>
/// DTO voor het bijwerken van een bestaande medewerker (PUT /api/employees/{id}).
/// </summary>
/// <param name="DisplayName">Volledige weergavenaam (max 256 tekens)</param>
/// <param name="GivenName">Voornaam</param>
/// <param name="Surname">Achternaam</param>
/// <param name="Email">E-mailadres (moet geldig zijn)</param>
/// <param name="JobTitle">Functietitel</param>
/// <param name="Department">Afdeling</param>
/// <param name="OfficeLocation">Kantoorlocatie</param>
/// <param name="MobilePhone">Mobiel telefoonnummer</param>
/// <param name="BusinessPhones">Zakelijke telefoonnummers</param>
/// <param name="IsActive">Actieve status</param>
/// <param name="EmployeeType">Type medewerker</param>
/// <param name="ArbeidsRegime">Arbeidsregime</param>
/// <param name="PhotoUrl">URL naar profielfoto</param>
/// <param name="DienstId">ID van de primaire dienst (lege Guid verwijdert dienst)</param>
/// <param name="StartDatum">Startdatum dienstverband</param>
/// <param name="EindDatum">Einddatum dienstverband</param>
/// <param name="Telefoonnummer">Vast telefoonnummer</param>
/// <param name="VrijwilligerDetails">Extra details voor vrijwilligers (null = geen wijziging)</param>
public record UpdateEmployeeDto(
    [MaxLength(256, ErrorMessage = "DisplayName mag maximaal 256 tekens bevatten")]
    string? DisplayName = null,

    string? GivenName = null,

    string? Surname = null,

    [EmailAddress(ErrorMessage = "Ongeldig emailadres")]
    [MaxLength(256, ErrorMessage = "Email mag maximaal 256 tekens bevatten")]
    string? Email = null,

    string? JobTitle = null,

    string? Department = null,

    string? OfficeLocation = null,

    string? MobilePhone = null,

    string? BusinessPhones = null,

    bool? IsActive = null,

    EmployeeType? EmployeeType = null,

    ArbeidsRegime? ArbeidsRegime = null,

    [MaxLength(500, ErrorMessage = "PhotoUrl mag maximaal 500 tekens bevatten")]
    string? PhotoUrl = null,

    Guid? DienstId = null,

    DateTime? StartDatum = null,

    DateTime? EindDatum = null,

    [MaxLength(50, ErrorMessage = "Telefoonnummer mag maximaal 50 tekens bevatten")]
    string? Telefoonnummer = null,

    VrijwilligerDetailsUpsertDto? VrijwilligerDetails = null
);
