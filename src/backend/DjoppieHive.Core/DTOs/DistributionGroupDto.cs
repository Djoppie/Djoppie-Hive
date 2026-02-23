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

// ============================================
// HIERARCHY DTOs (MG-iedereenpersoneel structure)
// ============================================

/// <summary>
/// Complete organizational hierarchy starting from MG-iedereenpersoneel.
/// </summary>
public record OrganizationHierarchyDto(
    string RootGroupId,
    string RootGroupName,
    List<SectorDto> Sectors,
    int TotalSectors,
    int TotalDiensten,
    int TotalMedewerkers
);

/// <summary>
/// A sector (MG-SECTOR-*) with its sector manager and diensten.
/// </summary>
public record SectorDto(
    string Id,
    string DisplayName,
    string? Description,
    string? Email,
    EmployeeSummaryDto? SectorManager,
    List<DienstDto> Diensten,
    int TotalMedewerkers
);

/// <summary>
/// A dienst (MG-* service) within a sector, with its members.
/// </summary>
public record DienstDto(
    string Id,
    string DisplayName,
    string? Description,
    string? Email,
    List<EmployeeSummaryDto> Medewerkers,
    int MemberCount
);
