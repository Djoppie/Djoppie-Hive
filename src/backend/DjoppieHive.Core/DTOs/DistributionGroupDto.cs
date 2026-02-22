namespace DjoppieHive.Core.DTOs;

public record DistributionGroupDto(
    string Id,
    string DisplayName,
    string? Description,
    string Email,
    int MemberCount
);

public record DistributionGroupDetailDto(
    string Id,
    string DisplayName,
    string? Description,
    string Email,
    int MemberCount,
    List<EmployeeSummaryDto> Members,
    List<EmployeeSummaryDto> Owners,
    List<NestedGroupDto> NestedGroups
);

/// <summary>
/// Represents a nested group (dienst) within a sector group.
/// </summary>
public record NestedGroupDto(
    string Id,
    string DisplayName,
    string? Description,
    string? Email,
    int MemberCount
);
