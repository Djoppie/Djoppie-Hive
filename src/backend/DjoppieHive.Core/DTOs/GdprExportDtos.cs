using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.DTOs;

/// <summary>
/// Complete GDPR data export for an employee.
/// Contains all personal data stored in the system per Article 15 GDPR (Right of Access).
/// </summary>
public record GdprExportDto(
    // Export metadata
    DateTime ExportedAt,
    string ExportedBy,
    string Purpose,

    // Personal data
    GdprEmployeeDataDto PersonalData,

    // Group memberships
    IReadOnlyList<GdprGroupMembershipDto> GroupMemberships,

    // Event participations
    IReadOnlyList<GdprEventParticipationDto> EventParticipations,

    // System activity (audit logs)
    IReadOnlyList<GdprAuditEntryDto> SystemActivity,

    // User roles (if any)
    IReadOnlyList<GdprUserRoleDto> Roles
);

/// <summary>
/// Employee personal data for GDPR export.
/// </summary>
public record GdprEmployeeDataDto(
    Guid Id,
    string? EntraObjectId,
    string DisplayName,
    string? FirstName,
    string? LastName,
    string? Email,
    string? PhoneNumber,
    string? JobTitle,
    string? Department,
    EmployeeType Type,
    ArbeidsRegime ArbeidsRegime,
    bool IsActive,
    GegevensBron Bron,
    string? DienstNaam,
    string? SectorNaam,
    DateTime? StartDatum,
    DateTime? EindDatum,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

/// <summary>
/// Group membership for GDPR export.
/// </summary>
public record GdprGroupMembershipDto(
    Guid GroupId,
    string GroupName,
    string GroupType,
    DateTime JoinedAt
);

/// <summary>
/// Event participation for GDPR export.
/// </summary>
public record GdprEventParticipationDto(
    Guid EventId,
    string EventTitle,
    DateTime EventDate,
    string EventStatus,
    DateTime AddedAt,
    bool EmailSent,
    DateTime? EmailSentAt
);

/// <summary>
/// Audit log entry for GDPR export.
/// </summary>
public record GdprAuditEntryDto(
    DateTime Timestamp,
    string Action,
    string EntityType,
    string? Description,
    string? PerformedBy
);

/// <summary>
/// User role assignment for GDPR export.
/// </summary>
public record GdprUserRoleDto(
    string Role,
    string? ScopeSector,
    string? ScopeDienst,
    DateTime AssignedAt,
    string? AssignedBy
);
