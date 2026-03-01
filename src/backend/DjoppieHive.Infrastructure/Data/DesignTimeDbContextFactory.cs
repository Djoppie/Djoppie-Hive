using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DjoppieHive.Infrastructure.Data;

/// <summary>
/// Factory voor het aanmaken van ApplicationDbContext tijdens design-time operaties
/// zoals EF Core migraties.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();

        // Check for SQL Server connection string in environment variable
        var sqlServerConnection = Environment.GetEnvironmentVariable("AZURE_SQL_CONNECTION");

        if (!string.IsNullOrEmpty(sqlServerConnection))
        {
            // Use SQL Server for Azure migrations
            optionsBuilder.UseSqlServer(sqlServerConnection);
        }
        else
        {
            // Gebruik SQLite voor local design-time operaties
            optionsBuilder.UseSqlite("Data Source=djoppie-hive-design.db");
        }

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
