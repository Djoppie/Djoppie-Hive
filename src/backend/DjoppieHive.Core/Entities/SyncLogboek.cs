using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.Entities;

/// <summary>
/// Representeert een logboekvermelding van een synchronisatieoperatie.
/// Houdt de uitvoering en resultaten van Microsoft Graph sync operaties bij.
/// </summary>
public class SyncLogboek
{
    public Guid Id { get; set; }

    /// <summary>
    /// Wanneer de synchronisatie is gestart.
    /// </summary>
    public DateTime GeStartOp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Wanneer de synchronisatie is voltooid (null indien nog bezig).
    /// </summary>
    public DateTime? VoltooidOp { get; set; }

    /// <summary>
    /// Huidige status van de synchronisatie.
    /// </summary>
    public SyncStatus Status { get; set; } = SyncStatus.Bezig;

    /// <summary>
    /// Gebruiker die de synchronisatie heeft gestart (e-mail of ID).
    /// </summary>
    public string? GestartDoor { get; set; }

    // Statistieken

    /// <summary>
    /// Aantal distributiegroepen verwerkt.
    /// </summary>
    public int GroepenVerwerkt { get; set; }

    /// <summary>
    /// Aantal nieuwe medewerkers toegevoegd.
    /// </summary>
    public int MedewerkersToegevoegd { get; set; }

    /// <summary>
    /// Aantal bestaande medewerkers bijgewerkt.
    /// </summary>
    public int MedewerkersBijgewerkt { get; set; }

    /// <summary>
    /// Aantal medewerkers gemarkeerd als verwijderd.
    /// </summary>
    public int MedewerkersVerwijderd { get; set; }

    /// <summary>
    /// Aantal nieuwe groepslidmaatschappen toegevoegd.
    /// </summary>
    public int LidmaatschappenToegevoegd { get; set; }

    /// <summary>
    /// Aantal groepslidmaatschappen verwijderd.
    /// </summary>
    public int LidmaatschappenVerwijderd { get; set; }

    /// <summary>
    /// Aantal validatieverzoeken aangemaakt voor teamcoach beoordeling.
    /// </summary>
    public int ValidatieVerzoekenAangemaakt { get; set; }

    // Foutafhandeling

    /// <summary>
    /// Foutmelding indien synchronisatie mislukt is.
    /// </summary>
    public string? Foutmelding { get; set; }

    /// <summary>
    /// Gedetailleerde foutinformatie (stack trace, etc.).
    /// </summary>
    public string? FoutDetails { get; set; }

    // Navigatie-eigenschappen

    /// <summary>
    /// Validatieverzoeken aangemaakt tijdens deze synchronisatie.
    /// </summary>
    public ICollection<ValidatieVerzoek> ValidatieVerzoeken { get; set; } = [];
}
