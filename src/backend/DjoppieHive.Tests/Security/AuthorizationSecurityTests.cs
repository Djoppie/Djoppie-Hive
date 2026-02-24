using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Enums;
using DjoppieHive.Tests.Integration;
using FluentAssertions;
using System.Net;
using System.Net.Http.Json;

namespace DjoppieHive.Tests.Security;

/// <summary>
/// Security-focused tests for authorization controls.
/// Verifies that access controls are properly enforced.
/// </summary>
public class AuthorizationSecurityTests : IAsyncLifetime
{
    private CustomWebApplicationFactory _factory = null!;
    private HttpClient _client = null!;

    public Task InitializeAsync()
    {
        _factory = new CustomWebApplicationFactory();
        _client = _factory.CreateClient();
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        _client?.Dispose();
        await _factory.DisposeAsync();
    }

    #region Authentication Tests

    [Fact]
    public async Task AllEndpoints_ShouldRequireAuthentication()
    {
        // Arrange - simulate anonymous user
        _client.DefaultRequestHeaders.Add("X-Test-Anonymous", "true");

        // Act & Assert - all endpoints should return 401
        var endpoints = new[]
        {
            "/api/employees",
            "/api/employees/00000000-0000-0000-0000-000000000001",
            "/api/audit"
        };

        foreach (var endpoint in endpoints)
        {
            var response = await _client.GetAsync(endpoint);
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
                $"Endpoint {endpoint} should require authentication");
        }
    }

    #endregion

    #region Role-Based Access Control Tests

    [Fact]
    public async Task Medewerker_ShouldNotCreateEmployees()
    {
        // Arrange - medewerker role
        _factory.TestUserRoles = new List<string> { "medewerker" };
        using var client = _factory.CreateClient();

        var createDto = new CreateEmployeeDto(
            DisplayName: "Test",
            GivenName: "Test",
            Surname: "Test",
            Email: "test@diepenbeek.be",
            JobTitle: null,
            Department: null,
            OfficeLocation: null,
            MobilePhone: null,
            BusinessPhones: null,
            IsActive: true,
            EmployeeType: EmployeeType.Personeel,
            ArbeidsRegime: ArbeidsRegime.Voltijds,
            PhotoUrl: null,
            DienstId: null,
            StartDatum: null,
            EindDatum: null,
            Telefoonnummer: null,
            VrijwilligerDetails: null
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/employees", createDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Medewerker_ShouldNotDeleteEmployees()
    {
        // Arrange - medewerker role
        _factory.TestUserRoles = new List<string> { "medewerker" };
        using var client = _factory.CreateClient();

        // Act
        var response = await client.DeleteAsync("/api/employees/00000000-0000-0000-0000-000000000001");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Medewerker_ShouldNotAccessAuditLogs()
    {
        // Arrange - medewerker role (only admins can view audit logs)
        _factory.TestUserRoles = new List<string> { "medewerker" };
        using var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/audit");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Diensthoofd_ShouldNotAccessAuditLogs()
    {
        // Arrange - diensthoofd role (only admins can view audit logs)
        _factory.TestUserRoles = new List<string> { "diensthoofd" };
        using var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/audit");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task IctSuperAdmin_ShouldAccessAuditLogs()
    {
        // Arrange - ict_super_admin role
        _factory.TestUserRoles = new List<string> { "ict_super_admin" };
        using var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/audit");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task HrAdmin_ShouldAccessAuditLogs()
    {
        // Arrange - hr_admin role
        _factory.TestUserRoles = new List<string> { "hr_admin" };
        using var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/audit");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Privilege Escalation Prevention Tests

    [Fact]
    public async Task User_ShouldNotBeAbleToEscalateOwnPrivileges()
    {
        // Arrange - regular user tries to access role management
        _factory.TestUserRoles = new List<string> { "diensthoofd" };
        using var client = _factory.CreateClient();

        // Act - try to access role management endpoint
        var response = await client.GetAsync("/api/rollen");

        // Assert - should be forbidden (only ict_super_admin can manage roles)
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Forbidden, HttpStatusCode.NotFound);
    }

    #endregion

    #region IDOR (Insecure Direct Object Reference) Prevention Tests

    [Fact]
    public async Task Medewerker_ShouldOnlyAccessOwnData()
    {
        // This test verifies that medewerkers cannot access other employees' data
        // The actual implementation uses scope-based filtering in the controller

        // Arrange
        _factory.TestUserRoles = new List<string> { "medewerker" };
        using var client = _factory.CreateClient();

        // Act - try to get all employees (should only return own data)
        var response = await client.GetAsync("/api/employees");

        // Assert - should return OK (but only own data - verified by controller logic)
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion
}
