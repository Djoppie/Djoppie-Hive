using DjoppieHive.Core.Entities;
using DjoppieHive.Core.Enums;
using DjoppieHive.Infrastructure.Services;
using DjoppieHive.Tests.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace DjoppieHive.Tests.Services;

public class AuditServiceTests
{
    private readonly Mock<ILogger<AuditService>> _loggerMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;

    public AuditServiceTests()
    {
        _loggerMock = new Mock<ILogger<AuditService>>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        SetupHttpContext();
    }

    private void SetupHttpContext(string? userId = "test-user-id", string? email = "test@diepenbeek.be", string? name = "Test User")
    {
        var claims = new List<Claim>();
        if (userId != null) claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
        if (email != null) claims.Add(new Claim(ClaimTypes.Email, email));
        if (name != null) claims.Add(new Claim("name", name));

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext
        {
            User = principal,
            Connection =
            {
                RemoteIpAddress = System.Net.IPAddress.Parse("192.168.1.1")
            }
        };
        httpContext.Request.Headers["User-Agent"] = "TestBrowser/1.0";

        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(httpContext);
    }

    #region LogAsync Tests

    [Fact]
    public async Task LogAsync_CreatesAuditLog_WithCorrectData()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var service = new AuditService(context, _httpContextAccessorMock.Object, _loggerMock.Object);

        // Act
        await service.LogAsync(
            AuditAction.Create,
            AuditEntityType.Employee,
            Guid.NewGuid(),
            "Jan Janssen",
            null,
            "{\"name\": \"Jan Janssen\"}",
            "Employee created");

        // Assert
        var logs = context.AuditLogs.ToList();
        logs.Should().HaveCount(1);

        var log = logs.First();
        log.Action.Should().Be(AuditAction.Create);
        log.EntityType.Should().Be(AuditEntityType.Employee);
        log.EntityDescription.Should().Be("Jan Janssen");
        log.NewValues.Should().Be("{\"name\": \"Jan Janssen\"}");
        log.UserId.Should().Be("test-user-id");
        log.UserEmail.Should().Be("test@diepenbeek.be");
        log.UserDisplayName.Should().Be("Test User");
        log.IpAddress.Should().Be("192.168.1.1");
        log.UserAgent.Should().Be("TestBrowser/1.0");
    }

    [Fact]
    public async Task LogAsync_StoresOldAndNewValues_ForUpdateAction()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var service = new AuditService(context, _httpContextAccessorMock.Object, _loggerMock.Object);

        var oldValues = "{\"name\": \"Old Name\"}";
        var newValues = "{\"name\": \"New Name\"}";

        // Act
        await service.LogAsync(
            AuditAction.Update,
            AuditEntityType.Employee,
            Guid.NewGuid(),
            "Employee Update",
            oldValues,
            newValues);

        // Assert
        var log = context.AuditLogs.First();
        log.OldValues.Should().Be(oldValues);
        log.NewValues.Should().Be(newValues);
    }

    [Fact]
    public async Task LogAsync_HandlesNullHttpContext()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var nullContextAccessor = new Mock<IHttpContextAccessor>();
        nullContextAccessor.Setup(x => x.HttpContext).Returns((HttpContext?)null);

        var service = new AuditService(context, nullContextAccessor.Object, _loggerMock.Object);

        // Act
        await service.LogAsync(
            AuditAction.Create,
            AuditEntityType.System,
            null,
            "System action");

        // Assert
        var log = context.AuditLogs.First();
        log.UserId.Should().BeNull();
        log.UserEmail.Should().BeNull();
        log.IpAddress.Should().BeNull();
    }

    #endregion

    #region GetLogsAsync Tests

    [Fact]
    public async Task GetLogsAsync_ReturnsPagedResults()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        await SeedAuditLogs(context, 25);
        var service = new AuditService(context, _httpContextAccessorMock.Object, _loggerMock.Object);

        // Act
        var result = await service.GetLogsAsync(pageNumber: 1, pageSize: 10);

        // Assert
        result.Should().HaveCount(10);
    }

    [Fact]
    public async Task GetLogsAsync_FiltersByAction()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        await SeedAuditLogs(context, 10, AuditAction.Create);
        await SeedAuditLogs(context, 5, AuditAction.Update);
        var service = new AuditService(context, _httpContextAccessorMock.Object, _loggerMock.Object);

        // Act
        var result = await service.GetLogsAsync(action: AuditAction.Update);

        // Assert
        result.Should().HaveCount(5);
        result.Should().OnlyContain(l => l.Action == AuditAction.Update);
    }

    [Fact]
    public async Task GetLogsAsync_FiltersByDateRange()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();

        // Add logs with different timestamps
        var yesterday = DateTime.UtcNow.AddDays(-1);
        var today = DateTime.UtcNow;

        context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = AuditAction.Create,
            EntityType = AuditEntityType.Employee,
            Timestamp = yesterday
        });
        context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = AuditAction.Create,
            EntityType = AuditEntityType.Employee,
            Timestamp = today
        });
        await context.SaveChangesAsync();

        var service = new AuditService(context, _httpContextAccessorMock.Object, _loggerMock.Object);

        // Act
        var result = await service.GetLogsAsync(fromDate: today.Date, toDate: today.Date.AddDays(1));

        // Assert
        result.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetLogsAsync_FiltersByEntityType()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();

        context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = AuditAction.Create,
            EntityType = AuditEntityType.Employee,
            Timestamp = DateTime.UtcNow
        });
        context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = AuditAction.Create,
            EntityType = AuditEntityType.DistributionGroup,
            Timestamp = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var service = new AuditService(context, _httpContextAccessorMock.Object, _loggerMock.Object);

        // Act
        var result = await service.GetLogsAsync(entityType: AuditEntityType.DistributionGroup);

        // Assert
        result.Should().HaveCount(1);
        result.First().EntityType.Should().Be(AuditEntityType.DistributionGroup);
    }

    [Fact]
    public async Task GetLogsAsync_ReturnsOrderedByTimestampDescending()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();

        var oldLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = AuditAction.Create,
            EntityType = AuditEntityType.Employee,
            EntityDescription = "Old",
            Timestamp = DateTime.UtcNow.AddHours(-2)
        };
        var newLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = AuditAction.Create,
            EntityType = AuditEntityType.Employee,
            EntityDescription = "New",
            Timestamp = DateTime.UtcNow
        };

        context.AuditLogs.AddRange(oldLog, newLog);
        await context.SaveChangesAsync();

        var service = new AuditService(context, _httpContextAccessorMock.Object, _loggerMock.Object);

        // Act
        var result = await service.GetLogsAsync();

        // Assert
        result.First().EntityDescription.Should().Be("New");
        result.Last().EntityDescription.Should().Be("Old");
    }

    [Fact]
    public async Task GetLogsCountAsync_ReturnsCorrectCount()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        await SeedAuditLogs(context, 25);
        var service = new AuditService(context, _httpContextAccessorMock.Object, _loggerMock.Object);

        // Act
        var count = await service.GetLogsCountAsync();

        // Assert
        count.Should().Be(25);
    }

    #endregion

    #region Helper Methods

    private static async Task SeedAuditLogs(
        DjoppieHive.Infrastructure.Data.ApplicationDbContext context,
        int count,
        AuditAction action = AuditAction.Create)
    {
        for (int i = 0; i < count; i++)
        {
            context.AuditLogs.Add(new AuditLog
            {
                Id = Guid.NewGuid(),
                Action = action,
                EntityType = AuditEntityType.Employee,
                EntityDescription = $"Test Log {i}",
                Timestamp = DateTime.UtcNow.AddMinutes(-i)
            });
        }
        await context.SaveChangesAsync();
    }

    #endregion
}
