using Microsoft.AspNetCore.Authorization;

namespace DjoppieHive.API.Authorization;

/// <summary>
/// Requirement for checking if user has access to a specific employee based on scope.
/// </summary>
public class EmployeeScopeRequirement : IAuthorizationRequirement
{
    public Guid EmployeeId { get; }
    public string RequiredPermission { get; }

    public EmployeeScopeRequirement(Guid employeeId, string requiredPermission = "read")
    {
        EmployeeId = employeeId;
        RequiredPermission = requiredPermission;
    }
}

/// <summary>
/// Requirement for checking if user has access to a specific group based on scope.
/// </summary>
public class GroupScopeRequirement : IAuthorizationRequirement
{
    public Guid GroupId { get; }
    public string RequiredPermission { get; }

    public GroupScopeRequirement(Guid groupId, string requiredPermission = "read")
    {
        GroupId = groupId;
        RequiredPermission = requiredPermission;
    }
}

/// <summary>
/// Requirement for checking if user has access to employees in a sector.
/// </summary>
public class SectorScopeRequirement : IAuthorizationRequirement
{
    public Guid SectorId { get; }

    public SectorScopeRequirement(Guid sectorId)
    {
        SectorId = sectorId;
    }
}

/// <summary>
/// Requirement for checking if user has access to employees in a dienst.
/// </summary>
public class DienstScopeRequirement : IAuthorizationRequirement
{
    public Guid DienstId { get; }

    public DienstScopeRequirement(Guid dienstId)
    {
        DienstId = dienstId;
    }
}
