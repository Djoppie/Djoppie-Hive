namespace DjoppieHive.Core.Entities;

/// <summary>
/// Lokale groep met handmatig beheerde leden.
/// Bestaat alleen in Hive, niet in Exchange/Entra ID.
/// Geschikt voor specifieke lijsten zoals "Politie", "Externen", "Projectgroep X".
/// </summary>
public class LocalGroup
{
    /// <summary>
    /// Unieke identifier voor de lokale groep.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Weergavenaam van de groep (bijv. "Politie Diepenbeek").
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

    /// <summary>
    /// Navigatie property naar de groepsleden.
    /// </summary>
    public ICollection<LocalGroupMember> Members { get; set; } = [];
}
