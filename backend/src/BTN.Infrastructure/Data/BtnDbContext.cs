using System;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using BTN.Core.Entities;
using BTN.Core.Enums;

namespace BTN.Infrastructure.Data
{
    public class BtnDbContext : DbContext
    {
        public BtnDbContext(DbContextOptions<BtnDbContext> options) : base(options)
        {
        }

        public DbSet<Role> Roles { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Lead> Leads { get; set; } = null!;
        public DbSet<LeadVerification> LeadVerifications { get; set; } = null!;
        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();
                
                entity.HasOne(u => u.Role)
                    .WithMany(r => r.Users)
                    .HasForeignKey(u => u.RoleId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(u => u.CreatedByUser)
                    .WithMany()
                    .HasForeignKey(u => u.CreatedBy)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Role configuration
            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasIndex(r => r.Name).IsUnique();
            });

            // RefreshToken configuration
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasOne(t => t.User)
                    .WithMany(u => u.RefreshTokens)
                    .HasForeignKey(t => t.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Lead configuration
            modelBuilder.Entity<Lead>(entity =>
            {
                // Store RawData as JSONB column in PostgreSQL
                entity.Property(l => l.RawData)
                    .HasColumnType("jsonb");

                entity.HasOne(l => l.VerifiedByUser)
                    .WithMany(u => u.VerifiedLeads)
                    .HasForeignKey(l => l.VerifiedBy)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(l => l.DuplicateOfLead)
                    .WithMany()
                    .HasForeignKey(l => l.DuplicateOfLeadId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // LeadVerification configuration
            modelBuilder.Entity<LeadVerification>(entity =>
            {
                entity.HasKey(lv => lv.Id);
                
                // One-to-one relationship with Lead
                entity.HasOne(lv => lv.Lead)
                    .WithOne(l => l.Verification)
                    .HasForeignKey<LeadVerification>(lv => lv.LeadId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(lv => lv.VerifiedByUser)
                    .WithMany(u => u.LeadVerifications)
                    .HasForeignKey(lv => lv.VerifiedBy)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // AuditLog configuration
            modelBuilder.Entity<AuditLog>(entity =>
            {
                // Store OldValues and NewValues as JSONB
                entity.Property(al => al.OldValues).HasColumnType("jsonb");
                entity.Property(al => al.NewValues).HasColumnType("jsonb");

                entity.HasOne(al => al.User)
                    .WithMany(u => u.AuditLogs)
                    .HasForeignKey(al => al.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Convert all database objects (tables, columns, keys, indices) to snake_case for PostgreSQL
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                var tableName = entity.GetTableName();
                if (tableName != null)
                {
                    entity.SetTableName(ToSnakeCase(tableName));
                }

                foreach (var property in entity.GetProperties())
                {
                    property.SetColumnName(ToSnakeCase(property.Name));
                }

                foreach (var key in entity.GetKeys())
                {
                    var keyName = key.GetName();
                    if (keyName != null)
                    {
                        key.SetName(ToSnakeCase(keyName));
                    }
                }

                foreach (var fk in entity.GetForeignKeys())
                {
                    var constraintName = fk.GetConstraintName();
                    if (constraintName != null)
                    {
                        fk.SetConstraintName(ToSnakeCase(constraintName));
                    }
                }

                foreach (var index in entity.GetIndexes())
                {
                    var indexName = index.GetDatabaseName();
                    if (indexName != null)
                    {
                        index.SetDatabaseName(ToSnakeCase(indexName));
                    }
                }
            }
        }

        private static string ToSnakeCase(string input)
        {
            if (string.IsNullOrEmpty(input)) return input;
            var startUnderscore = Regex.Match(input, @"^_*");
            return startUnderscore + Regex.Replace(input, @"([a-z0-9])([A-Z])", "$1_$2").ToLower();
        }
    }
}
