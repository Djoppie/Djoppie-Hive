using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace DjoppieHive.Infrastructure.Services;

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
                e.Groups,
                IsActive: true, // Default for Graph API users
                Bron: "AzureAD",
                IsHandmatigToegevoegd: false,
                EmployeeType: "Personeel", // Default type
                ArbeidsRegime: "Voltijds", // Default regime
                PhotoUrl: null,
                DienstId: null,
                DienstNaam: null,
                StartDatum: null,
                EindDatum: null,
                Telefoonnummer: null,
                VrijwilligerDetails: null,
                CreatedAt: DateTime.UtcNow,
                UpdatedAt: null,
                LastSyncedAt: DateTime.UtcNow
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
                mgGroups,
                IsActive: true,
                Bron: "AzureAD",
                IsHandmatigToegevoegd: false,
                EmployeeType: "Personeel",
                ArbeidsRegime: "Voltijds",
                PhotoUrl: null,
                DienstId: null,
                DienstNaam: null,
                StartDatum: null,
                EindDatum: null,
                Telefoonnummer: null,
                VrijwilligerDetails: null,
                CreatedAt: DateTime.UtcNow,
                UpdatedAt: null,
                LastSyncedAt: DateTime.UtcNow
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
                u.JobTitle,
                EmployeeType: "Personeel",
                ArbeidsRegime: "Voltijds",
                IsActive: true,
                DienstNaam: null
            )) ?? [];
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching employees with query '{Query}'", query);
            throw;
        }
    }

    // New CRUD methods (not implemented - GraphEmployeeService is for sync only)
    public Task<IEnumerable<EmployeeDto>> GetAllAsync(EmployeeFilter? filter = null, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("GraphEmployeeService does not support database operations. Use EmployeeService instead.");
    }

    public Task<EmployeeDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("GraphEmployeeService does not support database operations. Use EmployeeService instead.");
    }

    public Task<EmployeeDto> CreateAsync(CreateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("GraphEmployeeService does not support database operations. Use EmployeeService instead.");
    }

    public Task<EmployeeDto?> UpdateAsync(Guid id, UpdateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("GraphEmployeeService does not support database operations. Use EmployeeService instead.");
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("GraphEmployeeService does not support database operations. Use EmployeeService instead.");
    }

    public Task<IEnumerable<EmployeeDto>> GetByDienstAsync(Guid dienstId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("GraphEmployeeService does not support database operations. Use EmployeeService instead.");
    }

    public Task<IEnumerable<EmployeeDto>> GetVolunteersAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("GraphEmployeeService does not support database operations. Use EmployeeService instead.");
    }
}
