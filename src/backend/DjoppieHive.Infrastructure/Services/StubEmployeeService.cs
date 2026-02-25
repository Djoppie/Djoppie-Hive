using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Stub implementation of IEmployeeService when Graph API is not configured.
/// Returns empty results to allow the application to run without Graph credentials.
/// NOTE: This is deprecated. Use EmployeeService instead which works with database directly.
/// </summary>
public class StubEmployeeService : IEmployeeService
{
    // Legacy Graph API methods (return empty)
    public Task<IEnumerable<EmployeeDto>> GetAllEmployeesAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Enumerable.Empty<EmployeeDto>());
    }

    public Task<EmployeeDto?> GetEmployeeByIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<EmployeeDto?>(null);
    }

    public Task<IEnumerable<EmployeeSummaryDto>> SearchEmployeesAsync(string query, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Enumerable.Empty<EmployeeSummaryDto>());
    }

    // New CRUD methods (not supported - throw NotImplementedException)
    public Task<IEnumerable<EmployeeDto>> GetAllAsync(EmployeeFilter? filter = null, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("StubEmployeeService does not support database operations. Use EmployeeService instead.");
    }

    public Task<EmployeeDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("StubEmployeeService does not support database operations. Use EmployeeService instead.");
    }

    public Task<EmployeeDto> CreateAsync(CreateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("StubEmployeeService does not support database operations. Use EmployeeService instead.");
    }

    public Task<EmployeeDto?> UpdateAsync(Guid id, UpdateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("StubEmployeeService does not support database operations. Use EmployeeService instead.");
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("StubEmployeeService does not support database operations. Use EmployeeService instead.");
    }

    public Task<EmployeeDto?> UpdateValidatieStatusAsync(Guid id, Core.Enums.ValidatieStatus status, string gevalideerdDoor, string? opmerkingen = null, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("StubEmployeeService does not support database operations. Use EmployeeService instead.");
    }

    public Task<IEnumerable<EmployeeDto>> GetByDienstAsync(Guid dienstId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("StubEmployeeService does not support database operations. Use EmployeeService instead.");
    }

    public Task<IEnumerable<EmployeeDto>> GetVolunteersAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("StubEmployeeService does not support database operations. Use EmployeeService instead.");
    }

    public Task<GdprExportDto?> ExportPersonalDataAsync(Guid employeeId, string exportedBy, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("StubEmployeeService does not support database operations. Use EmployeeService instead.");
    }
}
