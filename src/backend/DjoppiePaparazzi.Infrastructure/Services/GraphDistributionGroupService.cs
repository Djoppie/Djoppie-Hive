using DjoppiePaparazzi.Core.DTOs;
using DjoppiePaparazzi.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace DjoppiePaparazzi.Infrastructure.Services;

/// <summary>
/// Implementation of IDistributionGroupService using Microsoft Graph API.
/// Manages MG- distribution groups in Entra ID.
/// </summary>
public class GraphDistributionGroupService : IDistributionGroupService
{
    private readonly GraphServiceClient _graphClient;
    private readonly ILogger<GraphDistributionGroupService> _logger;
    private const string MgGroupPrefix = "MG-";

    public GraphDistributionGroupService(
        GraphServiceClient graphClient,
        ILogger<GraphDistributionGroupService> logger)
    {
        _graphClient = graphClient;
        _logger = logger;
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
                    config.QueryParameters.Orderby = ["displayName"];
                }, cancellationToken);

            var result = new List<DistributionGroupDto>();

            if (groups?.Value != null)
            {
                foreach (var group in groups.Value)
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

            var members = await GetGroupMembersAsync(groupId, cancellationToken);

            return new DistributionGroupDetailDto(
                group.Id!,
                group.DisplayName ?? string.Empty,
                group.Description,
                group.Mail ?? string.Empty,
                members.Count(),
                members.ToList()
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
                        member.JobTitle
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
