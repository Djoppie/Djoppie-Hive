namespace DjoppieHive.API.Authorization;

/// <summary>
/// Service for accessing current user context and authorization scope.
/// </summary>
public interface IUserContextService
{
    /// <summary>Gets the current user's Entra ID object ID</summary>
    string? GetCurrentUserId();

    /// <summary>Gets the current user's email address</summary>
    string? GetCurrentUserEmail();

    /// <summary>Gets the current user's display name</summary>
    string? GetCurrentUserName();

    /// <summary>Gets all roles assigned to the current user</summary>
    IEnumerable<string> GetCurrentUserRoles();

    /// <summary>Checks if current user has the specified role</summary>
    bool HasRole(string role);

    /// <summary>Checks if current user has any of the specified roles</summary>
    bool HasAnyRole(params string[] roles);

    /// <summary>Checks if current user is an admin (ICT or HR)</summary>
    bool IsAdmin();

    /// <summary>Gets the sector ID the current user belongs to (null for admins)</summary>
    Task<Guid?> GetCurrentUserSectorIdAsync();

    /// <summary>Gets the dienst ID the current user belongs to (null for admins/sector managers)</summary>
    Task<Guid?> GetCurrentUserDienstIdAsync();

    /// <summary>Gets the employee ID of the current user</summary>
    Task<Guid?> GetCurrentEmployeeIdAsync();
}
