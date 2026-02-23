using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Stub implementation of IDistributionGroupService when Graph API is not configured.
/// Returns empty results to allow the application to run without Graph credentials.
/// </summary>
public class StubDistributionGroupService : IDistributionGroupService
{
    public Task<IEnumerable<DistributionGroupDto>> GetAllGroupsAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Enumerable.Empty<DistributionGroupDto>());
    }

    public Task<OrganizationHierarchyDto?> GetOrganizationHierarchyAsync(CancellationToken cancellationToken = default)
    {
        // Return null when Graph API is not configured
        return Task.FromResult<OrganizationHierarchyDto?>(null);
    }

    public Task<DistributionGroupDetailDto?> GetGroupByIdAsync(string groupId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<DistributionGroupDetailDto?>(null);
    }

    public Task<IEnumerable<EmployeeSummaryDto>> GetGroupMembersAsync(string groupId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Enumerable.Empty<EmployeeSummaryDto>());
    }

    public Task<IEnumerable<EmployeeSummaryDto>> GetGroupOwnersAsync(string groupId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Enumerable.Empty<EmployeeSummaryDto>());
    }

    public Task<IEnumerable<NestedGroupDto>> GetNestedGroupsAsync(string groupId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Enumerable.Empty<NestedGroupDto>());
    }

    public Task<bool> AddMemberToGroupAsync(string groupId, string userId, CancellationToken cancellationToken = default)
    {
        throw new InvalidOperationException("Graph API is not configured. Unable to add members.");
    }

    public Task<bool> RemoveMemberFromGroupAsync(string groupId, string userId, CancellationToken cancellationToken = default)
    {
        throw new InvalidOperationException("Graph API is not configured. Unable to remove members.");
    }
}
