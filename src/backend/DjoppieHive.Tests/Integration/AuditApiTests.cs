using DjoppieHive.Core.Entities;
using DjoppieHive.Core.Enums;
using FluentAssertions;
using System.Net;
using System.Net.Http.Json;

namespace DjoppieHive.Tests.Integration;

/// <summary>
/// Integration tests for the Audit API endpoints.
/// </summary>
public class AuditApiTests : IAsyncLifetime
{
    private CustomWebApplicationFactory _factory = null!;
    private HttpClient _client = null!;

    public async Task InitializeAsync()
    {
        _factory = new CustomWebApplicationFactory();
        _client = _factory.CreateClient();
        await _factory.ResetDatabaseAsync();
        await SeedTestAuditLogsAsync();
    }

    public async Task DisposeAsync()
    {
        _client?.Dispose();
        await _factory.DisposeAsync();
    }

    private async Task SeedTestAuditLogsAsync()
    {
        await _factory.SeedDatabaseAsync(context =>
        {
            var logs = new List<AuditLog>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Action = AuditAction.Create,
                    EntityType = AuditEntityType.Employee,
                    EntityId = Guid.NewGuid(),
                    EntityDescription = "Jan Janssen",
                    UserId = "test-user-id",
                    UserEmail = "test@diepenbeek.be",
                    UserDisplayName = "Test User",
                    Timestamp = DateTime.UtcNow.AddHours(-1),
                    IpAddress = "127.0.0.1"
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Action = AuditAction.Update,
                    EntityType = AuditEntityType.Employee,
                    EntityId = Guid.NewGuid(),
                    EntityDescription = "Piet Pietersen",
                    UserId = "test-user-id",
                    UserEmail = "test@diepenbeek.be",
                    UserDisplayName = "Test User",
                    Timestamp = DateTime.UtcNow,
                    IpAddress = "127.0.0.1"
                }
            };

            context.AuditLogs.AddRange(logs);
        });
    }

    #region GET /api/audit Tests

    [Fact]
    public async Task GetAuditLogs_ReturnsOk_WhenAdminUser()
    {
        // Arrange - only admin can view audit logs
        _factory.TestUserRoles = new List<string> { "ict_super_admin" };

        // Act
        var response = await _client.GetAsync("/api/audit");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_ReturnsForbidden_WhenNotAdmin()
    {
        // Arrange - non-admin user
        _factory.TestUserRoles = new List<string> { "medewerker" };

        // Act
        var response = await _client.GetAsync("/api/audit");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetAuditLogs_SupportsFiltering_ByAction()
    {
        // Arrange
        _factory.TestUserRoles = new List<string> { "ict_super_admin" };

        // Act
        var response = await _client.GetAsync("/api/audit?action=Create");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_SupportsFiltering_ByEntityType()
    {
        // Arrange
        _factory.TestUserRoles = new List<string> { "ict_super_admin" };

        // Act
        var response = await _client.GetAsync("/api/audit?entityType=Employee");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_SupportsPagination()
    {
        // Arrange
        _factory.TestUserRoles = new List<string> { "ict_super_admin" };

        // Act
        var response = await _client.GetAsync("/api/audit?pageNumber=1&pageSize=10");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion
}
