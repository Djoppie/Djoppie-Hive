using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Stub implementation of IEmployeeService when Graph API is not configured.
/// Returns empty results to allow the application to run without Graph credentials.
/// </summary>
public class StubEmployeeService : IEmployeeService
{
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
}
