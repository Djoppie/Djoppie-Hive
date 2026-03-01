namespace DjoppieHive.Core.Entities;

/// <summary>
/// Configureerbare mapping tussen functietitels en rollen.
/// Maakt automatische roltoewijzing mogelijk op basis van JobTitle uit Entra ID.
/// </summary>
public class JobTitleRoleMapping
{
    public Guid Id { get; set; }

    /// <summary>
    /// Het patroon om te matchen tegen Employee.JobTitle.
    /// Kan exact zijn of een deel van de titel (case-insensitive).
    /// Voorbeelden: "Sectormanager", "Teamcoach", "Diensthoofd"
    /// </summary>
    public string JobTitlePattern { get; set; } = string.Empty;

    /// <summary>
    /// Of het patroon exact moet matchen (true) of contained mag zijn (false).
    /// Exact: "Sectormanager" matcht alleen "Sectormanager"
    /// Contains: "Sectormanager" matcht ook "Senior Sectormanager"
    /// </summary>
    public bool ExactMatch { get; set; } = false;

    /// <summary>
    /// De rol die wordt toegekend bij een match.
    /// Moet een geldige rol zijn: ict_super_admin, hr_admin, sectormanager, diensthoofd, medewerker
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Hoe de scope (Sector/Dienst) wordt bepaald bij roltoewijzing.
    /// </summary>
    public ScopeDeterminationType ScopeDetermination { get; set; } = ScopeDeterminationType.None;

    /// <summary>
    /// Prioriteit voor matching (hogere waarde = hogere prioriteit).
    /// Wordt gebruikt wanneer meerdere patronen matchen.
    /// </summary>
    public int Priority { get; set; } = 0;

    /// <summary>
    /// Of deze mapping actief is.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Optionele beschrijving of notities over deze mapping.
    /// </summary>
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

/// <summary>
/// Bepaalt hoe de scope (Sector/Dienst) wordt afgeleid bij automatische roltoewijzing.
/// </summary>
public enum ScopeDeterminationType
{
    /// <summary>
    /// Geen scope bepaling - rol geldt globaal (bijv. hr_admin, ict_super_admin).
    /// </summary>
    None = 0,

    /// <summary>
    /// Scope wordt bepaald op basis van de sector waar de medewerker lid van is.
    /// Zoekt naar MG-SECTOR-* groepen in de groepslidmaatschappen.
    /// </summary>
    FromSectorMembership = 1,

    /// <summary>
    /// Scope wordt bepaald op basis van de dienst waar de medewerker lid van is.
    /// Gebruikt Employee.DienstId of zoekt naar MG-* (niet-sector) groepen.
    /// </summary>
    FromDienstMembership = 2,

    /// <summary>
    /// Scope wordt bepaald op basis van Employee.DienstId (primaire dienst).
    /// </summary>
    FromPrimaryDienst = 3
}
