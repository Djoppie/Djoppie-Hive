using DjoppieHive.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace DjoppieHive.Core.DTOs;

/// <summary>
/// DTO voor het aanmaken van een nieuwe medewerker (POST /api/employees).
/// </summary>
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

    /// <summary>
    /// Type medewerker (Personeel, Vrijwilliger, Interim, Extern, Stagiair).
    /// Default: Personeel.
    /// </summary>
    EmployeeType EmployeeType = EmployeeType.Personeel,

    /// <summary>
    /// Arbeidsregime (Voltijds, Deeltijds, Vrijwilliger).
    /// Default: Voltijds.
    /// </summary>
    ArbeidsRegime ArbeidsRegime = ArbeidsRegime.Voltijds,

    /// <summary>
    /// URL naar profielfoto.
    /// </summary>
    [MaxLength(500, ErrorMessage = "PhotoUrl mag maximaal 500 tekens bevatten")]
    string? PhotoUrl = null,

    /// <summary>
    /// ID van de dienst (DistributionGroup) waar deze medewerker primair onder valt.
    /// </summary>
    Guid? DienstId = null,

    /// <summary>
    /// Startdatum van het dienstverband.
    /// </summary>
    DateTime? StartDatum = null,

    /// <summary>
    /// Einddatum van het dienstverband.
    /// </summary>
    DateTime? EindDatum = null,

    /// <summary>
    /// Telefoonnummer (vast toestel of alternatief nummer).
    /// </summary>
    [MaxLength(50, ErrorMessage = "Telefoonnummer mag maximaal 50 tekens bevatten")]
    string? Telefoonnummer = null,

    /// <summary>
    /// Vrijwilligersdetails (indien EmployeeType = Vrijwilliger).
    /// </summary>
    VrijwilligerDetailsUpsertDto? VrijwilligerDetails = null
);
