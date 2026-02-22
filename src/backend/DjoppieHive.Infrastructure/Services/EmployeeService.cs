using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Entities;
using DjoppieHive.Core.Enums;
using DjoppieHive.Core.Interfaces;
using DjoppieHive.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Database-backed employee service with full CRUD operations.
/// Handles both Azure-synced employees and manually-added employees.
/// </summary>
public class EmployeeService : IEmployeeService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<EmployeeService> _logger;

    public EmployeeService(
        ApplicationDbContext context,
        ILogger<EmployeeService> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Legacy Graph API Methods (Stub implementations)

    public Task<IEnumerable<EmployeeDto>> GetAllEmployeesAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("GetAllEmployeesAsync is deprecated. Use GetAllAsync with filters instead.");
        return GetAllAsync(null, cancellationToken);
    }

    public async Task<EmployeeDto?> GetEmployeeByIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("GetEmployeeByIdAsync(string) is deprecated. Use GetByIdAsync(Guid) instead.");

        // Try to find by EntraObjectId
        var employee = await _context.Employees
            .Include(e => e.Dienst)
            .Include(e => e.VrijwilligerDetails)
            .Include(e => e.GroupMemberships)
                .ThenInclude(m => m.DistributionGroup)
            .FirstOrDefaultAsync(e => e.EntraObjectId == userId, cancellationToken);

        return employee != null ? MapToDto(employee) : null;
    }

    public async Task<IEnumerable<EmployeeSummaryDto>> SearchEmployeesAsync(string query, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
        {
            return Array.Empty<EmployeeSummaryDto>();
        }

        var lowerQuery = query.ToLower();

        var employees = await _context.Employees
            .Include(e => e.Dienst)
            .Where(e => e.IsActive &&
                       (e.DisplayName.ToLower().Contains(lowerQuery) ||
                        e.Email.ToLower().Contains(lowerQuery)))
            .OrderBy(e => e.DisplayName)
            .Take(25)
            .Select(e => new EmployeeSummaryDto(
                e.Id.ToString(),
                e.DisplayName,
                e.Email,
                e.JobTitle,
                e.EmployeeType.ToString(),
                e.ArbeidsRegime.ToString(),
                e.IsActive,
                e.Dienst != null ? e.Dienst.DisplayName : null
            ))
            .ToListAsync(cancellationToken);

        return employees;
    }

    #endregion

    #region CRUD Operations

    public async Task<IEnumerable<EmployeeDto>> GetAllAsync(
        EmployeeFilter? filter = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _context.Employees
                .Include(e => e.Dienst)
                .Include(e => e.VrijwilligerDetails)
                .Include(e => e.GroupMemberships)
                    .ThenInclude(m => m.DistributionGroup)
                .AsQueryable();

            // Apply filters
            if (filter != null)
            {
                if (filter.Type.HasValue)
                {
                    query = query.Where(e => e.EmployeeType == filter.Type.Value);
                }

                if (filter.Regime.HasValue)
                {
                    query = query.Where(e => e.ArbeidsRegime == filter.Regime.Value);
                }

                if (filter.IsActive.HasValue)
                {
                    query = query.Where(e => e.IsActive == filter.IsActive.Value);
                }

                if (filter.DienstId.HasValue)
                {
                    query = query.Where(e => e.DienstId == filter.DienstId.Value);
                }

                if (filter.Bron.HasValue)
                {
                    query = query.Where(e => e.Bron == filter.Bron.Value);
                }

                if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
                {
                    var searchLower = filter.SearchTerm.ToLower();
                    query = query.Where(e =>
                        e.DisplayName.ToLower().Contains(searchLower) ||
                        e.Email.ToLower().Contains(searchLower) ||
                        (e.GivenName != null && e.GivenName.ToLower().Contains(searchLower)) ||
                        (e.Surname != null && e.Surname.ToLower().Contains(searchLower))
                    );
                }
            }

            var employees = await query
                .OrderBy(e => e.DisplayName)
                .ToListAsync(cancellationToken);

            return employees.Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving employees with filter {@Filter}", filter);
            throw;
        }
    }

    public async Task<EmployeeDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var employee = await _context.Employees
                .Include(e => e.Dienst)
                .Include(e => e.VrijwilligerDetails)
                .Include(e => e.GroupMemberships)
                    .ThenInclude(m => m.DistributionGroup)
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            return employee != null ? MapToDto(employee) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving employee with ID {EmployeeId}", id);
            throw;
        }
    }

    public async Task<EmployeeDto> CreateAsync(CreateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            // Validate DienstId if provided
            if (dto.DienstId.HasValue)
            {
                var dienstExists = await _context.DistributionGroups
                    .AnyAsync(d => d.Id == dto.DienstId.Value, cancellationToken);

                if (!dienstExists)
                {
                    throw new InvalidOperationException($"Dienst with ID {dto.DienstId.Value} does not exist.");
                }
            }

            // Check for duplicate email
            var emailExists = await _context.Employees
                .AnyAsync(e => e.Email == dto.Email, cancellationToken);

            if (emailExists)
            {
                throw new InvalidOperationException($"An employee with email {dto.Email} already exists.");
            }

            var employee = new Employee
            {
                Id = Guid.NewGuid(),
                EntraObjectId = Guid.NewGuid().ToString(), // Generate unique ID for manual entries
                DisplayName = dto.DisplayName,
                GivenName = dto.GivenName,
                Surname = dto.Surname,
                Email = dto.Email,
                JobTitle = dto.JobTitle,
                Department = dto.Department,
                OfficeLocation = dto.OfficeLocation,
                MobilePhone = dto.MobilePhone,
                BusinessPhones = dto.BusinessPhones,
                IsActive = dto.IsActive,
                EmployeeType = dto.EmployeeType,
                ArbeidsRegime = dto.ArbeidsRegime,
                PhotoUrl = dto.PhotoUrl,
                DienstId = dto.DienstId,
                StartDatum = dto.StartDatum,
                EindDatum = dto.EindDatum,
                Telefoonnummer = dto.Telefoonnummer,
                Bron = GegevensBron.Handmatig,
                IsHandmatigToegevoegd = true,
                CreatedAt = DateTime.UtcNow
            };

            // Add VrijwilligerDetails if employee is a volunteer
            if (dto.EmployeeType == EmployeeType.Vrijwilliger && dto.VrijwilligerDetails != null)
            {
                employee.VrijwilligerDetails = new VrijwilligerDetails
                {
                    Id = Guid.NewGuid(),
                    EmployeeId = employee.Id,
                    Beschikbaarheid = dto.VrijwilligerDetails.Beschikbaarheid,
                    Specialisaties = dto.VrijwilligerDetails.Specialisaties,
                    NoodContactNaam = dto.VrijwilligerDetails.NoodContactNaam,
                    NoodContactTelefoon = dto.VrijwilligerDetails.NoodContactTelefoon,
                    VogDatum = dto.VrijwilligerDetails.VogDatum,
                    VogGeldigTot = dto.VrijwilligerDetails.VogGeldigTot,
                    Opmerkingen = dto.VrijwilligerDetails.Opmerkingen,
                    CreatedAt = DateTime.UtcNow
                };
            }

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created new employee {EmployeeId} - {DisplayName}", employee.Id, employee.DisplayName);

            // Reload with includes
            var created = await GetByIdAsync(employee.Id, cancellationToken);
            return created!;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating employee {DisplayName}", dto.DisplayName);
            throw;
        }
    }

    public async Task<EmployeeDto?> UpdateAsync(
        Guid id,
        UpdateEmployeeDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var employee = await _context.Employees
                .Include(e => e.VrijwilligerDetails)
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (employee == null)
            {
                return null;
            }

            // Validate updates based on data source
            if (employee.Bron == GegevensBron.AzureAD)
            {
                // Azure-synced employees: Only allow updating specific fields
                _logger.LogInformation(
                    "Updating Azure-synced employee {EmployeeId}. Only specific fields allowed.",
                    id);

                if (dto.EmployeeType.HasValue)
                    employee.EmployeeType = dto.EmployeeType.Value;

                if (dto.ArbeidsRegime.HasValue)
                    employee.ArbeidsRegime = dto.ArbeidsRegime.Value;

                if (dto.DienstId.HasValue)
                {
                    if (dto.DienstId.Value != Guid.Empty)
                    {
                        var dienstExists = await _context.DistributionGroups
                            .AnyAsync(d => d.Id == dto.DienstId.Value, cancellationToken);

                        if (!dienstExists)
                        {
                            throw new InvalidOperationException($"Dienst with ID {dto.DienstId.Value} does not exist.");
                        }

                        employee.DienstId = dto.DienstId.Value;
                    }
                    else
                    {
                        employee.DienstId = null; // Clear dienst
                    }
                }

                if (dto.StartDatum.HasValue)
                    employee.StartDatum = dto.StartDatum.Value;

                if (dto.EindDatum.HasValue)
                    employee.EindDatum = dto.EindDatum.Value;

                if (dto.Telefoonnummer != null)
                    employee.Telefoonnummer = dto.Telefoonnummer;

                // Cannot update: DisplayName, Email, JobTitle (managed by Azure AD)
            }
            else
            {
                // Manual employees: Allow updating all fields
                if (dto.DisplayName != null)
                    employee.DisplayName = dto.DisplayName;

                if (dto.GivenName != null)
                    employee.GivenName = dto.GivenName;

                if (dto.Surname != null)
                    employee.Surname = dto.Surname;

                if (dto.Email != null)
                {
                    // Check for duplicate email
                    var emailExists = await _context.Employees
                        .AnyAsync(e => e.Email == dto.Email && e.Id != id, cancellationToken);

                    if (emailExists)
                    {
                        throw new InvalidOperationException($"An employee with email {dto.Email} already exists.");
                    }

                    employee.Email = dto.Email;
                }

                if (dto.JobTitle != null)
                    employee.JobTitle = dto.JobTitle;

                if (dto.Department != null)
                    employee.Department = dto.Department;

                if (dto.OfficeLocation != null)
                    employee.OfficeLocation = dto.OfficeLocation;

                if (dto.MobilePhone != null)
                    employee.MobilePhone = dto.MobilePhone;

                if (dto.BusinessPhones != null)
                    employee.BusinessPhones = dto.BusinessPhones;

                if (dto.IsActive.HasValue)
                    employee.IsActive = dto.IsActive.Value;

                if (dto.EmployeeType.HasValue)
                    employee.EmployeeType = dto.EmployeeType.Value;

                if (dto.ArbeidsRegime.HasValue)
                    employee.ArbeidsRegime = dto.ArbeidsRegime.Value;

                if (dto.PhotoUrl != null)
                    employee.PhotoUrl = dto.PhotoUrl;

                if (dto.DienstId.HasValue)
                {
                    if (dto.DienstId.Value != Guid.Empty)
                    {
                        var dienstExists = await _context.DistributionGroups
                            .AnyAsync(d => d.Id == dto.DienstId.Value, cancellationToken);

                        if (!dienstExists)
                        {
                            throw new InvalidOperationException($"Dienst with ID {dto.DienstId.Value} does not exist.");
                        }

                        employee.DienstId = dto.DienstId.Value;
                    }
                    else
                    {
                        employee.DienstId = null;
                    }
                }

                if (dto.StartDatum.HasValue)
                    employee.StartDatum = dto.StartDatum.Value;

                if (dto.EindDatum.HasValue)
                    employee.EindDatum = dto.EindDatum.Value;

                if (dto.Telefoonnummer != null)
                    employee.Telefoonnummer = dto.Telefoonnummer;
            }

            // Update VrijwilligerDetails if provided
            if (dto.VrijwilligerDetails != null)
            {
                if (employee.EmployeeType == EmployeeType.Vrijwilliger)
                {
                    if (employee.VrijwilligerDetails == null)
                    {
                        // Create new VrijwilligerDetails
                        employee.VrijwilligerDetails = new VrijwilligerDetails
                        {
                            Id = Guid.NewGuid(),
                            EmployeeId = employee.Id,
                            CreatedAt = DateTime.UtcNow
                        };
                    }

                    var details = employee.VrijwilligerDetails;
                    details.Beschikbaarheid = dto.VrijwilligerDetails.Beschikbaarheid;
                    details.Specialisaties = dto.VrijwilligerDetails.Specialisaties;
                    details.NoodContactNaam = dto.VrijwilligerDetails.NoodContactNaam;
                    details.NoodContactTelefoon = dto.VrijwilligerDetails.NoodContactTelefoon;
                    details.VogDatum = dto.VrijwilligerDetails.VogDatum;
                    details.VogGeldigTot = dto.VrijwilligerDetails.VogGeldigTot;
                    details.Opmerkingen = dto.VrijwilligerDetails.Opmerkingen;
                    details.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    _logger.LogWarning(
                        "Cannot add VrijwilligerDetails to employee {EmployeeId} with type {EmployeeType}",
                        id, employee.EmployeeType);
                }
            }

            employee.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated employee {EmployeeId} - {DisplayName}", employee.Id, employee.DisplayName);

            // Reload with includes
            return await GetByIdAsync(employee.Id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating employee {EmployeeId}", id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var employee = await _context.Employees.FindAsync([id], cancellationToken);

            if (employee == null)
            {
                return false;
            }

            // Soft delete: Set IsActive to false
            employee.IsActive = false;
            employee.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Soft-deleted employee {EmployeeId} - {DisplayName}", employee.Id, employee.DisplayName);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting employee {EmployeeId}", id);
            throw;
        }
    }

    public async Task<IEnumerable<EmployeeDto>> GetByDienstAsync(
        Guid dienstId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var employees = await _context.Employees
                .Include(e => e.Dienst)
                .Include(e => e.VrijwilligerDetails)
                .Include(e => e.GroupMemberships)
                    .ThenInclude(m => m.DistributionGroup)
                .Where(e => e.DienstId == dienstId && e.IsActive)
                .OrderBy(e => e.DisplayName)
                .ToListAsync(cancellationToken);

            return employees.Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving employees for dienst {DienstId}", dienstId);
            throw;
        }
    }

    public async Task<IEnumerable<EmployeeDto>> GetVolunteersAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var volunteers = await _context.Employees
                .Include(e => e.Dienst)
                .Include(e => e.VrijwilligerDetails)
                .Include(e => e.GroupMemberships)
                    .ThenInclude(m => m.DistributionGroup)
                .Where(e => e.EmployeeType == EmployeeType.Vrijwilliger && e.IsActive)
                .OrderBy(e => e.DisplayName)
                .ToListAsync(cancellationToken);

            return volunteers.Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving volunteers");
            throw;
        }
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Maps an Employee entity to EmployeeDto.
    /// </summary>
    private EmployeeDto MapToDto(Employee employee)
    {
        var groups = employee.GroupMemberships
            .Where(m => m.IsActief)
            .Select(m => m.DistributionGroup.DisplayName)
            .ToList();

        VrijwilligerDetailsDto? vrijwilligerDetails = null;
        if (employee.VrijwilligerDetails != null)
        {
            vrijwilligerDetails = new VrijwilligerDetailsDto(
                employee.VrijwilligerDetails.Id.ToString(),
                employee.VrijwilligerDetails.EmployeeId.ToString(),
                employee.VrijwilligerDetails.Beschikbaarheid,
                employee.VrijwilligerDetails.Specialisaties,
                employee.VrijwilligerDetails.NoodContactNaam,
                employee.VrijwilligerDetails.NoodContactTelefoon,
                employee.VrijwilligerDetails.VogDatum,
                employee.VrijwilligerDetails.VogGeldigTot,
                employee.VrijwilligerDetails.Opmerkingen,
                employee.VrijwilligerDetails.CreatedAt,
                employee.VrijwilligerDetails.UpdatedAt
            );
        }

        return new EmployeeDto(
            employee.Id.ToString(),
            employee.DisplayName,
            employee.GivenName,
            employee.Surname,
            employee.Email,
            employee.JobTitle,
            employee.Department,
            employee.OfficeLocation,
            employee.MobilePhone,
            groups,
            employee.IsActive,
            employee.Bron.ToString(),
            employee.IsHandmatigToegevoegd,
            employee.EmployeeType.ToString(),
            employee.ArbeidsRegime.ToString(),
            employee.PhotoUrl,
            employee.DienstId?.ToString(),
            employee.Dienst?.DisplayName,
            employee.StartDatum,
            employee.EindDatum,
            employee.Telefoonnummer,
            vrijwilligerDetails,
            employee.CreatedAt,
            employee.UpdatedAt,
            employee.LastSyncedAt
        );
    }

    #endregion
}
