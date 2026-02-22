using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.Entities;

/// <summary>
/// Representeert een MG- distributiegroep uit Entra ID.
/// MG- groepen zijn de bron van waarheid voor personeelsbeheer.
/// </summary>
public class DistributionGroup
{
    public Guid Id { get; set; }
    public string EntraObjectId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? GroupType { get; set; }
    public int MemberCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastSyncedAt { get; set; }

    // Hiërarchie ondersteuning

    /// <summary>
    /// ID van de bovenliggende groep (voor diensten onder een sector).
    /// </summary>
    public Guid? BovenliggendeGroepId { get; set; }
    
    /// <summary>
    /// Bovenliggende sectorgroep.
    /// </summary>
    public DistributionGroup? BovenliggendeGroep { get; set; }
    
    /// <summary>
    /// Onderliggende groepen (diensten binnen een sector).
    /// </summary>
    public ICollection<DistributionGroup> OnderliggendeGroepen { get; set; } = [];

    /// <summary>
    /// Niveau in de hiërarchie: Sector of Dienst.
    /// </summary>
    public GroepNiveau Niveau { get; set; } = GroepNiveau.Dienst;

    // Navigatie-eigenschappen
    public ICollection<EmployeeGroupMembership> Members { get; set; } = [];
    public ICollection<ValidatieVerzoek> ValidatieVerzoeken { get; set; } = [];
}
