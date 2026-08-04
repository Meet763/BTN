using BTN.Core.Enums;
using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace BTN.Data.Seed;

public static class DataSeeder
{
    public static async Task SeedAsync(BtnDbContext context)
    {
        await context.Database.MigrateAsync();

        await SeedRolesAsync(context);
        await SeedVerificationMethodsAsync(context);
        await SeedAdminUserAsync(context);
    }

    private static async Task SeedRolesAsync(BtnDbContext context)
    {
        await EnsureRoleAsync(context, UserRole.PlatformOwner.ToString(), "Full access to entire BTN platform");
        await EnsureRoleAsync(context, UserRole.Employee.ToString(), "Verifies and manages assigned leads");
        await EnsureRoleAsync(context, UserRole.Customer.ToString(), "Purchases verified leads");
        await EnsureRoleAsync(context, UserRole.VerificationAgent.ToString(), "Legacy verification agent role");
        await EnsureRoleAsync(context, UserRole.CompanyAdmin.ToString(), "Access to own company data");

        var legacyAgent = await context.Roles.FirstOrDefaultAsync(r => r.Name == UserRole.VerificationAgent.ToString());
        var employeeRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == UserRole.Employee.ToString());
        if (legacyAgent != null && employeeRole != null)
        {
            var legacyUsers = await context.Users.Where(u => u.RoleId == legacyAgent.Id).ToListAsync();
            foreach (var user in legacyUsers)
            {
                user.RoleId = employeeRole.Id;
            }
        }

        await context.SaveChangesAsync();
    }

    private static async Task EnsureRoleAsync(BtnDbContext context, string name, string description)
    {
        if (!await context.Roles.AnyAsync(r => r.Name == name))
        {
            context.Roles.Add(new Role { Name = name, Description = description });
        }
    }

    private static async Task SeedVerificationMethodsAsync(BtnDbContext context)
    {
        var methods = new (string Code, string Name, int Order)[]
        {
            ("PhoneCall", "Phone Call", 1),
            ("ManualEntry", "Manual Entry", 2),
            ("WhatsApp", "WhatsApp", 3),
            ("Email", "Email", 4),
            ("Meeting", "Meeting", 5)
        };

        foreach (var (code, name, order) in methods)
        {
            if (!await context.VerificationMethods.AnyAsync(m => m.Code == code))
            {
                context.VerificationMethods.Add(new VerificationMethod
                {
                    Code = code,
                    DisplayName = name,
                    SortOrder = order,
                    IsActive = true
                });
            }
        }

        await context.SaveChangesAsync();
    }

    private static async Task SeedAdminUserAsync(BtnDbContext context)
    {
        const string adminEmail = "admin@btn.com";
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);
        if (adminUser != null) return;

        var platformOwnerRole = await context.Roles.FirstAsync(r => r.Name == UserRole.PlatformOwner.ToString());
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123", 12);
        context.Users.Add(new Entities.User
        {
            FullName = "BTN Admin",
            Email = adminEmail,
            PasswordHash = passwordHash,
            Phone = "1234567890",
            RoleId = platformOwnerRole.Id,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();
    }
}
