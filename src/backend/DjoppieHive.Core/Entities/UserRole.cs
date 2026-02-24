namespace DjoppieHive.Core.Entities;

/// <summary>
/// Representeert een roltoewijzing voor een gebruiker in Djoppie-Hive.
/// Rollen worden lokaal beheerd en bepalen de toegangsrechten in de applicatie.
/// </summary>
public class UserRole
{
    public Guid Id { get; set; }

    /// <summary>
    /// Het Entra ID object ID van de gebruiker.
    /// </summary>
    public string EntraObjectId { get; set; } = string.Empty;

    /// <summary>
    /// De email van de gebruiker (voor display doeleinden).
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// De display naam van de gebruiker.
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// De toegewezen rol.
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Optionele sector ID voor scope-beperkte rollen (sectormanager).
    /// </summary>
    public Guid? SectorId { get; set; }

    /// <summary>
    /// Optionele dienst ID voor scope-beperkte rollen (diensthoofd).
    /// </summary>
    public Guid? DienstId { get; set; }

    /// <summary>
    /// Wanneer de rol is toegewezen.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Wie de rol heeft toegewezen.
    /// </summary>
    public string? CreatedBy { get; set; }

    /// <summary>
    /// Wanneer de rol voor het laatst is gewijzigd.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Wie de rol voor het laatst heeft gewijzigd.
    /// </summary>
    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Of de rol actief is.
    /// </summary>
    public bool IsActive { get; set; } = true;

    // Navigatie-eigenschappen

    /// <summary>
    /// De sector waar deze rol op van toepassing is (optioneel).
    /// </summary>
    public DistributionGroup? Sector { get; set; }

    /// <summary>
    /// De dienst waar deze rol op van toepassing is (optioneel).
    /// </summary>
    public DistributionGroup? Dienst { get; set; }
}
