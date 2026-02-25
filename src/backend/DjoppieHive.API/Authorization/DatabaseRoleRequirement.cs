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
        // Debug: Log all claims to understand token structure
        if (context.User?.Identity?.IsAuthenticated == true)
        {
            var allClaims = context.User.Claims.Select(c => $"{c.Type}={c.Value}").ToList();
            _logger.LogDebug("All claims in token: [{Claims}]", string.Join("; ", allClaims));
        }
        else
        {
            _logger.LogWarning("User is not authenticated");
        }

        var email = _userContext.GetCurrentUserEmail();
        var userId = _userContext.GetCurrentUserId();
        var userRoles = _userContext.GetCurrentUserRoles().ToList();

        _logger.LogDebug(
            "Checking database roles for {Email} (ID: {UserId}). User has roles: [{Roles}]. Required: [{Required}]",
            email,
            userId,
            string.Join(", ", userRoles),
            string.Join(", ", requirement.AllowedRoles));

        // Check if user has any of the required roles
        if (requirement.AllowedRoles.Any(requiredRole =>
            userRoles.Contains(requiredRole, StringComparer.OrdinalIgnoreCase)))
        {
            _logger.LogDebug("Authorization succeeded for {Email}", email);
            context.Succeed(requirement);
        }
        else
        {
            _logger.LogWarning(
                "Authorization failed for {Email}. Has roles [{Roles}], needs one of [{Required}]",
                email,
                string.Join(", ", userRoles),
                string.Join(", ", requirement.AllowedRoles));
        }

        return Task.CompletedTask;
    }
}
