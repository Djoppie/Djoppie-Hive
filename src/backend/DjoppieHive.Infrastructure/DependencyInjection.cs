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
        // Database context
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrEmpty(connectionString) || connectionString.Contains("Data Source=:memory:"))
        {
            // Use SQLite for local development
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlite("Data Source=djoppie-paparazzi.db"));
        }
        else
        {
            // Use SQL Server for production
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString));
        }

        // Register ValidatieVerzoekService (doesn't depend on Graph)
        services.AddScoped<IValidatieVerzoekService, ValidatieVerzoekService>();

        // Register Graph-dependent services or stubs based on GraphServiceClient availability
        var graphClientRegistered = services.Any(s => s.ServiceType == typeof(GraphServiceClient));
        if (graphClientRegistered)
        {
            // Real Graph implementations
            services.AddScoped<IDistributionGroupService, GraphDistributionGroupService>();
            services.AddScoped<IEmployeeService, GraphEmployeeService>();
            services.AddScoped<ISyncService, SyncService>();
        }
        else
        {
            // Stub implementations for local development without Graph credentials
            services.AddScoped<IDistributionGroupService, StubDistributionGroupService>();
            services.AddScoped<IEmployeeService, StubEmployeeService>();
            services.AddScoped<ISyncService, StubSyncService>();
        }

        return services;
    }
}
