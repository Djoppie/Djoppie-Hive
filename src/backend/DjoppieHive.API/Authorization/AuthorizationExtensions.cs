using Microsoft.AspNetCore.Authorization;

namespace DjoppieHive.API.Authorization;

/// <summary>
/// Extension methods for configuring authorization policies.
/// </summary>
public static class AuthorizationExtensions
{
    /// <summary>
    /// Adds all Djoppie-Hive authorization policies.
    /// </summary>
    public static IServiceCollection AddDjoppieHiveAuthorization(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            // ============================================
            // Role-based policies (hierarchical)
            // ============================================

            // ICT Super Admin only
            options.AddPolicy(PolicyNames.RequireIctAdmin, policy =>
                policy.RequireRole(AppRoles.IctSuperAdmin));

            // HR Admin or ICT Super Admin
            options.AddPolicy(PolicyNames.RequireHrAdmin, policy =>
                policy.RequireRole(AppRoles.IctSuperAdmin, AppRoles.HrAdmin));

            // Sector Manager or higher
            options.AddPolicy(PolicyNames.RequireSectorManager, policy =>
                policy.RequireRole(
                    AppRoles.IctSuperAdmin,
                    AppRoles.HrAdmin,
                    AppRoles.SectorManager));

            // Diensthoofd or higher
            options.AddPolicy(PolicyNames.RequireDiensthoofd, policy =>
                policy.RequireRole(
                    AppRoles.IctSuperAdmin,
                    AppRoles.HrAdmin,
                    AppRoles.SectorManager,
                    AppRoles.Diensthoofd));

            // ============================================
            // Permission-based policies
            // ============================================

            // View all employees - admins only
            options.AddPolicy(PolicyNames.CanViewAllEmployees, policy =>
                policy.RequireRole(AppRoles.IctSuperAdmin, AppRoles.HrAdmin));

            // Edit employees - all editors (scope enforced at resource level)
            options.AddPolicy(PolicyNames.CanEditEmployees, policy =>
                policy.RequireRole(AppRoles.EditorRoles));

            // Delete employees - admins only
            options.AddPolicy(PolicyNames.CanDeleteEmployees, policy =>
                policy.RequireRole(AppRoles.IctSuperAdmin, AppRoles.HrAdmin));

            // Validate changes - validators
            options.AddPolicy(PolicyNames.CanValidate, policy =>
                policy.RequireRole(AppRoles.ValidatorRoles));

            // Manage groups - ICT admin only
            options.AddPolicy(PolicyNames.CanManageGroups, policy =>
                policy.RequireRole(AppRoles.IctSuperAdmin));

            // Manage settings - ICT admin only
            options.AddPolicy(PolicyNames.CanManageSettings, policy =>
                policy.RequireRole(AppRoles.IctSuperAdmin));

            // Export data - all except regular medewerker
            options.AddPolicy(PolicyNames.CanExportData, policy =>
                policy.RequireRole(
                    AppRoles.IctSuperAdmin,
                    AppRoles.HrAdmin,
                    AppRoles.SectorManager,
                    AppRoles.Diensthoofd));

            // View audit logs - admins only
            options.AddPolicy(PolicyNames.CanViewAuditLogs, policy =>
                policy.RequireRole(AppRoles.IctSuperAdmin, AppRoles.HrAdmin));

            // Trigger sync - admins only
            options.AddPolicy(PolicyNames.CanSync, policy =>
                policy.RequireRole(AppRoles.IctSuperAdmin, AppRoles.HrAdmin));

            // Manage user roles - ICT admin only
            options.AddPolicy(PolicyNames.CanManageRoles, policy =>
                policy.RequireRole(AppRoles.IctSuperAdmin));
        });

        // Register authorization handlers for resource-based authorization
        services.AddScoped<IAuthorizationHandler, EmployeeScopeAuthorizationHandler>();
        services.AddScoped<IAuthorizationHandler, GroupScopeAuthorizationHandler>();

        return services;
    }
}
