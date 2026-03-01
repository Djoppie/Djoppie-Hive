using Microsoft.AspNetCore.Authorization;

namespace DjoppieHive.API.Authorization;

/// <summary>
/// Authorization requirement that checks roles from both JWT claims and database.
/// </summary>
public class DatabaseRoleRequirement : IAuthorizationRequirement
{
    public string[] AllowedRoles { get; }

    public DatabaseRoleRequirement(params string[] allowedRoles)
    {
        AllowedRoles = allowedRoles;
    }
}

/// <summary>
/// Handler that validates roles against both JWT claims and database UserRoles table.
/// </summary>
public class DatabaseRoleAuthorizationHandler : AuthorizationHandler<DatabaseRoleRequirement>
{
    private readonly IUserContextService _userContext;
    private readonly ILogger<DatabaseRoleAuthorizationHandler> _logger;

    public DatabaseRoleAuthorizationHandler(
        IUserContextService userContext,
        ILogger<DatabaseRoleAuthorizationHandler> logger)
    {
        _userContext = userContext;
        _logger = logger;
    }

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        DatabaseRoleRequirement requirement)
    {
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Task.CompletedTask;
        }

        var userRoles = _userContext.GetCurrentUserRoles().ToList();

        // Check if user has any of the required roles
        if (requirement.AllowedRoles.Any(requiredRole =>
            userRoles.Contains(requiredRole, StringComparer.OrdinalIgnoreCase)))
        {
            context.Succeed(requirement);
        }
        else
        {
            var email = _userContext.GetCurrentUserEmail();
            _logger.LogWarning(
                "Authorization failed for {Email}. Has roles [{Roles}], needs one of [{Required}]",
                email,
                string.Join(", ", userRoles),
                string.Join(", ", requirement.AllowedRoles));
        }

        return Task.CompletedTask;
    }
}
