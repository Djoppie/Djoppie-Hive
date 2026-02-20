using DjoppiePaparazzi.Core.DTOs;
using DjoppiePaparazzi.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace DjoppiePaparazzi.Infrastructure.Services;

/// <summary>
/// Implementation of IEmployeeService using Microsoft Graph API.
/// Retrieves employee data from Entra ID users in MG- groups.
/// </summary>
public class GraphEmployeeService : IEmployeeService
{
    private readonly GraphServiceClient _graphClient;
    private readonly ILogger<GraphEmployeeService> _logger;
    private const string MgGroupPrefix = "MG-";

    public GraphEmployeeService(
        GraphServiceClient graphClient,
        ILogger<GraphEmployeeService> logger)
    {
        _graphClient = graphClient;
        _logger = logger;
    }

    public async Task<IEnumerable<EmployeeDto>> GetAllEmployeesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            // Get all MG- groups first
            var groups = await _graphClient.Groups
                .GetAsync(config =>
                {
                    config.QueryParameters.Filter = $"startsWith(displayName, '{MgGroupPrefix}')";
                    config.QueryParameters.Select = ["id", "displayName"];
                }, cancellationToken);

            var employeeDict = new Dictionary<string, (User User, List<string> Groups)>();

            if (groups?.Value != null)
            {
                foreach (var group in groups.Value)
                {
                    var members = await _graphClient.Groups[group.Id].Members
                        .GetAsync(config =>
                        {
                            config.QueryParameters.Select = [
                                "id", "displayName", "givenName", "surname", "mail",
                                "jobTitle", "department", "officeLocation", "mobilePhone"
                            ];
                        }, cancellationToken);

                    if (members?.Value != null)
                    {
                        foreach (var member in members.Value.OfType<User>())
                        {
                            if (employeeDict.TryGetValue(member.Id!, out var existing))
                            {
                                existing.Groups.Add(group.DisplayName!);
                            }
                            else
                            {
                                employeeDict[member.Id!] = (member, [group.DisplayName!]);
                            }
                        }
                    }
                }
            }

            return employeeDict.Values.Select(e => new EmployeeDto(
                e.User.Id!,
                e.User.DisplayName ?? string.Empty,
                e.User.GivenName,
                e.User.Surname,
                e.User.Mail ?? string.Empty,
                e.User.JobTitle,
                e.User.Department,
                e.User.OfficeLocation,
                e.User.MobilePhone,
                e.Groups
            )).OrderBy(e => e.DisplayName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching employees from Graph API");
            throw;
        }
    }

    public async Task<EmployeeDto?> GetEmployeeByIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _graphClient.Users[userId]
                .GetAsync(config =>
                {
                    config.QueryParameters.Select = [
                        "id", "displayName", "givenName", "surname", "mail",
                        "jobTitle", "department", "officeLocation", "mobilePhone"
                    ];
                }, cancellationToken);

            if (user == null)
            {
                return null;
            }

            // Get user's MG- group memberships
            var memberOf = await _graphClient.Users[userId].MemberOf
                .GetAsync(config =>
                {
                    config.QueryParameters.Select = ["id", "displayName"];
                }, cancellationToken);

            var mgGroups = memberOf?.Value?
                .OfType<Group>()
                .Where(g => g.DisplayName?.StartsWith(MgGroupPrefix) == true)
                .Select(g => g.DisplayName!)
                .ToList() ?? [];

            return new EmployeeDto(
                user.Id!,
                user.DisplayName ?? string.Empty,
                user.GivenName,
                user.Surname,
                user.Mail ?? string.Empty,
                user.JobTitle,
                user.Department,
                user.OfficeLocation,
                user.MobilePhone,
                mgGroups
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching employee {UserId} from Graph API", userId);
            throw;
        }
    }

    public async Task<IEnumerable<EmployeeSummaryDto>> SearchEmployeesAsync(string query, CancellationToken cancellationToken = default)
    {
        try
        {
            var users = await _graphClient.Users
                .GetAsync(config =>
                {
                    config.QueryParameters.Search = $"\"displayName:{query}\" OR \"mail:{query}\"";
                    config.QueryParameters.Select = ["id", "displayName", "mail", "jobTitle"];
                    config.QueryParameters.Top = 25;
                    config.Headers.Add("ConsistencyLevel", "eventual");
                }, cancellationToken);

            return users?.Value?.Select(u => new EmployeeSummaryDto(
                u.Id!,
                u.DisplayName ?? string.Empty,
                u.Mail ?? string.Empty,
                u.JobTitle
            )) ?? [];
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching employees with query '{Query}'", query);
            throw;
        }
    }
}
