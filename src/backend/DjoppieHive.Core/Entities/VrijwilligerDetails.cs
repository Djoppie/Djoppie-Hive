namespace DjoppieHive.Core.Entities;

/// <summary>
/// Extra gegevens voor vrijwilligers.
/// One-to-one relatie met Employee waar EmployeeType = Vrijwilliger.
/// </summary>
public class VrijwilligerDetails
{
    /// <summary>
    /// Primary key (zelfde waarde als EmployeeId voor one-to-one relatie).
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Foreign key naar de Employee entiteit.
    /// </summary>
    public Guid EmployeeId { get; set; }

    /// <summary>
    /// Beschikbaarheid van de vrijwilliger (bijv. "Ma, Wo, Vr" of "Weekends").
    /// </summary>
    public string? Beschikbaarheid { get; set; }

    /// <summary>
    /// Specialisaties of vaardigheden van de vrijwilliger (komma-gescheiden).
    /// Bijv. "Eerste Hulp, Techniek, Evenementenbeheer".
    /// </summary>
    public string? Specialisaties { get; set; }

    /// <summary>
    /// Naam van het noodcontact.
    /// </summary>
    public string? NoodContactNaam { get; set; }

    /// <summary>
    /// Telefoonnummer van het noodcontact.
    /// </summary>
    public string? NoodContactTelefoon { get; set; }

    /// <summary>
    /// Datum waarop de VOG (Verklaring Omtrent het Gedrag) is afgegeven.
    /// </summary>
    public DateTime? VogDatum { get; set; }

    /// <summary>
    /// Datum tot wanneer de VOG geldig is.
    /// </summary>
    public DateTime? VogGeldigTot { get; set; }

    /// <summary>
    /// Algemene opmerkingen over de vrijwilliger.
    /// </summary>
    public string? Opmerkingen { get; set; }

    /// <summary>
    /// Datum waarop deze details zijn aangemaakt.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Datum van laatste wijziging.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    // Navigatie-eigenschappen

    /// <summary>
    /// De medewerker waarvoor deze vrijwilligersdetails gelden.
    /// </summary>
    public Employee Employee { get; set; } = null!;
}
