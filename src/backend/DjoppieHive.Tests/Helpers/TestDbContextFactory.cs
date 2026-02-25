using DjoppieHive.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieHive.Tests.Helpers;

/// <summary>
/// Factory for creating in-memory database contexts for testing.
/// </summary>
public static class TestDbContextFactory
{
    /// <summary>
    /// Creates a new ApplicationDbContext with an in-memory database.
    /// Each call creates a unique database to prevent test interference.
    /// </summary>
    public static ApplicationDbContext Create(string? databaseName = null)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString())
            .Options;

        var context = new ApplicationDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    /// <summary>
    /// Creates a context and seeds it with test data.
    /// </summary>
    public static ApplicationDbContext CreateWithTestData()
    {
        var context = Create();
        SeedTestData(context);
        return context;
    }

    private static void SeedTestData(ApplicationDbContext context)
    {
        // Add test sectors
        var sectorOrganisatie = new Core.Entities.DistributionGroup
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            EntraObjectId = "sector-org-entra-id",
            DisplayName = "MG-SECTOR-Organisatie",
            Email = "mg-sector-organisatie@diepenbeek.be",
            Niveau = Core.Enums.GroepNiveau.Sector,
            CreatedAt = DateTime.UtcNow
        };

        var dienstBurgerzaken = new Core.Entities.DistributionGroup
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            EntraObjectId = "dienst-burgerzaken-entra-id",
            DisplayName = "MG-Burgerzaken",
            Email = "mg-burgerzaken@diepenbeek.be",
            Niveau = Core.Enums.GroepNiveau.Dienst,
            BovenliggendeGroepId = sectorOrganisatie.Id,
            CreatedAt = DateTime.UtcNow
        };

        context.DistributionGroups.AddRange(sectorOrganisatie, dienstBurgerzaken);

        // Add test employees
        var employee1 = new Core.Entities.Employee
        {
            Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            EntraObjectId = "entra-id-1",
            DisplayName = "Jan Janssen",
            GivenName = "Jan",
            Surname = "Janssen",
            Email = "jan.janssen@diepenbeek.be",
            JobTitle = "Administratief Medewerker",
            Department = "Burgerzaken",
            EmployeeType = Core.Enums.EmployeeType.Personeel,
            ArbeidsRegime = Core.Enums.ArbeidsRegime.Voltijds,
            IsActive = true,
            Bron = Core.Enums.GegevensBron.AzureAD,
            DienstId = dienstBurgerzaken.Id,
            CreatedAt = DateTime.UtcNow
        };

        var employee2 = new Core.Entities.Employee
        {
            Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            EntraObjectId = "entra-id-2",
            DisplayName = "Piet Pietersen",
            GivenName = "Piet",
            Surname = "Pietersen",
            Email = "piet.pietersen@diepenbeek.be",
            JobTitle = "Vrijwilliger Cultuur",
            EmployeeType = Core.Enums.EmployeeType.Vrijwilliger,
            ArbeidsRegime = Core.Enums.ArbeidsRegime.Vrijwilliger,
            IsActive = true,
            Bron = Core.Enums.GegevensBron.Handmatig,
            IsHandmatigToegevoegd = true,
            CreatedAt = DateTime.UtcNow
        };

        var inactiveEmployee = new Core.Entities.Employee
        {
            Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            EntraObjectId = "entra-id-3",
            DisplayName = "Karel Karelsen",
            GivenName = "Karel",
            Surname = "Karelsen",
            Email = "karel.karelsen@diepenbeek.be",
            EmployeeType = Core.Enums.EmployeeType.Personeel,
            ArbeidsRegime = Core.Enums.ArbeidsRegime.Deeltijds,
            IsActive = false,
            Bron = Core.Enums.GegevensBron.AzureAD,
            CreatedAt = DateTime.UtcNow
        };

        context.Employees.AddRange(employee1, employee2, inactiveEmployee);
        context.SaveChanges();
    }
}
