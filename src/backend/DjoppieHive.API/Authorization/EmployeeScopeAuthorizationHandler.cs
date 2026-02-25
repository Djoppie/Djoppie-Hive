using System.Security.Claims;
using DjoppieHive.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace DjoppieHive.API.Authorization;

/// <summary>
/// Authorization handler that checks if a user has access to a specific employee
/// based on their role and organizational scope (sector/dienst).
/// </summary>
public class EmployeeScopeAuthorizationHandler : AuthorizationHandler<EmployeeScopeRequirement>
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<EmployeeScopeAuthorizationHandler> _logger;

    public EmployeeScopeAuthorizationHandler(
        ApplicationDbContext dbContext,
        ILogger<EmployeeScopeAuthorizationHandler> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        EmployeeScopeRequirement requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? context.User.FindFirstValue("oid"); // Azure AD object ID

        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("No user ID found in claims");
            return;
        }

        // ICT Super Admin and HR Admin have full access
        if (context.User.IsInRole(AppRoles.IctSuperAdmin) ||
            context.User.IsInRole(AppRoles.HrAdmin))
        {
            context.Succeed(requirement);
            return;
        }

        // Get the employee being accessed
        var employee = await _dbContext.Employees
            .AsNoTracking()
            .Include(e => e.Dienst)
            .ThenInclude(d => d!.BovenliggendeGroep)
            .FirstOrDefaultAsync(e => e.Id == requirement.EmployeeId);

        if (employee == null)
        {
            _logger.LogWarning("Employee {EmployeeId} not found for authorization check", requirement.EmployeeId);
            return; // Let the controller handle 404
        }

        // Get the current user's employee record to determine their scope
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

        // Sector Manager: can access employees in their sector
        if (context.User.IsInRole(AppRoles.SectorManager))
        {
            var userSectorId = currentUser.Dienst?.BovenliggendeGroepId;
            var employeeSectorId = employee.Dienst?.BovenliggendeGroepId;

            if (userSectorId != null && userSectorId == employeeSectorId)
            {
                context.Succeed(requirement);
                return;
            }

            _logger.LogInformation(
                "Sector manager {UserId} denied access to employee {EmployeeId} - different sector",
                userId, requirement.EmployeeId);
        }

        // Diensthoofd: can access employees in their dienst
        if (context.User.IsInRole(AppRoles.Diensthoofd))
        {
            var userDienstId = currentUser.DienstId;
            var employeeDienstId = employee.DienstId;

            if (userDienstId != null && userDienstId == employeeDienstId)
            {
                context.Succeed(requirement);
                return;
            }

            _logger.LogInformation(
                "Diensthoofd {UserId} denied access to employee {EmployeeId} - different dienst",
                userId, requirement.EmployeeId);
        }

        // Medewerker: can only access their own data
        if (context.User.IsInRole(AppRoles.Medewerker))
        {
            if (currentUser.Id == requirement.EmployeeId)
            {
                // For write operations, medewerkers cannot edit themselves
                if (requirement.RequiredPermission == "write")
                {
                    _logger.LogInformation(
                        "Medewerker {UserId} denied write access to own record",
                        userId);
                    return;
                }

                context.Succeed(requirement);
                return;
            }
        }
    }
}
