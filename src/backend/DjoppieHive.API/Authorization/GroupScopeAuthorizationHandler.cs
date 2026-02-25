using System.Security.Claims;
using DjoppieHive.Core.Enums;
using DjoppieHive.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace DjoppieHive.API.Authorization;

/// <summary>
/// Authorization handler that checks if a user has access to a specific distribution group
/// based on their role and organizational scope.
/// </summary>
public class GroupScopeAuthorizationHandler : AuthorizationHandler<GroupScopeRequirement>
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<GroupScopeAuthorizationHandler> _logger;

    public GroupScopeAuthorizationHandler(
        ApplicationDbContext dbContext,
        ILogger<GroupScopeAuthorizationHandler> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        GroupScopeRequirement requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? context.User.FindFirstValue("oid");

        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("No user ID found in claims");
            return;
        }

        // ICT Super Admin has full access to all groups
        if (context.User.IsInRole(AppRoles.IctSuperAdmin))
        {
            context.Succeed(requirement);
            return;
        }

        // HR Admin has read access to all groups
        if (context.User.IsInRole(AppRoles.HrAdmin))
        {
            if (requirement.RequiredPermission == "read")
            {
                context.Succeed(requirement);
                return;
            }
            // HR Admin cannot modify groups
        }

        // Get the group being accessed
        var group = await _dbContext.DistributionGroups
            .AsNoTracking()
            .Include(g => g.BovenliggendeGroep)
            .FirstOrDefaultAsync(g => g.Id == requirement.GroupId);

        if (group == null)
        {
            _logger.LogWarning("Group {GroupId} not found for authorization check", requirement.GroupId);
            return;
        }

        // Get the current user's employee record
        var currentUser = await _dbContext.Employees
            .AsNoTracking()
            .Include(e => e.Dienst)
            .ThenInclude(d => d!.BovenliggendeGroep)
            .FirstOrDefaultAsync(e => e.EntraObjectId == userId);

        if (currentUser == null)
        {
            _logger.LogWarning("Current user {UserId} not found in employee database", userId);
            return;
        }

        // Sector Manager: can view their sector and its diensten
        if (context.User.IsInRole(AppRoles.SectorManager))
        {
            var userSectorId = currentUser.Dienst?.BovenliggendeGroepId;

            // User can access their own sector
            if (group.Id == userSectorId)
            {
                context.Succeed(requirement);
                return;
            }

            // User can access diensten within their sector
            if (group.Niveau == GroepNiveau.Dienst && group.BovenliggendeGroepId == userSectorId)
            {
                context.Succeed(requirement);
                return;
            }
        }

        // Diensthoofd: can view their own dienst only
        if (context.User.IsInRole(AppRoles.Diensthoofd))
        {
            var userDienstId = currentUser.DienstId;

            if (group.Id == userDienstId)
            {
                context.Succeed(requirement);
                return;
            }
        }

        // Medewerker: can view their own dienst (read-only)
        if (context.User.IsInRole(AppRoles.Medewerker) && requirement.RequiredPermission == "read")
        {
            var userDienstId = currentUser.DienstId;

            if (group.Id == userDienstId)
            {
                context.Succeed(requirement);
                return;
            }
        }
    }
}
