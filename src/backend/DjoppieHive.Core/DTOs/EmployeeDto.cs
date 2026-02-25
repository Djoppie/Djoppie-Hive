using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.DTOs;

/// <summary>
/// Volledig DTO voor een medewerker.
/// Bevat alle gegevens van een medewerker inclusief Azure AD velden en Djoppie-Hive specifieke velden.
/// </summary>
/// <param name="Id">Unieke identifier van de medewerker (GUID)</param>
/// <param name="DisplayName">Volledige weergavenaam (bijv. "Jan Janssen")</param>
/// <param name="GivenName">Voornaam</param>
/// <param name="Surname">Achternaam</param>
/// <param name="Email">E-mailadres (primair contact)</param>
/// <param name="JobTitle">Functietitel (bijv. "Administratief medewerker")</param>
/// <param name="Department">Afdeling zoals in Azure AD</param>
/// <param name="OfficeLocation">Kantoorlocatie</param>
/// <param name="MobilePhone">Mobiel telefoonnummer</param>
/// <param name="Groups">Lijst van MG- distributiegroepen waar de medewerker lid van is</param>
/// <param name="IsActive">True als de medewerker actief is, false voor inactief/uitdienst</param>
/// <param name="Bron">Gegevensbron: "AzureAD" voor gesynchroniseerd, "Handmatig" voor lokaal toegevoegd</param>
/// <param name="IsHandmatigToegevoegd">True als de medewerker lokaal is toegevoegd (niet vanuit Azure AD)</param>
/// <param name="EmployeeType">Type medewerker: Personeel, Vrijwilliger, Interim, Extern, Stagiair</param>
/// <param name="ArbeidsRegime">Arbeidsregime: Voltijds, Deeltijds, Vrijwilliger</param>
/// <param name="PhotoUrl">URL naar profielfoto (indien beschikbaar)</param>
/// <param name="DienstId">ID van de primaire dienst (DistributionGroup)</param>
/// <param name="DienstNaam">Naam van de primaire dienst (bijv. "MG-Burgerzaken")</param>
/// <param name="SectorNaam">Naam van de bovenliggende sector (bijv. "MG-SECTOR-Organisatie")</param>
/// <param name="StartDatum">Startdatum dienstverband</param>
/// <param name="EindDatum">Einddatum dienstverband (indien van toepassing)</param>
/// <param name="Telefoonnummer">Vast telefoonnummer</param>
/// <param name="VrijwilligerDetails">Extra details voor vrijwilligers (rijbewijs, beschikbaarheid, etc.)</param>
/// <param name="CreatedAt">Datum/tijd waarop het record is aangemaakt in Djoppie-Hive</param>
/// <param name="UpdatedAt">Datum/tijd van de laatste wijziging</param>
/// <param name="LastSyncedAt">Datum/tijd van de laatste synchronisatie met Azure AD</param>
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

    // Validatie velden
    string ValidatieStatus,
    string? GevalideerdDoor,
    DateTime? ValidatieDatum,

    // Vrijwilligersdetails (indien EmployeeType = Vrijwilliger)
    VrijwilligerDetailsDto? VrijwilligerDetails,

    DateTime CreatedAt,
    DateTime? UpdatedAt,
    DateTime? LastSyncedAt
);

/// <summary>
/// Beknopt DTO voor medewerker (voor lijstweergave en zoekresultaten).
/// </summary>
/// <param name="Id">Unieke identifier van de medewerker</param>
/// <param name="DisplayName">Volledige weergavenaam</param>
/// <param name="Email">E-mailadres</param>
/// <param name="JobTitle">Functietitel</param>
/// <param name="EmployeeType">Type medewerker</param>
/// <param name="ArbeidsRegime">Arbeidsregime</param>
/// <param name="IsActive">True als actief</param>
/// <param name="DienstNaam">Naam van de primaire dienst</param>
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
