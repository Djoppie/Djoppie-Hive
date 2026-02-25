using DjoppieHive.Core.Entities;
using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.Interfaces;

/// <summary>
/// Service voor het loggen van audit events voor GDPR compliance.
/// </summary>
public interface IAuditService
{
    /// <summary>
    /// Log een audit event.
    /// </summary>
    Task LogAsync(
        AuditAction action,
        AuditEntityType entityType,
        Guid? entityId = null,
        string? entityDescription = null,
        string? oldValues = null,
        string? newValues = null,
        string? additionalInfo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Log een audit event met expliciete gebruikersgegevens.
    /// </summary>
    Task LogAsync(
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
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Haal audit logs op met optionele filters.
    /// </summary>
    Task<IEnumerable<AuditLog>> GetLogsAsync(
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? userId = null,
        AuditAction? action = null,
        AuditEntityType? entityType = null,
        Guid? entityId = null,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Haal het totaal aantal audit logs op met dezelfde filters.
    /// </summary>
    Task<int> GetLogsCountAsync(
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? userId = null,
        AuditAction? action = null,
        AuditEntityType? entityType = null,
        Guid? entityId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Haal alle audit logs op voor een specifieke entiteit.
    /// </summary>
    Task<IEnumerable<AuditLog>> GetEntityHistoryAsync(
        AuditEntityType entityType,
        Guid entityId,
        CancellationToken cancellationToken = default);
}
