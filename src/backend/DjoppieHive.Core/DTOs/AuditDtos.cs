namespace DjoppieHive.Core.DTOs;

/// <summary>
/// DTO voor een audit log entry.
/// </summary>
public record AuditLogDto(
    Guid Id,
    string? UserId,
    string? UserEmail,
    string? UserDisplayName,
    string Action,
    string EntityType,
    Guid? EntityId,
    string? EntityDescription,
    string? OldValues,
    string? NewValues,
    DateTime Timestamp,
    string? IpAddress,
    string? AdditionalInfo
);

/// <summary>
/// Gepagineerde response voor audit logs.
/// </summary>
public record AuditLogPagedResponse(
    IEnumerable<AuditLogDto> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int TotalPages
);

/// <summary>
/// Filter parameters voor audit logs query.
/// </summary>
public record AuditLogFilterDto
{
    public DateTime? FromDate { get; init; }
    public DateTime? ToDate { get; init; }
    public string? UserId { get; init; }
    public string? Action { get; init; }
    public string? EntityType { get; init; }
    public Guid? EntityId { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 50;
}
