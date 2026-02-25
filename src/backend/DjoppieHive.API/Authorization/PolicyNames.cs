namespace DjoppieHive.API.Authorization;

/// <summary>
/// Authorization policy names used throughout the application.
/// </summary>
public static class PolicyNames
{
    // ============================================
    // Role-based policies
    // ============================================

    /// <summary>Requires ICT Super Admin role</summary>
    public const string RequireIctAdmin = "RequireIctAdmin";

    /// <summary>Requires HR Admin or higher</summary>
    public const string RequireHrAdmin = "RequireHrAdmin";

    /// <summary>Requires at least Sector Manager level</summary>
    public const string RequireSectorManager = "RequireSectorManager";

    /// <summary>Requires at least Diensthoofd level</summary>
    public const string RequireDiensthoofd = "RequireDiensthoofd";

    // ============================================
    // Permission-based policies
    // ============================================

    /// <summary>Can view all employees (admin roles)</summary>
    public const string CanViewAllEmployees = "CanViewAllEmployees";

    /// <summary>Can edit employees (with scope restrictions)</summary>
    public const string CanEditEmployees = "CanEditEmployees";

    /// <summary>Can delete employees</summary>
    public const string CanDeleteEmployees = "CanDeleteEmployees";

    /// <summary>Can validate sync changes</summary>
    public const string CanValidate = "CanValidate";

    /// <summary>Can manage distribution groups</summary>
    public const string CanManageGroups = "CanManageGroups";

    /// <summary>Can manage system settings</summary>
    public const string CanManageSettings = "CanManageSettings";

    /// <summary>Can export employee data</summary>
    public const string CanExportData = "CanExportData";

    /// <summary>Can view audit logs</summary>
    public const string CanViewAuditLogs = "CanViewAuditLogs";

    /// <summary>Can trigger sync operations</summary>
    public const string CanSync = "CanSync";

    /// <summary>Can manage user roles</summary>
    public const string CanManageRoles = "CanManageRoles";
}
