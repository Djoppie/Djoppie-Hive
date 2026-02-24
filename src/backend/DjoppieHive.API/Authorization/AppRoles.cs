namespace DjoppieHive.API.Authorization;

/// <summary>
/// Application roles defined in Entra ID App Registration.
/// These must match the roles configured in the Djoppie-Hive-API app registration.
/// </summary>
public static class AppRoles
{
    /// <summary>Full access to all features and data</summary>
    public const string IctSuperAdmin = "ict_super_admin";

    /// <summary>HR administration - full employee access</summary>
    public const string HrAdmin = "hr_admin";

    /// <summary>Sector manager - access to own sector</summary>
    public const string SectorManager = "sectormanager";

    /// <summary>Team lead/coach - access to own dienst</summary>
    public const string Diensthoofd = "diensthoofd";

    /// <summary>Regular employee - read-only access to own data</summary>
    public const string Medewerker = "medewerker";

    /// <summary>All admin roles that can manage employees</summary>
    public static readonly string[] AdminRoles = { IctSuperAdmin, HrAdmin };

    /// <summary>All roles that can validate changes</summary>
    public static readonly string[] ValidatorRoles = { IctSuperAdmin, HrAdmin, SectorManager, Diensthoofd };

    /// <summary>All roles that can edit employees (with scope restrictions)</summary>
    public static readonly string[] EditorRoles = { IctSuperAdmin, HrAdmin, SectorManager, Diensthoofd };

    /// <summary>All defined roles</summary>
    public static readonly string[] AllRoles = { IctSuperAdmin, HrAdmin, SectorManager, Diensthoofd, Medewerker };
}
