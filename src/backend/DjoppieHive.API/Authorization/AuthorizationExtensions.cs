using Microsoft.AspNetCore.Authorization;

namespace DjoppieHive.API.Authorization;

/// <summary>
/// Extension methods for configuring authorization policies.
/// Uses DatabaseRoleRequirement to check roles from both JWT claims and database.
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
            // Uses DatabaseRoleRequirement for JWT + DB role checking
            // ============================================

            // ICT Super Admin only
            options.AddPolicy(PolicyNames.RequireIctAdmin, policy =>
                policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.IctSuperAdmin)));

            // HR Admin or ICT Super Admin
            options.AddPolicy(PolicyNames.RequireHrAdmin, policy =>
                policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.IctSuperAdmin, AppRoles.HrAdmin)));

            // Sector Manager or higher
            options.AddPolicy(PolicyNames.RequireSectorManager, policy =>
                policy.Requirements.Add(new DatabaseRoleRequirement(
                    AppRoles.IctSuperAdmin,
                    AppRoles.HrAdmin,
                    AppRoles.SectorManager)));

            // Diensthoofd or higher
            options.AddPolicy(PolicyNames.RequireDiensthoofd, policy =>
                policy.Requirements.Add(new DatabaseRoleRequirement(
                    AppRoles.IctSuperAdmin,
                    AppRoles.HrAdmin,
                    AppRoles.SectorManager,
                    AppRoles.Diensthoofd)));

            // ============================================
            // Permission-based policies
            // ============================================

            // View all employees - admins only
            options.AddPolicy(PolicyNames.CanViewAllEmployees, policy =>
                policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.IctSuperAdmin, AppRoles.HrAdmin)));

            // Edit employees - all editors (scope enforced at resource level)
            options.AddPolicy(PolicyNames.CanEditEmployees, policy =>
                policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.EditorRoles)));

            // Delete employees - admins only
            options.AddPolicy(PolicyNames.CanDeleteEmployees, policy =>
                policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.IctSuperAdmin, AppRoles.HrAdmin)));

            // Validate changes - validators
            options.AddPolicy(PolicyNames.CanValidate, policy =>
                policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.ValidatorRoles)));

            // Manage groups - ICT admin only
            options.AddPolicy(PolicyNames.CanManageGroups, policy =>
                policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.IctSuperAdmin)));

            // Manage settings - ICT admin only
            options.AddPolicy(PolicyNames.CanManageSettings, policy =>
                policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.IctSuperAdmin)));

            // Export data - all except regular medewerker
            options.AddPolicy(PolicyNames.CanExportData, policy =>
                policy.Requirements.Add(new DatabaseRoleRequirement(
                    AppRoles.IctSuperAdmin,
                    AppRoles.HrAdmin,
                    AppRoles.SectorManager,
                    AppRoles.Diensthoofd)));

            // View audit logs - admins only
            options.AddPolicy(PolicyNames.CanViewAuditLogs, policy =>
                policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.IctSuperAdmin, AppRoles.HrAdmin)));

            // Trigger sync - admins only
            options.AddPolicy(PolicyNames.CanSync, policy =>
                policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.IctSuperAdmin, AppRoles.HrAdmin)));

            // Manage user roles - ICT admin only
            options.AddPolicy(PolicyNames.CanManageRoles, policy =>
                policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.IctSuperAdmin)));
        });

        // Register authorization handlers
        services.AddScoped<IAuthorizationHandler, DatabaseRoleAuthorizationHandler>();
        services.AddScoped<IAuthorizationHandler, EmployeeScopeAuthorizationHandler>();
        services.AddScoped<IAuthorizationHandler, GroupScopeAuthorizationHandler>();

        return services;
    }
}
