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

    // Navigatie-eigenschappen
    public ICollection<EmployeeGroupMembership> GroupMemberships { get; set; } = [];
    public ICollection<ValidatieVerzoek> ValidatieVerzoeken { get; set; } = [];
}
