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

        // Gebruik SQLite voor design-time operaties
        optionsBuilder.UseSqlite("Data Source=djoppie-hive-design.db");

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
