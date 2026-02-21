namespace DjoppieHive.Core.Entities;

/// <summary>
/// Represents an employee from MG- distribution groups in Entra ID.
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

    // Navigation properties
    public ICollection<EmployeeGroupMembership> GroupMemberships { get; set; } = [];
}
