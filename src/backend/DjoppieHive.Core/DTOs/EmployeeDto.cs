using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.DTOs;

/// <summary>
/// Volledig DTO voor een medewerker (GET endpoints).
/// </summary>
public record EmployeeDto(
    string Id,
    string DisplayName,
    string? GivenName,
    string? Surname,
    string Email,
    string? JobTitle,
    string? Department,
    string? OfficeLocation,
    string? MobilePhone,
    List<string> Groups,
    bool IsActive,
    string Bron,
    bool IsHandmatigToegevoegd,

    // Phase 1 + 2 velden
    string EmployeeType,
    string ArbeidsRegime,
    string? PhotoUrl,
    string? DienstId,
    string? DienstNaam,
    string? SectorNaam,
    DateTime? StartDatum,
    DateTime? EindDatum,
    string? Telefoonnummer,

    // Vrijwilligersdetails (indien EmployeeType = Vrijwilliger)
    VrijwilligerDetailsDto? VrijwilligerDetails,

    DateTime CreatedAt,
    DateTime? UpdatedAt,
    DateTime? LastSyncedAt
);

/// <summary>
/// Beknopt DTO voor medewerker (voor lijstweergave).
/// </summary>
public record EmployeeSummaryDto(
    string Id,
    string DisplayName,
    string Email,
    string? JobTitle,
    string EmployeeType,
    string ArbeidsRegime,
    bool IsActive,
    string? DienstNaam
);
