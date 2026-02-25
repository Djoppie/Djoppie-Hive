using DjoppieHive.Core.Interfaces;
using DjoppieHive.Infrastructure.Data;
using DjoppieHive.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Graph;

namespace DjoppieHive.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Register audit interceptor (needs to be registered before DbContext)
        services.AddScoped<AuditSaveChangesInterceptor>();

        // Database context with audit interceptor
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrEmpty(connectionString) || connectionString.Contains("Data Source=:memory:"))
        {
            // Use SQLite for local development
            services.AddDbContext<ApplicationDbContext>((sp, options) =>
            {
                options.UseSqlite("Data Source=djoppie-paparazzi.db");
                options.AddInterceptors(sp.GetRequiredService<AuditSaveChangesInterceptor>());
            });
        }
        else
        {
            // Use SQL Server for production
            services.AddDbContext<ApplicationDbContext>((sp, options) =>
            {
                options.UseSqlServer(connectionString);
                options.AddInterceptors(sp.GetRequiredService<AuditSaveChangesInterceptor>());
            });
        }

        // Register ValidatieVerzoekService (doesn't depend on Graph)
        services.AddScoped<IValidatieVerzoekService, ValidatieVerzoekService>();

        // Register StatisticsService (doesn't depend on Graph)
        services.AddScoped<IStatisticsService, StatisticsService>();

        // Register UserRoleService (doesn't depend on Graph)
        services.AddScoped<IUserRoleService, UserRoleService>();

        // Register AuditService for manual audit logging
        services.AddScoped<IAuditService, AuditService>();

        // Register UnifiedGroupService (Hybrid Groups System)
        services.AddScoped<IUnifiedGroupService, UnifiedGroupService>();

        // Register database-backed EmployeeService (primary service for CRUD operations)
        services.AddScoped<EmployeeService>();

        // Register Graph-dependent services or stubs based on GraphServiceClient availability
        var graphClientRegistered = services.Any(s => s.ServiceType == typeof(GraphServiceClient));
        if (graphClientRegistered)
        {
            // Real Graph implementations
            services.AddScoped<IDistributionGroupService, GraphDistributionGroupService>();

            // Use database-backed EmployeeService as primary IEmployeeService
            // GraphEmployeeService is available for sync operations but not registered as IEmployeeService
            services.AddScoped<IEmployeeService>(sp => sp.GetRequiredService<EmployeeService>());
            services.AddScoped<GraphEmployeeService>(); // Available for sync if needed

            services.AddScoped<ISyncService, SyncService>();
        }
        else
        {
            // Stub implementations for local development without Graph credentials
            services.AddScoped<IDistributionGroupService, StubDistributionGroupService>();

            // Use database-backed EmployeeService (works with or without Graph)
            services.AddScoped<IEmployeeService>(sp => sp.GetRequiredService<EmployeeService>());

            services.AddScoped<ISyncService, StubSyncService>();
        }

        return services;
    }
}
