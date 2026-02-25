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
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<EventParticipant> EventParticipants => Set<EventParticipant>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    // Hybrid Groups System
    public DbSet<DynamicGroup> DynamicGroups => Set<DynamicGroup>();
    public DbSet<LocalGroup> LocalGroups => Set<LocalGroup>();
    public DbSet<LocalGroupMember> LocalGroupMembers => Set<LocalGroupMember>();

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

        // UserRole configuratie
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.HasIndex(r => r.EntraObjectId);
            entity.HasIndex(r => r.Email);
            entity.HasIndex(r => r.Role);
            entity.HasIndex(r => r.IsActive);
            // Unique constraint: een gebruiker kan elke rol maar 1x hebben
            entity.HasIndex(r => new { r.EntraObjectId, r.Role }).IsUnique();

            entity.Property(r => r.EntraObjectId).HasMaxLength(36).IsRequired();
            entity.Property(r => r.Email).HasMaxLength(256).IsRequired();
            entity.Property(r => r.DisplayName).HasMaxLength(256).IsRequired();
            entity.Property(r => r.Role).HasMaxLength(50).IsRequired();
            entity.Property(r => r.CreatedBy).HasMaxLength(256);
            entity.Property(r => r.UpdatedBy).HasMaxLength(256);

            // Relatie met Sector (DistributionGroup)
            entity.HasOne(r => r.Sector)
                .WithMany()
                .HasForeignKey(r => r.SectorId)
                .OnDelete(DeleteBehavior.SetNull);

            // Relatie met Dienst (DistributionGroup)
            entity.HasOne(r => r.Dienst)
                .WithMany()
                .HasForeignKey(r => r.DienstId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Event configuratie
        modelBuilder.Entity<Event>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.Datum);
            entity.HasIndex(e => e.AangemaaktOp);
            entity.Property(e => e.Titel).HasMaxLength(256).IsRequired();
            entity.Property(e => e.Beschrijving).HasMaxLength(2000).IsRequired();
            entity.Property(e => e.AangemaaktDoor).HasMaxLength(256);
            entity.Property(e => e.VerstuurdDoor).HasMaxLength(256);

            // Relatie met DistributieGroep
            entity.HasOne(e => e.DistributieGroep)
                .WithMany()
                .HasForeignKey(e => e.DistributieGroepId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // EventParticipant configuratie (veel-op-veel)
        modelBuilder.Entity<EventParticipant>(entity =>
        {
            entity.HasKey(p => new { p.EventId, p.EmployeeId });
            entity.HasIndex(p => p.EmailVerstuurd);

            entity.HasOne(p => p.Event)
                .WithMany(e => e.Deelnemers)
                .HasForeignKey(p => p.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.Employee)
                .WithMany()
                .HasForeignKey(p => p.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AuditLog configuratie
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.HasIndex(a => a.Timestamp);
            entity.HasIndex(a => a.UserId);
            entity.HasIndex(a => a.Action);
            entity.HasIndex(a => a.EntityType);
            entity.HasIndex(a => a.EntityId);
            entity.HasIndex(a => a.CorrelationId);

            entity.Property(a => a.UserId).HasMaxLength(36);
            entity.Property(a => a.UserEmail).HasMaxLength(256);
            entity.Property(a => a.UserDisplayName).HasMaxLength(256);
            entity.Property(a => a.EntityDescription).HasMaxLength(256);
            entity.Property(a => a.IpAddress).HasMaxLength(45); // IPv6 max length
            entity.Property(a => a.UserAgent).HasMaxLength(500);
            entity.Property(a => a.CorrelationId).HasMaxLength(36);
            entity.Property(a => a.AdditionalInfo).HasMaxLength(1000);
            // OldValues and NewValues are unlimited (JSON)
        });

        // ============================================
        // HYBRID GROUPS SYSTEM
        // ============================================

        // DynamicGroup configuratie
        modelBuilder.Entity<DynamicGroup>(entity =>
        {
            entity.HasKey(g => g.Id);
            entity.HasIndex(g => g.DisplayName);
            entity.HasIndex(g => g.IsSystemGroup);
            entity.Property(g => g.DisplayName).HasMaxLength(256).IsRequired();
            entity.Property(g => g.Description).HasMaxLength(500);
            entity.Property(g => g.Email).HasMaxLength(256);
            entity.Property(g => g.FilterCriteria).IsRequired(); // JSON
            entity.Property(g => g.CreatedBy).HasMaxLength(256);
        });

        // LocalGroup configuratie
        modelBuilder.Entity<LocalGroup>(entity =>
        {
            entity.HasKey(g => g.Id);
            entity.HasIndex(g => g.DisplayName);
            entity.Property(g => g.DisplayName).HasMaxLength(256).IsRequired();
            entity.Property(g => g.Description).HasMaxLength(500);
            entity.Property(g => g.Email).HasMaxLength(256);
            entity.Property(g => g.CreatedBy).HasMaxLength(256);
        });

        // LocalGroupMember configuratie (veel-op-veel)
        modelBuilder.Entity<LocalGroupMember>(entity =>
        {
            entity.HasKey(m => new { m.LocalGroupId, m.EmployeeId });

            entity.HasOne(m => m.LocalGroup)
                .WithMany(g => g.Members)
                .HasForeignKey(m => m.LocalGroupId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.Employee)
                .WithMany()
                .HasForeignKey(m => m.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(m => m.AddedBy).HasMaxLength(256);
        });
    }
}
