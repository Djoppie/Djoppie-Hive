namespace DjoppieHive.Core.DTOs;

public record EmployeeDto(
    string Id,
    string DisplayName,
    string? GivenName,
    string? Surname,
    string Email,
    string? JobTitle,
    string? Department,
    string? OfficeLocation,
    string? MobilePhone,
    List<string> Groups
);

public record EmployeeSummaryDto(
    string Id,
    string DisplayName,
    string Email,
    string? JobTitle
);
