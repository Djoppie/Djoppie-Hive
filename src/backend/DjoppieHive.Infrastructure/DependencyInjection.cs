using DjoppieHive.Core.Interfaces;
using DjoppieHive.Infrastructure.Data;
using DjoppieHive.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

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

        // Register services
        services.AddScoped<IDistributionGroupService, GraphDistributionGroupService>();
        services.AddScoped<IEmployeeService, GraphEmployeeService>();

        return services;
    }
}
