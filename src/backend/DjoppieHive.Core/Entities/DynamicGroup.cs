namespace DjoppieHive.Core.Entities;

/// <summary>
/// Dynamische groep met filter-gebaseerde leden.
/// Leden worden automatisch berekend op basis van filter criteria.
/// </summary>
public class DynamicGroup
{
    /// <summary>
    /// Unieke identifier voor de dynamische groep.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Weergavenaam van de groep (bijv. "Alle Vrijwilligers").
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Optionele beschrijving van de groep.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Optioneel e-mailadres voor de groep.
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Filter criteria opgeslagen als JSON.
    /// Bevat EmployeeTypes, ArbeidsRegimes, AlleenActief, DienstIds, SectorIds.
    /// </summary>
    public string FilterCriteria { get; set; } = "{}";

    /// <summary>
    /// Gecached aantal leden (bijgewerkt bij elke evaluatie).
    /// </summary>
    public int CachedMemberCount { get; set; }

    /// <summary>
    /// Wanneer de leden voor het laatst berekend zijn.
    /// </summary>
    public DateTime? LastEvaluatedAt { get; set; }

    /// <summary>
    /// Of dit een systeemgroep is die niet verwijderd kan worden.
    /// Voorgedefinieerde groepen zoals "Alle Vrijwilligers" zijn systeemgroepen.
    /// </summary>
    public bool IsSystemGroup { get; set; }

    /// <summary>
    /// Aanmaakdatum van de groep.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Laatst bijgewerkt.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Gebruiker die de groep heeft aangemaakt.
    /// </summary>
    public string? CreatedBy { get; set; }
}
