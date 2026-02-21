namespace DjoppieHive.Core.Entities;

/// <summary>
/// Join entity for Employee and DistributionGroup many-to-many relationship.
/// </summary>
public class EmployeeGroupMembership
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public Guid DistributionGroupId { get; set; }
    public DistributionGroup DistributionGroup { get; set; } = null!;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
