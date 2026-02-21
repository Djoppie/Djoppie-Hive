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
    List<EmployeeSummaryDto> Members
);
