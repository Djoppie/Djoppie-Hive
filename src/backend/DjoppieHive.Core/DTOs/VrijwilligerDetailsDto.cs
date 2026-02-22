namespace DjoppieHive.Core.DTOs;

/// <summary>
/// DTO voor vrijwilligersdetails (voor GET endpoints).
/// </summary>
public record VrijwilligerDetailsDto(
    string Id,
    string EmployeeId,
    string? Beschikbaarheid,
    string? Specialisaties,
    string? NoodContactNaam,
    string? NoodContactTelefoon,
    DateTime? VogDatum,
    DateTime? VogGeldigTot,
    string? Opmerkingen,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

/// <summary>
/// DTO voor het aanmaken of bijwerken van vrijwilligersdetails.
/// </summary>
public record VrijwilligerDetailsUpsertDto(
    string? Beschikbaarheid,
    string? Specialisaties,
    string? NoodContactNaam,
    string? NoodContactTelefoon,
    DateTime? VogDatum,
    DateTime? VogGeldigTot,
    string? Opmerkingen
);
