namespace DjoppieHive.Core.Entities;

/// <summary>
/// Represents an MG- distribution group from Entra ID.
/// MG- groups are the source of truth for personnel management.
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

    // Navigation properties
    public ICollection<EmployeeGroupMembership> Members { get; set; } = [];
}
