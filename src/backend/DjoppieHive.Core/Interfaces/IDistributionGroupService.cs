using DjoppieHive.Core.DTOs;

namespace DjoppieHive.Core.Interfaces;

/// <summary>
/// Service interface for managing MG- distribution groups via Microsoft Graph.
/// </summary>
public interface IDistributionGroupService
{
    /// <summary>
    /// Gets all MG- distribution groups from Entra ID.
    /// </summary>
    Task<IEnumerable<DistributionGroupDto>> GetAllGroupsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a specific distribution group by its Entra Object ID.
    /// </summary>
    Task<DistributionGroupDetailDto?> GetGroupByIdAsync(string groupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all members of a distribution group.
    /// </summary>
    Task<IEnumerable<EmployeeSummaryDto>> GetGroupMembersAsync(string groupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all owners (sector managers/teamcoaches) of a distribution group.
    /// </summary>
    Task<IEnumerable<EmployeeSummaryDto>> GetGroupOwnersAsync(string groupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all nested groups (diensten) within a sector group.
    /// Returns groups that are direct members of the specified group.
    /// </summary>
    Task<IEnumerable<NestedGroupDto>> GetNestedGroupsAsync(string groupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a member to a distribution group.
    /// </summary>
    Task<bool> AddMemberToGroupAsync(string groupId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes a member from a distribution group.
    /// </summary>
    Task<bool> RemoveMemberFromGroupAsync(string groupId, string userId, CancellationToken cancellationToken = default);
}
