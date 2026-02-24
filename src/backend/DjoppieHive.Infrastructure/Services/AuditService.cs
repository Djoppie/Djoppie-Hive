using System.Security.Claims;
using DjoppieHive.Core.Entities;
using DjoppieHive.Core.Enums;
using DjoppieHive.Core.Interfaces;
using DjoppieHive.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Service voor het loggen van audit events voor GDPR compliance.
/// </summary>
public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AuditService> _logger;

    public AuditService(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor,
        ILogger<AuditService> logger)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task LogAsync(
        AuditAction action,
        AuditEntityType entityType,
        Guid? entityId = null,
        string? entityDescription = null,
        string? oldValues = null,
        string? newValues = null,
        string? additionalInfo = null,
        CancellationToken cancellationToken = default)
    {
        var (userId, userEmail, userDisplayName) = GetCurrentUserInfo();

        await LogAsync(
            userId,
            userEmail,
            userDisplayName,
            action,
            entityType,
            entityId,
            entityDescription,
            oldValues,
            newValues,
            additionalInfo,
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task LogAsync(
        string? userId,
        string? userEmail,
        string? userDisplayName,
        AuditAction action,
        AuditEntityType entityType,
        Guid? entityId = null,
        string? entityDescription = null,
        string? oldValues = null,
        string? newValues = null,
        string? additionalInfo = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var httpContext = _httpContextAccessor.HttpContext;

            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                UserEmail = userEmail,
                UserDisplayName = userDisplayName,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                EntityDescription = entityDescription,
                OldValues = oldValues,
                NewValues = newValues,
                AdditionalInfo = additionalInfo,
                Timestamp = DateTime.UtcNow,
                IpAddress = GetClientIpAddress(httpContext),
                UserAgent = httpContext?.Request.Headers["User-Agent"].ToString(),
                CorrelationId = httpContext?.TraceIdentifier
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogDebug(
                "Audit log created: {Action} on {EntityType} by {UserEmail}",
                action, entityType, userEmail);
        }
        catch (Exception ex)
        {
            // Log error but don't fail the main operation
            _logger.LogError(ex, "Failed to create audit log for {Action} on {EntityType}", action, entityType);
        }
    }

    /// <inheritdoc />
    public async Task<IEnumerable<AuditLog>> GetLogsAsync(
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? userId = null,
        AuditAction? action = null,
        AuditEntityType? entityType = null,
        Guid? entityId = null,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = BuildFilteredQuery(fromDate, toDate, userId, action, entityType, entityId);

        return await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<int> GetLogsCountAsync(
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? userId = null,
        AuditAction? action = null,
        AuditEntityType? entityType = null,
        Guid? entityId = null,
        CancellationToken cancellationToken = default)
    {
        var query = BuildFilteredQuery(fromDate, toDate, userId, action, entityType, entityId);
        return await query.CountAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<AuditLog>> GetEntityHistoryAsync(
        AuditEntityType entityType,
        Guid entityId,
        CancellationToken cancellationToken = default)
    {
        return await _context.AuditLogs
            .Where(a => a.EntityType == entityType && a.EntityId == entityId)
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<AuditLog> BuildFilteredQuery(
        DateTime? fromDate,
        DateTime? toDate,
        string? userId,
        AuditAction? action,
        AuditEntityType? entityType,
        Guid? entityId)
    {
        var query = _context.AuditLogs.AsQueryable();

        if (fromDate.HasValue)
        {
            query = query.Where(a => a.Timestamp >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(a => a.Timestamp <= toDate.Value);
        }

        if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(a => a.UserId == userId);
        }

        if (action.HasValue)
        {
            query = query.Where(a => a.Action == action.Value);
        }

        if (entityType.HasValue)
        {
            query = query.Where(a => a.EntityType == entityType.Value);
        }

        if (entityId.HasValue)
        {
            query = query.Where(a => a.EntityId == entityId.Value);
        }

        return query;
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

        // Check for forwarded IP (when behind a proxy/load balancer)
        var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            // Take the first IP if there are multiple
            return forwardedFor.Split(',').First().Trim();
        }

        return httpContext.Connection.RemoteIpAddress?.ToString();
    }
}
