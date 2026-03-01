using DjoppieHive.Core.Entities;

namespace DjoppieHive.Core.DTOs;

/// <summary>
/// DTO voor het weergeven van een JobTitle-Role mapping.
/// </summary>
public record JobTitleRoleMappingDto(
    string Id,
    string JobTitlePattern,
    bool ExactMatch,
    string Role,
    string RoleDisplayName,
    ScopeDeterminationType ScopeDetermination,
    string ScopeDeterminationDisplayName,
    int Priority,
    bool IsActive,
    string? Description,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime? UpdatedAt,
    string? UpdatedBy
);

/// <summary>
/// DTO voor het aanmaken van een nieuwe mapping.
/// </summary>
public record CreateJobTitleRoleMappingDto(
    string JobTitlePattern,
    bool ExactMatch,
    string Role,
    ScopeDeterminationType ScopeDetermination,
    int Priority = 0,
    string? Description = null
);

/// <summary>
/// DTO voor het bijwerken van een mapping.
/// </summary>
public record UpdateJobTitleRoleMappingDto(
    string? JobTitlePattern = null,
    bool? ExactMatch = null,
    string? Role = null,
    ScopeDeterminationType? ScopeDetermination = null,
    int? Priority = null,
    bool? IsActive = null,
    string? Description = null
);

/// <summary>
/// Resultaat van automatische roltoewijzing voor één medewerker.
/// </summary>
public record AutoRoleAssignmentResultDto(
    string EmployeeId,
    string EmployeeDisplayName,
    string EmployeeEmail,
    string? JobTitle,
    bool RoleAssigned,
    string? AssignedRole,
    string? AssignedRoleDisplayName,
    string? ScopeType,
    string? ScopeId,
    string? ScopeName,
    string? Message
);

/// <summary>
/// Samenvatting van batch automatische roltoewijzing.
/// </summary>
public record AutoRoleAssignmentSummaryDto(
    int TotalProcessed,
    int RolesAssigned,
    int RolesSkipped,
    int Errors,
    DateTime ProcessedAt,
    string ProcessedBy,
    IEnumerable<AutoRoleAssignmentResultDto> Results
);
