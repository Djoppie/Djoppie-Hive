using System.Security.Claims;
using DjoppieHive.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieHive.API.Authorization;

/// <summary>
/// Implementation of user context service using HttpContext and database.
/// </summary>
public class UserContextService : IUserContextService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<UserContextService> _logger;

    public UserContextService(
        IHttpContextAccessor httpContextAccessor,
        ApplicationDbContext dbContext,
        ILogger<UserContextService> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _dbContext = dbContext;
        _logger = logger;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public string? GetCurrentUserId()
    {
        return User?.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User?.FindFirstValue("oid")  // Azure AD object ID
               ?? User?.FindFirstValue("sub"); // Subject claim
    }

    public string? GetCurrentUserEmail()
    {
        return User?.FindFirstValue(ClaimTypes.Email)
               ?? User?.FindFirstValue("preferred_username")
               ?? User?.FindFirstValue("email");
    }

    public string? GetCurrentUserName()
    {
        return User?.FindFirstValue(ClaimTypes.Name)
               ?? User?.FindFirstValue("name");
    }

    public IEnumerable<string> GetCurrentUserRoles()
    {
        if (User == null) return Enumerable.Empty<string>();

        // Get roles from standard role claims
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        // Also check for Azure AD "roles" claim
        roles.AddRange(User.FindAll("roles").Select(c => c.Value));

        return roles.Distinct();
    }

    public bool HasRole(string role)
    {
        return User?.IsInRole(role) == true ||
               GetCurrentUserRoles().Contains(role, StringComparer.OrdinalIgnoreCase);
    }

    public bool HasAnyRole(params string[] roles)
    {
        return roles.Any(HasRole);
    }

    public bool IsAdmin()
    {
        return HasAnyRole(AppRoles.IctSuperAdmin, AppRoles.HrAdmin);
    }

    public async Task<Guid?> GetCurrentUserSectorIdAsync()
    {
        if (IsAdmin()) return null; // Admins see all

        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId)) return null;

        var employee = await _dbContext.Employees
            .AsNoTracking()
            .Include(e => e.Dienst)
            .FirstOrDefaultAsync(e => e.EntraObjectId == userId);

        return employee?.Dienst?.BovenliggendeGroepId;
    }

    public async Task<Guid?> GetCurrentUserDienstIdAsync()
    {
        if (IsAdmin()) return null; // Admins see all
        if (HasRole(AppRoles.SectorManager)) return null; // Sector managers see whole sector

        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId)) return null;

        var employee = await _dbContext.Employees
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.EntraObjectId == userId);

        return employee?.DienstId;
    }

    public async Task<Guid?> GetCurrentEmployeeIdAsync()
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId)) return null;

        var employee = await _dbContext.Employees
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.EntraObjectId == userId);

        return employee?.Id;
    }
}
