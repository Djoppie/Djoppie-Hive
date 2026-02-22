using DjoppieHive.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace DjoppieHive.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<DistributionGroup> DistributionGroups => Set<DistributionGroup>();
    public DbSet<EmployeeGroupMembership> EmployeeGroupMemberships => Set<EmployeeGroupMembership>();
    public DbSet<SyncLogboek> SyncLogboeken => Set<SyncLogboek>();
    public DbSet<ValidatieVerzoek> ValidatieVerzoeken => Set<ValidatieVerzoek>();
    public DbSet<VrijwilligerDetails> VrijwilligerDetails => Set<VrijwilligerDetails>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Employee configuratie
        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.EntraObjectId).IsUnique();
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.Bron);
            entity.HasIndex(e => e.EmployeeType);
            entity.HasIndex(e => e.ArbeidsRegime);
            entity.HasIndex(e => e.DienstId);
            entity.Property(e => e.DisplayName).HasMaxLength(256).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(256).IsRequired();
            entity.Property(e => e.EntraObjectId).HasMaxLength(36).IsRequired();
            entity.Property(e => e.PhotoUrl).HasMaxLength(500);
            entity.Property(e => e.Telefoonnummer).HasMaxLength(50);

            // Relatie met Dienst (DistributionGroup)
            entity.HasOne(e => e.Dienst)
                .WithMany()
                .HasForeignKey(e => e.DienstId)
                .OnDelete(DeleteBehavior.SetNull);

            // One-to-one relatie met VrijwilligerDetails
            entity.HasOne(e => e.VrijwilligerDetails)
                .WithOne(v => v.Employee)
                .HasForeignKey<VrijwilligerDetails>(v => v.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // DistributionGroup configuratie
        modelBuilder.Entity<DistributionGroup>(entity =>
        {
            entity.HasKey(g => g.Id);
            entity.HasIndex(g => g.EntraObjectId).IsUnique();
            entity.HasIndex(g => g.DisplayName);
            entity.HasIndex(g => g.Niveau);
            entity.Property(g => g.DisplayName).HasMaxLength(256).IsRequired();
            entity.Property(g => g.Email).HasMaxLength(256).IsRequired();
            entity.Property(g => g.EntraObjectId).HasMaxLength(36).IsRequired();

            // Zelf-refererende relatie voor hierarchie (Sector -> Diensten)
            entity.HasOne(g => g.BovenliggendeGroep)
                .WithMany(g => g.OnderliggendeGroepen)
                .HasForeignKey(g => g.BovenliggendeGroepId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // EmployeeGroupMembership (veel-op-veel)
        modelBuilder.Entity<EmployeeGroupMembership>(entity =>
        {
            entity.HasKey(m => new { m.EmployeeId, m.DistributionGroupId });
            entity.HasIndex(m => m.Bron);
            entity.HasIndex(m => m.IsActief);

            entity.HasOne(m => m.Employee)
                .WithMany(e => e.GroupMemberships)
                .HasForeignKey(m => m.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.DistributionGroup)
                .WithMany(g => g.Members)
                .HasForeignKey(m => m.DistributionGroupId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // SyncLogboek configuratie
        modelBuilder.Entity<SyncLogboek>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.HasIndex(s => s.Status);
            entity.HasIndex(s => s.GeStartOp);
            entity.Property(s => s.GestartDoor).HasMaxLength(256);
            entity.Property(s => s.Foutmelding).HasMaxLength(1000);
        });

        // ValidatieVerzoek configuratie
        modelBuilder.Entity<ValidatieVerzoek>(entity =>
        {
            entity.HasKey(v => v.Id);
            entity.HasIndex(v => v.Status);
            entity.HasIndex(v => v.Type);
            entity.HasIndex(v => v.AangemaaktOp);
            entity.Property(v => v.Beschrijving).HasMaxLength(500).IsRequired();
            entity.Property(v => v.ToegwezenAanRol).HasMaxLength(50);
            entity.Property(v => v.AfgehandeldDoor).HasMaxLength(256);
            entity.Property(v => v.AfhandelingNotities).HasMaxLength(1000);

            entity.HasOne(v => v.Employee)
                .WithMany(e => e.ValidatieVerzoeken)
                .HasForeignKey(v => v.EmployeeId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(v => v.DistributionGroup)
                .WithMany(g => g.ValidatieVerzoeken)
                .HasForeignKey(v => v.DistributionGroupId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(v => v.SyncLogboek)
                .WithMany(s => s.ValidatieVerzoeken)
                .HasForeignKey(v => v.SyncLogboekId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // VrijwilligerDetails configuratie
        modelBuilder.Entity<VrijwilligerDetails>(entity =>
        {
            entity.HasKey(v => v.Id);
            entity.HasIndex(v => v.EmployeeId).IsUnique();
            entity.Property(v => v.Beschikbaarheid).HasMaxLength(200);
            entity.Property(v => v.Specialisaties).HasMaxLength(500);
            entity.Property(v => v.NoodContactNaam).HasMaxLength(256);
            entity.Property(v => v.NoodContactTelefoon).HasMaxLength(50);
            entity.Property(v => v.Opmerkingen).HasMaxLength(1000);
        });
    }
}
