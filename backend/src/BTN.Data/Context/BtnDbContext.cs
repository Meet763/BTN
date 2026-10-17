using System.Text.RegularExpressions;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;
using CustomerEntity = BTN.Data.Entities.Customer;
using EmployeeEntity = BTN.Data.Entities.Employee;
using LeadEntity = BTN.Data.Entities.Lead;
using PurchaseEntity = BTN.Data.Entities.Purchase;
using UserEntity = BTN.Data.Entities.User;
using WalletEntity = BTN.Data.Entities.Wallet;

namespace BTN.Data.Context;

public class BtnDbContext : DbContext
{
    public BtnDbContext(DbContextOptions<BtnDbContext> options) : base(options)
    {
    }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<EmployeeEntity> Employees => Set<EmployeeEntity>();
    public DbSet<Entities.OrgUnit> OrgUnits => Set<Entities.OrgUnit>();
    public DbSet<CustomerEntity> Customers => Set<CustomerEntity>();
    public DbSet<LeadEntity> Leads => Set<LeadEntity>();
    public DbSet<VerificationMethod> VerificationMethods => Set<VerificationMethod>();
    public DbSet<LeadVerification> LeadVerifications => Set<LeadVerification>();
    public DbSet<LeadAssignment> LeadAssignments => Set<LeadAssignment>();
    public DbSet<LeadStatusHistory> LeadStatusHistory => Set<LeadStatusHistory>();
    public DbSet<WalletEntity> Wallets => Set<WalletEntity>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<PaymentOrder> PaymentOrders => Set<PaymentOrder>();
    public DbSet<PurchaseEntity> Purchases => Set<PurchaseEntity>();
    public DbSet<BillingOrganization> BillingOrganizations => Set<BillingOrganization>();
    public DbSet<BillingCustomer> BillingCustomers => Set<BillingCustomer>();
    public DbSet<BillingProduct> BillingProducts => Set<BillingProduct>();
    public DbSet<BillingQuotation> BillingQuotations => Set<BillingQuotation>();
    public DbSet<BillingQuotationLine> BillingQuotationLines => Set<BillingQuotationLine>();
    public DbSet<BillingInvoice> BillingInvoices => Set<BillingInvoice>();
    public DbSet<BillingInvoiceLine> BillingInvoiceLines => Set<BillingInvoiceLine>();
    public DbSet<BillingPayment> BillingPayments => Set<BillingPayment>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<CampaignSubmission> CampaignSubmissions => Set<CampaignSubmission>();
    public DbSet<CampaignFormAppearance> CampaignFormAppearances => Set<CampaignFormAppearance>();
    public DbSet<ManagedForm> ManagedForms => Set<ManagedForm>();
    public DbSet<ManagedFormField> ManagedFormFields => Set<ManagedFormField>();
    public DbSet<ManagedFormSubmission> ManagedFormSubmissions => Set<ManagedFormSubmission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasOne(u => u.Role).WithMany(r => r.Users).HasForeignKey(u => u.RoleId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(u => u.CreatedByUser).WithMany().HasForeignKey(u => u.CreatedBy).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(u => u.Employee).WithOne(e => e.User).HasForeignKey<EmployeeEntity>(e => e.UserId);
            entity.HasOne(u => u.Customer).WithOne(c => c.User).HasForeignKey<CustomerEntity>(c => c.UserId);
        });

        modelBuilder.Entity<Role>().HasIndex(r => r.Name).IsUnique();

        modelBuilder.Entity<EmployeeEntity>(entity =>
        {
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasOne(e => e.OrgUnit).WithMany(o => o.Members).HasForeignKey(e => e.OrgUnitId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.ReportsToEmployee).WithMany(e => e.DirectReports).HasForeignKey(e => e.ReportsToEmployeeId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Entities.OrgUnit>(entity =>
        {
            entity.HasIndex(o => o.Code).IsUnique();
            entity.HasOne(o => o.ParentOrgUnit).WithMany(o => o.Children).HasForeignKey(o => o.ParentOrgUnitId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(o => o.HeadEmployee).WithMany(e => e.HeadedOrgUnits).HasForeignKey(o => o.HeadEmployeeId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<CustomerEntity>().HasIndex(c => c.UserId).IsUnique();

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasOne(t => t.User).WithMany(u => u.RefreshTokens).HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LeadEntity>(entity =>
        {
            entity.Property(l => l.RawData).HasColumnType("jsonb");
            entity.HasOne(l => l.VerifiedByUser).WithMany(u => u.VerifiedLeads).HasForeignKey(l => l.VerifiedBy).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(l => l.DuplicateOfLead).WithMany().HasForeignKey(l => l.DuplicateOfLeadId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(l => l.AssignedEmployee).WithMany(e => e.AssignedLeads).HasForeignKey(l => l.AssignedEmployeeId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(l => l.OrgUnit).WithMany(o => o.Leads).HasForeignKey(l => l.OrgUnitId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(l => l.AssignedHeadEmployee).WithMany().HasForeignKey(l => l.AssignedHeadEmployeeId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(l => l.Purchase).WithOne(p => p.Lead).HasForeignKey<PurchaseEntity>(p => p.LeadId);
        });

        modelBuilder.Entity<LeadVerification>(entity =>
        {
            entity.HasOne(lv => lv.Lead).WithMany(l => l.Verifications).HasForeignKey(lv => lv.LeadId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(lv => lv.VerifiedByUser).WithMany(u => u.LeadVerifications).HasForeignKey(lv => lv.VerifiedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(lv => lv.Employee).WithMany().HasForeignKey(lv => lv.EmployeeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(lv => lv.VerificationMethod).WithMany().HasForeignKey(lv => lv.VerificationMethodId).OnDelete(DeleteBehavior.Restrict);
            entity.Property(lv => lv.FormSnapshotJson).HasColumnType("jsonb");
        });

        modelBuilder.Entity<LeadAssignment>(entity =>
        {
            entity.HasOne(a => a.Lead).WithMany(l => l.Assignments).HasForeignKey(a => a.LeadId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(a => a.Employee).WithMany(e => e.LeadAssignments).HasForeignKey(a => a.EmployeeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.AssignedByUser).WithMany().HasForeignKey(a => a.AssignedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LeadStatusHistory>(entity =>
        {
            entity.HasOne(h => h.Lead).WithMany(l => l.StatusHistory).HasForeignKey(h => h.LeadId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(h => h.ChangedByUser).WithMany().HasForeignKey(h => h.ChangedBy).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<WalletEntity>(entity =>
        {
            entity.HasIndex(w => w.CustomerId).IsUnique();
            // PostgreSQL has no SQL Server-style rowversion; manage concurrency token in app code.
            entity.Property(w => w.RowVersion)
                .IsConcurrencyToken()
                .IsRequired()
                .HasDefaultValueSql("'\\x00000000000000000000000000000000'");
            entity.HasOne(w => w.Customer).WithOne(c => c.Wallet).HasForeignKey<WalletEntity>(w => w.CustomerId);
        });

        modelBuilder.Entity<WalletTransaction>(entity =>
        {
            entity.HasIndex(t => t.IdempotencyKey).IsUnique().HasFilter("idempotency_key IS NOT NULL");
            entity.HasOne(t => t.Wallet).WithMany(w => w.Transactions).HasForeignKey(t => t.WalletId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PurchaseEntity>().HasIndex(p => p.LeadId).IsUnique();

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(al => al.OldValues).HasColumnType("jsonb");
            entity.Property(al => al.NewValues).HasColumnType("jsonb");
            entity.HasOne(al => al.User).WithMany(u => u.AuditLogs).HasForeignKey(al => al.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<CampaignSubmission>(entity =>
        {
            entity.HasIndex(c => c.Platform);
            entity.HasIndex(c => c.CreatedAt);
            entity.HasIndex(c => c.Phone);
            entity.HasIndex(c => c.GiftStatus);
            entity.HasIndex(c => c.JobRole);
        });

        modelBuilder.Entity<ManagedForm>(entity =>
        {
            entity.HasIndex(f => f.Slug).IsUnique();
            entity.HasMany(f => f.Fields).WithOne(f => f.Form).HasForeignKey(f => f.FormId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(f => f.Submissions).WithOne(s => s.Form).HasForeignKey(s => s.FormId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ManagedFormField>(entity =>
        {
            entity.HasIndex(f => new { f.FormId, f.FieldKey }).IsUnique();
            entity.HasIndex(f => new { f.FormId, f.SortOrder });
        });

        modelBuilder.Entity<ManagedFormSubmission>(entity =>
        {
            entity.Property(s => s.AnswersJson).HasColumnType("jsonb");
            entity.HasIndex(s => s.CreatedAt);
        });

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
