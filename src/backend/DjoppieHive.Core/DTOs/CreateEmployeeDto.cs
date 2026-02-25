using DjoppieHive.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace DjoppieHive.Core.DTOs;

/// <summary>
/// DTO voor het aanmaken van een nieuwe medewerker (POST /api/employees).
/// </summary>
/// <param name="DisplayName">Volledige weergavenaam (verplicht, max 256 tekens)</param>
/// <param name="GivenName">Voornaam</param>
/// <param name="Surname">Achternaam</param>
/// <param name="Email">E-mailadres (verplicht, geldig emailadres)</param>
/// <param name="JobTitle">Functietitel</param>
/// <param name="Department">Afdeling</param>
/// <param name="OfficeLocation">Kantoorlocatie</param>
/// <param name="MobilePhone">Mobiel telefoonnummer</param>
/// <param name="BusinessPhones">Zakelijke telefoonnummers</param>
/// <param name="IsActive">Actieve status (default: true)</param>
/// <param name="EmployeeType">Type medewerker (default: Personeel)</param>
/// <param name="ArbeidsRegime">Arbeidsregime (default: Voltijds)</param>
/// <param name="PhotoUrl">URL naar profielfoto (max 500 tekens)</param>
/// <param name="DienstId">ID van de primaire dienst</param>
/// <param name="StartDatum">Startdatum dienstverband</param>
/// <param name="EindDatum">Einddatum dienstverband</param>
/// <param name="Telefoonnummer">Vast telefoonnummer (max 50 tekens)</param>
/// <param name="VrijwilligerDetails">Extra details voor vrijwilligers</param>
public record CreateEmployeeDto(
    [Required(ErrorMessage = "DisplayName is verplicht")]
    [MaxLength(256, ErrorMessage = "DisplayName mag maximaal 256 tekens bevatten")]
    string DisplayName,

    string? GivenName,

    string? Surname,

    [Required(ErrorMessage = "Email is verplicht")]
    [EmailAddress(ErrorMessage = "Ongeldig emailadres")]
    [MaxLength(256, ErrorMessage = "Email mag maximaal 256 tekens bevatten")]
    string Email,

    string? JobTitle,

    string? Department,

    string? OfficeLocation,

    string? MobilePhone,

    string? BusinessPhones,

    bool IsActive = true,

    EmployeeType EmployeeType = EmployeeType.Personeel,

    ArbeidsRegime ArbeidsRegime = ArbeidsRegime.Voltijds,

    [MaxLength(500, ErrorMessage = "PhotoUrl mag maximaal 500 tekens bevatten")]
    string? PhotoUrl = null,

    Guid? DienstId = null,

    DateTime? StartDatum = null,

    DateTime? EindDatum = null,

    [MaxLength(50, ErrorMessage = "Telefoonnummer mag maximaal 50 tekens bevatten")]
    string? Telefoonnummer = null,

    VrijwilligerDetailsUpsertDto? VrijwilligerDetails = null
);
