using System.Security.Claims;
using System.Text.Json;
using DjoppieHive.Core.Entities;
using DjoppieHive.Core.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;

namespace DjoppieHive.Infrastructure.Data;

/// <summary>
/// EF Core interceptor dat automatisch audit logs aanmaakt bij SaveChanges.
/// </summary>
public class AuditSaveChangesInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AuditSaveChangesInterceptor> _logger;

    // Entity types die geaudit moeten worden
    private static readonly HashSet<Type> AuditedEntityTypes =
    [
        typeof(Employee),
        typeof(DistributionGroup),
        typeof(EmployeeGroupMembership),
        typeof(UserRole),
        typeof(Event),
        typeof(EventParticipant),
        typeof(ValidatieVerzoek)
    ];

    // Properties die genegeerd moeten worden bij audit (gevoelige data)
    private static readonly HashSet<string> IgnoredProperties =
    [
        "PasswordHash",
        "SecurityStamp",
        "ConcurrencyStamp"
    ];

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public AuditSaveChangesInterceptor(
        IHttpContextAccessor httpContextAccessor,
        ILogger<AuditSaveChangesInterceptor> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is null) return base.SavingChangesAsync(eventData, result, cancellationToken);

        var auditLogs = CreateAuditLogs(eventData.Context);
        if (auditLogs.Count > 0)
        {
            eventData.Context.Set<AuditLog>().AddRange(auditLogs);
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        if (eventData.Context is null) return base.SavingChanges(eventData, result);

        var auditLogs = CreateAuditLogs(eventData.Context);
        if (auditLogs.Count > 0)
        {
            eventData.Context.Set<AuditLog>().AddRange(auditLogs);
        }

        return base.SavingChanges(eventData, result);
    }

    private List<AuditLog> CreateAuditLogs(DbContext context)
    {
        var auditLogs = new List<AuditLog>();
        var entries = context.ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .Where(e => ShouldAudit(e.Entity.GetType()))
            .ToList();

        if (entries.Count == 0) return auditLogs;

        var (userId, userEmail, userDisplayName) = GetCurrentUserInfo();
        var httpContext = _httpContextAccessor.HttpContext;
        var ipAddress = GetClientIpAddress(httpContext);
        var userAgent = httpContext?.Request.Headers["User-Agent"].ToString();
        var correlationId = httpContext?.TraceIdentifier;

        foreach (var entry in entries)
        {
            try
            {
                var auditLog = CreateAuditLogEntry(
                    entry,
                    userId,
                    userEmail,
                    userDisplayName,
                    ipAddress,
                    userAgent,
                    correlationId);

                if (auditLog != null)
                {
                    auditLogs.Add(auditLog);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create audit log for entity {EntityType}", entry.Entity.GetType().Name);
            }
        }

        return auditLogs;
    }

    private AuditLog? CreateAuditLogEntry(
        EntityEntry entry,
        string? userId,
        string? userEmail,
        string? userDisplayName,
        string? ipAddress,
        string? userAgent,
        string? correlationId)
    {
        var entityType = entry.Entity.GetType();
        var action = entry.State switch
        {
            EntityState.Added => AuditAction.Create,
            EntityState.Modified => AuditAction.Update,
            EntityState.Deleted => AuditAction.Delete,
            _ => (AuditAction?)null
        };

        if (action == null) return null;

        var auditEntityType = GetAuditEntityType(entityType);
        var entityId = GetEntityId(entry);
        var entityDescription = GetEntityDescription(entry);

        string? oldValues = null;
        string? newValues = null;

        switch (entry.State)
        {
            case EntityState.Added:
                newValues = SerializeProperties(entry.Properties
                    .Where(p => p.CurrentValue != null && !IgnoredProperties.Contains(p.Metadata.Name))
                    .ToDictionary(p => p.Metadata.Name, p => p.CurrentValue));
                break;

            case EntityState.Modified:
                var changedProperties = entry.Properties
                    .Where(p => p.IsModified && !IgnoredProperties.Contains(p.Metadata.Name))
                    .ToList();

                if (changedProperties.Count == 0) return null;

                oldValues = SerializeProperties(changedProperties
                    .ToDictionary(p => p.Metadata.Name, p => p.OriginalValue));
                newValues = SerializeProperties(changedProperties
                    .ToDictionary(p => p.Metadata.Name, p => p.CurrentValue));
                break;

            case EntityState.Deleted:
                oldValues = SerializeProperties(entry.Properties
                    .Where(p => p.OriginalValue != null && !IgnoredProperties.Contains(p.Metadata.Name))
                    .ToDictionary(p => p.Metadata.Name, p => p.OriginalValue));
                break;
        }

        return new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            UserEmail = userEmail,
            UserDisplayName = userDisplayName,
            Action = action.Value,
            EntityType = auditEntityType,
            EntityId = entityId,
            EntityDescription = entityDescription,
            OldValues = oldValues,
            NewValues = newValues,
            Timestamp = DateTime.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            CorrelationId = correlationId
        };
    }

    private static bool ShouldAudit(Type entityType)
    {
        // Don't audit AuditLog itself to prevent infinite recursion
        if (entityType == typeof(AuditLog)) return false;

        // Don't audit SyncLogboek (has its own logging)
        if (entityType == typeof(SyncLogboek)) return false;

        return AuditedEntityTypes.Contains(entityType);
    }

    private static AuditEntityType GetAuditEntityType(Type entityType)
    {
        return entityType.Name switch
        {
            nameof(Employee) => AuditEntityType.Employee,
            nameof(DistributionGroup) => AuditEntityType.DistributionGroup,
            nameof(EmployeeGroupMembership) => AuditEntityType.EmployeeGroupMembership,
            nameof(UserRole) => AuditEntityType.UserRole,
            nameof(Event) => AuditEntityType.Event,
            nameof(EventParticipant) => AuditEntityType.EventParticipant,
            nameof(ValidatieVerzoek) => AuditEntityType.ValidatieVerzoek,
            _ => AuditEntityType.System
        };
    }

    private static Guid? GetEntityId(EntityEntry entry)
    {
        var idProperty = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "Id");
        if (idProperty?.CurrentValue is Guid guidId)
        {
            return guidId;
        }

        // For composite keys (like EmployeeGroupMembership), return null
        return null;
    }

    private static string? GetEntityDescription(EntityEntry entry)
    {
        // Try to get a descriptive name for the entity
        var entity = entry.Entity;

        return entity switch
        {
            Employee e => e.DisplayName,
            DistributionGroup g => g.DisplayName,
            UserRole r => $"{r.DisplayName} ({r.Role})",
            Event ev => ev.Titel,
            _ => null
        };
    }

    private static string? SerializeProperties(Dictionary<string, object?> properties)
    {
        if (properties.Count == 0) return null;
        return JsonSerializer.Serialize(properties, JsonOptions);
    }

    private (string? UserId, string? UserEmail, string? UserDisplayName) GetCurrentUserInfo()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.User?.Identity?.IsAuthenticated != true)
        {
            return (null, null, "System");
        }

        var claims = httpContext.User.Claims;

        var userId = claims.FirstOrDefault(c => c.Type == "oid" || c.Type == ClaimTypes.NameIdentifier)?.Value;
        var userEmail = claims.FirstOrDefault(c => c.Type == "preferred_username" || c.Type == ClaimTypes.Email)?.Value;
        var userDisplayName = claims.FirstOrDefault(c => c.Type == "name" || c.Type == ClaimTypes.Name)?.Value;

        return (userId, userEmail, userDisplayName);
    }

    private static string? GetClientIpAddress(HttpContext? httpContext)
    {
        if (httpContext == null) return null;

        var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',').First().Trim();
        }

        return httpContext.Connection.RemoteIpAddress?.ToString();
    }
}
