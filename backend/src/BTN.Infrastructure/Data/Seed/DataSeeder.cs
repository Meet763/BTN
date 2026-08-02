using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BTN.Core.Entities;
using BTN.Core.Enums;
using BCrypt.Net;

namespace BTN.Infrastructure.Data.Seed
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(BtnDbContext context)
        {
            // Auto-migrate on startup
            await context.Database.MigrateAsync();

            // 1. Seed Roles
            var platformOwnerRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == UserRole.PlatformOwner.ToString());
            if (platformOwnerRole == null)
            {
                platformOwnerRole = new Role
                {
                    Name = UserRole.PlatformOwner.ToString(),
                    Description = "Full access to entire BTN platform"
                };
                context.Roles.Add(platformOwnerRole);
            }

            var agentRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == UserRole.VerificationAgent.ToString());
            if (agentRole == null)
            {
                agentRole = new Role
                {
                    Name = UserRole.VerificationAgent.ToString(),
                    Description = "Can verify/reject leads only"
                };
                context.Roles.Add(agentRole);
            }

            var companyAdminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == UserRole.CompanyAdmin.ToString());
            if (companyAdminRole == null)
            {
                companyAdminRole = new Role
                {
                    Name = UserRole.CompanyAdmin.ToString(),
                    Description = "Access to own company data (future use)"
                };
                context.Roles.Add(companyAdminRole);
            }

            await context.SaveChangesAsync();

            // 2. Seed Default Admin User
            var adminEmail = "admin@btn.com";
            var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);
            if (adminUser == null)
            {
                var passwordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123", 12);
                adminUser = new User
                {
                    FullName = "BTN Admin",
                    Email = adminEmail,
                    PasswordHash = passwordHash,
                    Phone = "1234567890",
                    RoleId = platformOwnerRole.Id,
                    Status = UserStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                context.Users.Add(adminUser);
                await context.SaveChangesAsync();
            }
        }
    }
}
