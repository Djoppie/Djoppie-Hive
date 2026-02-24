using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Entities;
using DjoppieHive.Core.Interfaces;
using DjoppieHive.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Service voor het beheren van gebruikersrollen in Djoppie-Hive.
/// </summary>
public class UserRoleService : IUserRoleService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UserRoleService> _logger;

    // Rol definities met display namen en permissies
    private static readonly Dictionary<string, RoleDefinitionDto> _roleDefinitions = new()
    {
        ["ict_super_admin"] = new RoleDefinitionDto(
            "ict_super_admin",
            "ICT Super Admin",
            "Volledige toegang tot alle functies en gegevens",
            "all",
            ["canViewAllEmployees", "canEditEmployees", "canDeleteEmployees", "canValidate", "canManageGroups", "canManageSettings", "canExportData", "canViewAuditLogs", "canSync", "canManageRoles"]
        ),
        ["hr_admin"] = new RoleDefinitionDto(
            "hr_admin",
            "HR Admin",
            "HR administratie - volledige toegang tot medewerkergegevens",
            "all",
            ["canViewAllEmployees", "canEditEmployees", "canDeleteEmployees", "canValidate", "canExportData", "canViewAuditLogs", "canSync"]
        ),
        ["sectormanager"] = new RoleDefinitionDto(
            "sectormanager",
            "Sectormanager",
            "Beheer van medewerkers binnen eigen sector",
            "sector",
            ["canEditEmployees", "canValidate", "canExportData"]
        ),
        ["diensthoofd"] = new RoleDefinitionDto(
            "diensthoofd",
            "Diensthoofd/Teamcoach",
            "Beheer van medewerkers binnen eigen dienst",
            "dienst",
            ["canEditEmployees", "canValidate", "canExportData"]
        ),
        ["medewerker"] = new RoleDefinitionDto(
            "medewerker",
            "Medewerker",
            "Alleen-lezen toegang tot eigen gegevens",
            "self",
            []
        )
    };

    public UserRoleService(
        ApplicationDbContext context,
        ILogger<UserRoleService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<UserRoleDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var roles = await _context.UserRoles
            .Include(r => r.Sector)
            .Include(r => r.Dienst)
            .OrderBy(r => r.DisplayName)
            .ThenBy(r => r.Role)
            .ToListAsync(cancellationToken);

        return roles.Select(MapToDto);
    }

    public async Task<UserRoleDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var role = await _context.UserRoles
            .Include(r => r.Sector)
            .Include(r => r.Dienst)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        return role == null ? null : MapToDto(role);
    }

    public async Task<IEnumerable<UserRoleDto>> GetByUserIdAsync(string entraObjectId, CancellationToken cancellationToken = default)
    {
        var roles = await _context.UserRoles
            .Include(r => r.Sector)
            .Include(r => r.Dienst)
            .Where(r => r.EntraObjectId == entraObjectId && r.IsActive)
            .ToListAsync(cancellationToken);

        return roles.Select(MapToDto);
    }

    public async Task<UserRoleDto> CreateAsync(CreateUserRoleDto dto, string createdBy, CancellationToken cancellationToken = default)
    {
        // Valideer dat de rol bestaat
        if (!_roleDefinitions.ContainsKey(dto.Role.ToLowerInvariant()))
        {
            throw new InvalidOperationException($"Ongeldige rol: {dto.Role}");
        }

        // Check of de gebruiker deze rol al heeft
        var existing = await _context.UserRoles
            .FirstOrDefaultAsync(r => r.EntraObjectId == dto.EntraObjectId && r.Role == dto.Role.ToLowerInvariant(),
                cancellationToken);

        if (existing != null)
        {
            throw new InvalidOperationException($"Gebruiker heeft deze rol al: {dto.Role}");
        }

        var userRole = new UserRole
        {
            Id = Guid.NewGuid(),
            EntraObjectId = dto.EntraObjectId,
            Email = dto.Email,
            DisplayName = dto.DisplayName,
            Role = dto.Role.ToLowerInvariant(),
            SectorId = dto.SectorId,
            DienstId = dto.DienstId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            IsActive = true
        };

        _context.UserRoles.Add(userRole);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Rol {Role} toegekend aan {Email} door {CreatedBy}",
            userRole.Role, userRole.Email, createdBy);

        // Reload met navigatie properties
        await _context.Entry(userRole)
            .Reference(r => r.Sector)
            .LoadAsync(cancellationToken);
        await _context.Entry(userRole)
            .Reference(r => r.Dienst)
            .LoadAsync(cancellationToken);

        return MapToDto(userRole);
    }

    public async Task<UserRoleDto?> UpdateAsync(Guid id, UpdateUserRoleDto dto, string updatedBy, CancellationToken cancellationToken = default)
    {
        var userRole = await _context.UserRoles
            .Include(r => r.Sector)
            .Include(r => r.Dienst)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (userRole == null)
        {
            return null;
        }

        if (dto.Role != null)
        {
            var normalizedRole = dto.Role.ToLowerInvariant();
            if (!_roleDefinitions.ContainsKey(normalizedRole))
            {
                throw new InvalidOperationException($"Ongeldige rol: {dto.Role}");
            }
            userRole.Role = normalizedRole;
        }

        if (dto.SectorId.HasValue)
        {
            userRole.SectorId = dto.SectorId;
        }

        if (dto.DienstId.HasValue)
        {
            userRole.DienstId = dto.DienstId;
        }

        if (dto.IsActive.HasValue)
        {
            userRole.IsActive = dto.IsActive.Value;
        }

        userRole.UpdatedAt = DateTime.UtcNow;
        userRole.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Rol {RoleId} bijgewerkt voor {Email} door {UpdatedBy}",
            id, userRole.Email, updatedBy);

        return MapToDto(userRole);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var userRole = await _context.UserRoles.FindAsync([id], cancellationToken);

        if (userRole == null)
        {
            return false;
        }

        _context.UserRoles.Remove(userRole);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Rol {Role} verwijderd van {Email}",
            userRole.Role, userRole.Email);

        return true;
    }

    public async Task<IEnumerable<UserSearchResultDto>> SearchUsersAsync(string query, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
        {
            return [];
        }

        var searchTerm = query.ToLower();

        // Zoek in employees database
        var employees = await _context.Employees
            .Where(e => e.IsActive &&
                       (e.DisplayName.ToLower().Contains(searchTerm) ||
                        e.Email.ToLower().Contains(searchTerm)))
            .Take(20)
            .ToListAsync(cancellationToken);

        // Haal bestaande rollen op voor gevonden gebruikers
        var entraIds = employees.Select(e => e.EntraObjectId).ToList();
        var existingRoles = await _context.UserRoles
            .Where(r => entraIds.Contains(r.EntraObjectId) && r.IsActive)
            .GroupBy(r => r.EntraObjectId)
            .ToDictionaryAsync(g => g.Key, g => g.Select(r => r.Role).ToList(), cancellationToken);

        return employees.Select(e => new UserSearchResultDto(
            e.EntraObjectId,
            e.DisplayName,
            e.Email,
            e.JobTitle,
            e.Department,
            existingRoles.ContainsKey(e.EntraObjectId),
            existingRoles.TryGetValue(e.EntraObjectId, out var roles) ? roles : null
        ));
    }

    public IEnumerable<RoleDefinitionDto> GetRoleDefinitions()
    {
        return _roleDefinitions.Values;
    }

    public async Task<bool> HasRoleAsync(string entraObjectId, string role, CancellationToken cancellationToken = default)
    {
        return await _context.UserRoles
            .AnyAsync(r => r.EntraObjectId == entraObjectId &&
                          r.Role == role.ToLowerInvariant() &&
                          r.IsActive,
                      cancellationToken);
    }

    private UserRoleDto MapToDto(UserRole userRole)
    {
        var roleDefinition = _roleDefinitions.GetValueOrDefault(userRole.Role);

        return new UserRoleDto(
            userRole.Id.ToString(),
            userRole.EntraObjectId,
            userRole.Email,
            userRole.DisplayName,
            userRole.Role,
            roleDefinition?.DisplayName ?? userRole.Role,
            userRole.SectorId?.ToString(),
            userRole.Sector?.DisplayName,
            userRole.DienstId?.ToString(),
            userRole.Dienst?.DisplayName,
            userRole.IsActive,
            userRole.CreatedAt,
            userRole.CreatedBy,
            userRole.UpdatedAt,
            userRole.UpdatedBy
        );
    }
}
