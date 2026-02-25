using DjoppieHive.Core.DTOs;

namespace DjoppieHive.Core.Interfaces;

/// <summary>
/// Service interface for managing user roles in Djoppie-Hive.
/// </summary>
public interface IUserRoleService
{
    /// <summary>
    /// Gets all user roles from the database.
    /// </summary>
    Task<IEnumerable<UserRoleDto>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a user role by ID.
    /// </summary>
    Task<UserRoleDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all roles for a specific user by their Entra Object ID.
    /// </summary>
    Task<IEnumerable<UserRoleDto>> GetByUserIdAsync(string entraObjectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new user role assignment.
    /// </summary>
    Task<UserRoleDto> CreateAsync(CreateUserRoleDto dto, string createdBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing user role.
    /// </summary>
    Task<UserRoleDto?> UpdateAsync(Guid id, UpdateUserRoleDto dto, string updatedBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a user role assignment.
    /// </summary>
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Searches users in the system who can be assigned roles.
    /// </summary>
    Task<IEnumerable<UserSearchResultDto>> SearchUsersAsync(string query, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all available role definitions.
    /// </summary>
    IEnumerable<RoleDefinitionDto> GetRoleDefinitions();

    /// <summary>
    /// Checks if a user has a specific role.
    /// </summary>
    Task<bool> HasRoleAsync(string entraObjectId, string role, CancellationToken cancellationToken = default);
}
