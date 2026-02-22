using DjoppieHive.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace DjoppieHive.Core.DTOs;

/// <summary>
/// DTO voor het bijwerken van een bestaande medewerker (PUT /api/employees/{id}).
/// </summary>
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

    /// <summary>
    /// Type medewerker (Personeel, Vrijwilliger, Interim, Extern, Stagiair).
    /// </summary>
    EmployeeType? EmployeeType = null,

    /// <summary>
    /// Arbeidsregime (Voltijds, Deeltijds, Vrijwilliger).
    /// </summary>
    ArbeidsRegime? ArbeidsRegime = null,

    /// <summary>
    /// URL naar profielfoto.
    /// </summary>
    [MaxLength(500, ErrorMessage = "PhotoUrl mag maximaal 500 tekens bevatten")]
    string? PhotoUrl = null,

    /// <summary>
    /// ID van de dienst (DistributionGroup) waar deze medewerker primair onder valt.
    /// Gebruik een lege Guid om de dienst te verwijderen.
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
    /// Indien null, worden de bestaande details niet gewijzigd.
    /// </summary>
    VrijwilligerDetailsUpsertDto? VrijwilligerDetails = null
);
