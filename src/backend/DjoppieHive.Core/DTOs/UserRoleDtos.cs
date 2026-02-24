namespace DjoppieHive.Core.DTOs;

/// <summary>
/// DTO voor een gebruikersrol (GET endpoints).
/// </summary>
public record UserRoleDto(
    string Id,
    string EntraObjectId,
    string Email,
    string DisplayName,
    string Role,
    string RoleDisplayName,
    string? SectorId,
    string? SectorNaam,
    string? DienstId,
    string? DienstNaam,
    bool IsActive,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime? UpdatedAt,
    string? UpdatedBy
);

/// <summary>
/// DTO voor het aanmaken van een nieuwe gebruikersrol.
/// </summary>
public record CreateUserRoleDto(
    string EntraObjectId,
    string Email,
    string DisplayName,
    string Role,
    Guid? SectorId,
    Guid? DienstId
);

/// <summary>
/// DTO voor het bijwerken van een gebruikersrol.
/// </summary>
public record UpdateUserRoleDto(
    string? Role,
    Guid? SectorId,
    Guid? DienstId,
    bool? IsActive
);

/// <summary>
/// DTO voor het zoeken van gebruikers in Entra ID om rollen toe te kennen.
/// </summary>
public record UserSearchResultDto(
    string EntraObjectId,
    string DisplayName,
    string Email,
    string? JobTitle,
    string? Department,
    bool HasExistingRole,
    List<string>? ExistingRoles
);

/// <summary>
/// Overzicht van beschikbare rollen.
/// </summary>
public record RoleDefinitionDto(
    string Id,
    string DisplayName,
    string Description,
    string Scope,
    List<string> Permissions
);
