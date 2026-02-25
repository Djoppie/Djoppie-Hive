using System.Security.Claims;
using DjoppieHive.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieHive.API.Authorization;

/// <summary>
/// Implementation of user context service using HttpContext and database.
/// Ondersteunt zowel JWT claims als database-gebaseerde rollen.
/// </summary>
public class UserContextService : IUserContextService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<UserContextService> _logger;
    private List<string>? _cachedDbRoles;
    private bool _dbRolesChecked;

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
        // Azure AD v1.0 tokens use the full URL claim type for object identifier
        return User?.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier")
               ?? User?.FindFirstValue("oid")  // Azure AD v2.0 short format
               ?? User?.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User?.FindFirstValue("sub"); // Subject claim
    }

    public string? GetCurrentUserEmail()
    {
        // Azure AD tokens use UPN claim for email
        return User?.FindFirstValue(ClaimTypes.Upn)  // http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn
               ?? User?.FindFirstValue("upn")
               ?? User?.FindFirstValue(ClaimTypes.Email)
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

        // Also check database roles (synchronously for interface compatibility)
        var dbRoles = GetDatabaseRolesAsync().GetAwaiter().GetResult();
        roles.AddRange(dbRoles);

        return roles.Distinct();
    }

    /// <summary>
    /// Haalt rollen op uit de database voor de huidige gebruiker.
    /// Update ook automatisch het EntraObjectId als dit nog "pending-first-login" is.
    /// </summary>
    private async Task<List<string>> GetDatabaseRolesAsync()
    {
        if (_dbRolesChecked && _cachedDbRoles != null)
            return _cachedDbRoles;

        _dbRolesChecked = true;
        _cachedDbRoles = new List<string>();

        var userId = GetCurrentUserId();
        var email = GetCurrentUserEmail();

        if (string.IsNullOrEmpty(email)) return _cachedDbRoles;

        // Zoek rollen op basis van EntraObjectId of Email
        var userRoles = await _dbContext.UserRoles
            .Where(r => r.IsActive &&
                       (r.EntraObjectId == userId ||
                        r.Email.ToLower() == email.ToLower()))
            .ToListAsync();

        if (!userRoles.Any()) return _cachedDbRoles;

        // Update EntraObjectId voor rollen die nog "pending-first-login" hebben
        if (!string.IsNullOrEmpty(userId))
        {
            var pendingRoles = userRoles.Where(r =>
                r.EntraObjectId == "pending-first-login" &&
                r.Email.Equals(email, StringComparison.OrdinalIgnoreCase)).ToList();

            if (pendingRoles.Any())
            {
                foreach (var role in pendingRoles)
                {
                    role.EntraObjectId = userId;
                    role.UpdatedAt = DateTime.UtcNow;
                    role.UpdatedBy = "System (Auto-update on first login)";
                    _logger.LogInformation(
                        "EntraObjectId bijgewerkt voor {Email} met rol {Role}",
                        email, role.Role);
                }
                await _dbContext.SaveChangesAsync();
            }
        }

        _cachedDbRoles = userRoles.Select(r => r.Role).Distinct().ToList();
        return _cachedDbRoles;
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
