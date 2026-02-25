using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.Entities;

/// <summary>
/// Representeert een medewerker uit MG- distributiegroepen in Entra ID.
/// </summary>
public class Employee
{
    public Guid Id { get; set; }
    public string EntraObjectId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? GivenName { get; set; }
    public string? Surname { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? Department { get; set; }
    public string? OfficeLocation { get; set; }
    public string? MobilePhone { get; set; }
    public string? BusinessPhones { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastSyncedAt { get; set; }

    /// <summary>
    /// Bron van deze medewerkergegevens (Azure AD of Handmatig).
    /// </summary>
    public GegevensBron Bron { get; set; } = GegevensBron.AzureAD;

    /// <summary>
    /// Of deze medewerker handmatig is toegevoegd in Djoppie-Hive.
    /// </summary>
    public bool IsHandmatigToegevoegd { get; set; } = false;

    // HR-specifieke velden (Phase 1 + 2)

    /// <summary>
    /// Type medewerker (Personeel, Vrijwilliger, Interim, Extern, Stagiair).
    /// </summary>
    public EmployeeType EmployeeType { get; set; } = EmployeeType.Personeel;

    /// <summary>
    /// Arbeidsregime (Voltijds, Deeltijds, Vrijwilliger).
    /// </summary>
    public ArbeidsRegime ArbeidsRegime { get; set; } = ArbeidsRegime.Voltijds;

    /// <summary>
    /// Validatiestatus van de medewerkergegevens (Nieuw, InReview, Goedgekeurd, Afgekeurd).
    /// </summary>
    public ValidatieStatus ValidatieStatus { get; set; } = ValidatieStatus.Nieuw;

    /// <summary>
    /// Wie heeft de medewerkergegevens gevalideerd (e-mail of naam).
    /// </summary>
    public string? GevalideerdDoor { get; set; }

    /// <summary>
    /// Datum waarop de medewerkergegevens zijn gevalideerd.
    /// </summary>
    public DateTime? ValidatieDatum { get; set; }

    /// <summary>
    /// URL naar profielfoto (bijv. vanuit Graph API of lokaal opgeslagen).
    /// </summary>
    public string? PhotoUrl { get; set; }

    /// <summary>
    /// Foreign key naar de dienst (DistributionGroup) waar deze medewerker primair onder valt.
    /// Nullable omdat niet elke medewerker een dienst hoeft te hebben.
    /// </summary>
    public Guid? DienstId { get; set; }

    /// <summary>
    /// Startdatum van het dienstverband.
    /// </summary>
    public DateTime? StartDatum { get; set; }

    /// <summary>
    /// Einddatum van het dienstverband (indien van toepassing, bijv. voor interim of stagiairs).
    /// </summary>
    public DateTime? EindDatum { get; set; }

    /// <summary>
    /// Telefoonnummer (vast toestel of alternatief nummer).
    /// </summary>
    public string? Telefoonnummer { get; set; }

    // Navigatie-eigenschappen

    /// <summary>
    /// De dienst (distributiegroep) waar deze medewerker primair onder valt.
    /// </summary>
    public DistributionGroup? Dienst { get; set; }

    /// <summary>
    /// Extra gegevens voor vrijwilligers (one-to-one relatie).
    /// </summary>
    public VrijwilligerDetails? VrijwilligerDetails { get; set; }

    public ICollection<EmployeeGroupMembership> GroupMemberships { get; set; } = [];
    public ICollection<ValidatieVerzoek> ValidatieVerzoeken { get; set; } = [];
}
