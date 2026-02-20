using DjoppiePaparazzi.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace DjoppiePaparazzi.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<DistributionGroup> DistributionGroups => Set<DistributionGroup>();
    public DbSet<EmployeeGroupMembership> EmployeeGroupMemberships => Set<EmployeeGroupMembership>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Employee configuration
        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.EntraObjectId).IsUnique();
            entity.HasIndex(e => e.Email);
            entity.Property(e => e.DisplayName).HasMaxLength(256).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(256).IsRequired();
            entity.Property(e => e.EntraObjectId).HasMaxLength(36).IsRequired();
        });

        // DistributionGroup configuration
        modelBuilder.Entity<DistributionGroup>(entity =>
        {
            entity.HasKey(g => g.Id);
            entity.HasIndex(g => g.EntraObjectId).IsUnique();
            entity.HasIndex(g => g.DisplayName);
            entity.Property(g => g.DisplayName).HasMaxLength(256).IsRequired();
            entity.Property(g => g.Email).HasMaxLength(256).IsRequired();
            entity.Property(g => g.EntraObjectId).HasMaxLength(36).IsRequired();
        });

        // EmployeeGroupMembership (many-to-many)
        modelBuilder.Entity<EmployeeGroupMembership>(entity =>
        {
            entity.HasKey(m => new { m.EmployeeId, m.DistributionGroupId });

            entity.HasOne(m => m.Employee)
                .WithMany(e => e.GroupMemberships)
                .HasForeignKey(m => m.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.DistributionGroup)
                .WithMany(g => g.Members)
                .HasForeignKey(m => m.DistributionGroupId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
