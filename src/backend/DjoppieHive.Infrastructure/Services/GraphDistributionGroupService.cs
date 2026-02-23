using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Implementation of IDistributionGroupService using Microsoft Graph API.
/// Manages MG- distribution groups in Entra ID.
/// </summary>
public class GraphDistributionGroupService : IDistributionGroupService
{
    private readonly GraphServiceClient _graphClient;
    private readonly ILogger<GraphDistributionGroupService> _logger;
    private const string MgGroupPrefix = "MG-";
    private const string MgSectorPrefix = "MG-SECTOR-";
    private const string RootGroupName = "MG-iedereenpersoneel";

    public GraphDistributionGroupService(
        GraphServiceClient graphClient,
        ILogger<GraphDistributionGroupService> logger)
    {
        _graphClient = graphClient;
        _logger = logger;
    }

    /// <summary>
    /// Gets the complete organizational hierarchy starting from MG-iedereenpersoneel.
    /// </summary>
    public async Task<OrganizationHierarchyDto?> GetOrganizationHierarchyAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Fetching organization hierarchy from {RootGroup}", RootGroupName);

            // Step 1: Find the root group (MG-iedereenpersoneel)
            var rootGroups = await _graphClient.Groups
                .GetAsync(config =>
                {
                    config.QueryParameters.Filter = $"displayName eq '{RootGroupName}'";
                    config.QueryParameters.Select = ["id", "displayName", "description", "mail"];
                }, cancellationToken);

            var rootGroup = rootGroups?.Value?.FirstOrDefault();
            if (rootGroup == null)
            {
                _logger.LogWarning("Root group {RootGroup} not found in Entra ID", RootGroupName);
                return null;
            }

            _logger.LogInformation("Found root group {RootGroup} with ID {RootGroupId}", RootGroupName, rootGroup.Id);

            // Step 2: Get all members of root group (should be MG-SECTOR-* groups)
            var rootMembers = await _graphClient.Groups[rootGroup.Id].Members
                .GetAsync(config =>
                {
                    config.QueryParameters.Select = ["id", "displayName", "description", "mail"];
                }, cancellationToken);

            var sectors = new List<SectorDto>();
            var totalDiensten = 0;
            var totalMedewerkers = 0;

            if (rootMembers?.Value != null)
            {
                // Filter for sector groups only
                var sectorGroups = rootMembers.Value
                    .OfType<Group>()
                    .Where(g => g.DisplayName?.StartsWith(MgSectorPrefix) == true)
                    .OrderBy(g => g.DisplayName)
                    .ToList();

                _logger.LogInformation("Found {SectorCount} sector groups in {RootGroup}", sectorGroups.Count, RootGroupName);

                // Step 3: Process each sector
                foreach (var sectorGroup in sectorGroups)
                {
                    var sector = await GetSectorWithDienstenAsync(sectorGroup, cancellationToken);
                    if (sector != null)
                    {
                        sectors.Add(sector);
                        totalDiensten += sector.Diensten.Count;
                        totalMedewerkers += sector.TotalMedewerkers;
                    }
                }
            }

            return new OrganizationHierarchyDto(
                RootGroupId: rootGroup.Id!,
                RootGroupName: rootGroup.DisplayName ?? RootGroupName,
                Sectors: sectors,
                TotalSectors: sectors.Count,
                TotalDiensten: totalDiensten,
                TotalMedewerkers: totalMedewerkers
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching organization hierarchy from {RootGroup}", RootGroupName);
            throw;
        }
    }

    /// <summary>
    /// Gets a sector with its sector manager and all diensten with their members.
    /// </summary>
    private async Task<SectorDto?> GetSectorWithDienstenAsync(Group sectorGroup, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogDebug("Processing sector {SectorName}", sectorGroup.DisplayName);

            // Get all members of the sector (diensten as groups + sector manager as user)
            var sectorMembers = await _graphClient.Groups[sectorGroup.Id].Members
                .GetAsync(config =>
                {
                    config.QueryParameters.Select = ["id", "displayName", "description", "mail", "jobTitle"];
                }, cancellationToken);

            EmployeeSummaryDto? sectorManager = null;
            var diensten = new List<DienstDto>();
            var totalMedewerkers = 0;

            if (sectorMembers?.Value != null)
            {
                // Find the sector manager (user member of sector, not in a dienst)
                var userMembers = sectorMembers.Value.OfType<User>().ToList();
                if (userMembers.Count > 0)
                {
                    var manager = userMembers.First();
                    sectorManager = new EmployeeSummaryDto(
                        manager.Id!,
                        manager.DisplayName ?? string.Empty,
                        manager.Mail ?? string.Empty,
                        manager.JobTitle,
                        EmployeeType: "Personeel",
                        ArbeidsRegime: "Voltijds",
                        IsActive: true,
                        DienstNaam: sectorGroup.DisplayName
                    );
                    _logger.LogDebug("Found sector manager {ManagerName} for {SectorName}",
                        manager.DisplayName, sectorGroup.DisplayName);
                }

                // Process diensten (group members that are MG-* but not MG-SECTOR-*)
                var dienstGroups = sectorMembers.Value
                    .OfType<Group>()
                    .Where(g => g.DisplayName?.StartsWith(MgGroupPrefix) == true &&
                               !g.DisplayName.StartsWith(MgSectorPrefix))
                    .OrderBy(g => g.DisplayName)
                    .ToList();

                foreach (var dienstGroup in dienstGroups)
                {
                    var dienst = await GetDienstWithMedewerkersAsync(dienstGroup, sectorGroup.DisplayName, cancellationToken);
                    if (dienst != null)
                    {
                        diensten.Add(dienst);
                        totalMedewerkers += dienst.MemberCount;
                    }
                }
            }

            return new SectorDto(
                Id: sectorGroup.Id!,
                DisplayName: sectorGroup.DisplayName ?? string.Empty,
                Description: sectorGroup.Description,
                Email: sectorGroup.Mail,
                SectorManager: sectorManager,
                Diensten: diensten,
                TotalMedewerkers: totalMedewerkers
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing sector {SectorName}", sectorGroup.DisplayName);
            return null;
        }
    }

    /// <summary>
    /// Gets a dienst with all its medewerkers.
    /// </summary>
    private async Task<DienstDto?> GetDienstWithMedewerkersAsync(Group dienstGroup, string? sectorName, CancellationToken cancellationToken)
    {
        try
        {
            var members = await _graphClient.Groups[dienstGroup.Id].Members
                .GetAsync(config =>
                {
                    config.QueryParameters.Select = ["id", "displayName", "mail", "jobTitle"];
                }, cancellationToken);

            var medewerkers = new List<EmployeeSummaryDto>();

            if (members?.Value != null)
            {
                foreach (var member in members.Value.OfType<User>())
                {
                    medewerkers.Add(new EmployeeSummaryDto(
                        member.Id!,
                        member.DisplayName ?? string.Empty,
                        member.Mail ?? string.Empty,
                        member.JobTitle,
                        EmployeeType: "Personeel",
                        ArbeidsRegime: "Voltijds",
                        IsActive: true,
                        DienstNaam: dienstGroup.DisplayName
                    ));
                }
            }

            _logger.LogDebug("Found {MemberCount} medewerkers in dienst {DienstName}",
                medewerkers.Count, dienstGroup.DisplayName);

            return new DienstDto(
                Id: dienstGroup.Id!,
                DisplayName: dienstGroup.DisplayName ?? string.Empty,
                Description: dienstGroup.Description,
                Email: dienstGroup.Mail,
                Medewerkers: medewerkers.OrderBy(m => m.DisplayName).ToList(),
                MemberCount: medewerkers.Count
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing dienst {DienstName}", dienstGroup.DisplayName);
            return null;
        }
    }

    public async Task<IEnumerable<DistributionGroupDto>> GetAllGroupsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var groups = await _graphClient.Groups
                .GetAsync(config =>
                {
                    config.QueryParameters.Filter = $"startsWith(displayName, '{MgGroupPrefix}')";
                    config.QueryParameters.Select = ["id", "displayName", "description", "mail"];
                    // Note: $orderby is not supported with startsWith filter, sorting done in memory
                }, cancellationToken);

            var result = new List<DistributionGroupDto>();

            if (groups?.Value != null)
            {
                // Sort in memory since Graph API doesn't support orderby with startsWith
                foreach (var group in groups.Value.OrderBy(g => g.DisplayName))
                {
                    var memberCount = await GetMemberCountAsync(group.Id!, cancellationToken);
                    result.Add(new DistributionGroupDto(
                        group.Id!,
                        group.DisplayName ?? string.Empty,
                        group.Description,
                        group.Mail ?? string.Empty,
                        memberCount
                    ));
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching MG- distribution groups from Graph API");
            throw;
        }
    }

    public async Task<DistributionGroupDetailDto?> GetGroupByIdAsync(string groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await _graphClient.Groups[groupId]
                .GetAsync(config =>
                {
                    config.QueryParameters.Select = ["id", "displayName", "description", "mail"];
                }, cancellationToken);

            if (group == null || !group.DisplayName?.StartsWith(MgGroupPrefix) == true)
            {
                return null;
            }

            // Fetch members, owners, and nested groups in parallel
            var membersTask = GetGroupMembersAsync(groupId, cancellationToken);
            var ownersTask = GetGroupOwnersAsync(groupId, cancellationToken);
            var nestedGroupsTask = GetNestedGroupsAsync(groupId, cancellationToken);

            await Task.WhenAll(membersTask, ownersTask, nestedGroupsTask);

            var members = await membersTask;
            var owners = await ownersTask;
            var nestedGroups = await nestedGroupsTask;

            return new DistributionGroupDetailDto(
                group.Id!,
                group.DisplayName ?? string.Empty,
                group.Description,
                group.Mail ?? string.Empty,
                members.Count(),
                members.ToList(),
                owners.ToList(),
                nestedGroups.ToList()
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching group {GroupId} from Graph API", groupId);
            throw;
        }
    }

    public async Task<IEnumerable<EmployeeSummaryDto>> GetGroupMembersAsync(string groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var members = await _graphClient.Groups[groupId].Members
                .GetAsync(config =>
                {
                    config.QueryParameters.Select = ["id", "displayName", "mail", "jobTitle"];
                }, cancellationToken);

            var result = new List<EmployeeSummaryDto>();

            if (members?.Value != null)
            {
                foreach (var member in members.Value.OfType<User>())
                {
                    result.Add(new EmployeeSummaryDto(
                        member.Id!,
                        member.DisplayName ?? string.Empty,
                        member.Mail ?? string.Empty,
                        member.JobTitle,
                        EmployeeType: "Personeel",
                        ArbeidsRegime: "Voltijds",
                        IsActive: true,
                        DienstNaam: null
                    ));
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching members of group {GroupId}", groupId);
            throw;
        }
    }

    public async Task<IEnumerable<EmployeeSummaryDto>> GetGroupOwnersAsync(string groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var owners = await _graphClient.Groups[groupId].Owners
                .GetAsync(config =>
                {
                    config.QueryParameters.Select = ["id", "displayName", "mail", "jobTitle"];
                }, cancellationToken);

            var result = new List<EmployeeSummaryDto>();

            if (owners?.Value != null)
            {
                foreach (var owner in owners.Value.OfType<User>())
                {
                    result.Add(new EmployeeSummaryDto(
                        owner.Id!,
                        owner.DisplayName ?? string.Empty,
                        owner.Mail ?? string.Empty,
                        owner.JobTitle,
                        EmployeeType: "Personeel",
                        ArbeidsRegime: "Voltijds",
                        IsActive: true,
                        DienstNaam: null
                    ));
                }
            }

            _logger.LogInformation("Found {OwnerCount} owners for group {GroupId}", result.Count, groupId);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching owners of group {GroupId}", groupId);
            throw;
        }
    }

    public async Task<IEnumerable<NestedGroupDto>> GetNestedGroupsAsync(string groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var members = await _graphClient.Groups[groupId].Members
                .GetAsync(config =>
                {
                    config.QueryParameters.Select = ["id", "displayName", "description", "mail"];
                }, cancellationToken);

            var result = new List<NestedGroupDto>();

            if (members?.Value != null)
            {
                // Filter for Group type members only (nested groups/diensten)
                foreach (var member in members.Value.OfType<Group>())
                {
                    var memberCount = await GetMemberCountAsync(member.Id!, cancellationToken);
                    result.Add(new NestedGroupDto(
                        member.Id!,
                        member.DisplayName ?? string.Empty,
                        member.Description,
                        member.Mail,
                        memberCount
                    ));
                }
            }

            _logger.LogInformation("Found {NestedGroupCount} nested groups in group {GroupId}", result.Count, groupId);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching nested groups of group {GroupId}", groupId);
            throw;
        }
    }

    public async Task<bool> AddMemberToGroupAsync(string groupId, string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var requestBody = new ReferenceCreate
            {
                OdataId = $"https://graph.microsoft.com/v1.0/directoryObjects/{userId}"
            };

            await _graphClient.Groups[groupId].Members.Ref
                .PostAsync(requestBody, cancellationToken: cancellationToken);

            _logger.LogInformation("Added user {UserId} to group {GroupId}", userId, groupId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding user {UserId} to group {GroupId}", userId, groupId);
            return false;
        }
    }

    public async Task<bool> RemoveMemberFromGroupAsync(string groupId, string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            await _graphClient.Groups[groupId].Members[userId].Ref
                .DeleteAsync(cancellationToken: cancellationToken);

            _logger.LogInformation("Removed user {UserId} from group {GroupId}", userId, groupId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing user {UserId} from group {GroupId}", userId, groupId);
            return false;
        }
    }

    private async Task<int> GetMemberCountAsync(string groupId, CancellationToken cancellationToken)
    {
        try
        {
            var members = await _graphClient.Groups[groupId].Members
                .GetAsync(config =>
                {
                    config.QueryParameters.Count = true;
                    config.QueryParameters.Select = ["id"];
                    config.Headers.Add("ConsistencyLevel", "eventual");
                }, cancellationToken);

            return members?.Value?.Count ?? 0;
        }
        catch
        {
            return 0;
        }
    }
}
