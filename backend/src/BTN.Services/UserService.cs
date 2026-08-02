using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BTN.Core.DTOs;
using BTN.Core.DTOs.Users;
using BTN.Core.Entities;
using BTN.Core.Enums;
using BTN.Core.Interfaces;
using BTN.Infrastructure.Data;

namespace BTN.Services
{
    public class UserService : IUserService
    {
        private readonly BtnDbContext _context;

        public UserService(BtnDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<UserResponse>> GetUsersAsync(int page, int pageSize, string? search, string? role, string? status)
        {
            var query = _context.Users
                .Include(u => u.Role)
                .Include(u => u.CreatedByUser)
                .AsQueryable();

            // Search filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(u => u.FullName.ToLower().Contains(lowerSearch) || u.Email.ToLower().Contains(lowerSearch));
            }

            // Role filter
            if (!string.IsNullOrWhiteSpace(role))
            {
                query = query.Where(u => u.Role.Name == role);
            }

            // Status filter
            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<UserStatus>(status, true, out var statusEnum))
            {
                query = query.Where(u => u.Status == statusEnum);
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => MapToUserResponse(u))
                .ToListAsync();

            return new PagedResult<UserResponse>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<UserResponse?> GetUserByIdAsync(Guid id)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.CreatedByUser)
                .FirstOrDefaultAsync(u => u.Id == id);

            return user != null ? MapToUserResponse(user) : null;
        }

        public async Task<UserResponse> CreateUserAsync(CreateUserRequest request, Guid adminId)
        {
            // Email uniqueness check
            var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
            if (emailExists)
            {
                throw new InvalidOperationException("Email address is already in use.");
            }

            // Role check
            var role = await _context.Roles.FindAsync(request.RoleId);
            if (role == null)
            {
                throw new KeyNotFoundException("Specified role was not found.");
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12);

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                PasswordHash = passwordHash,
                RoleId = request.RoleId,
                Status = UserStatus.Active,
                CreatedBy = adminId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Fetch created user with Role for mapping
            var createdUser = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.CreatedByUser)
                .FirstAsync(u => u.Id == user.Id);

            // Audit log
            var auditLog = new AuditLog
            {
                UserId = adminId,
                Action = "User.Created",
                EntityType = "User",
                EntityId = user.Id,
                NewValues = JsonSerializer.Serialize(new { user.FullName, user.Email, user.Phone, RoleName = role.Name, Status = user.Status.ToString() }),
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return MapToUserResponse(createdUser);
        }

        public async Task<UserResponse?> UpdateUserAsync(Guid id, UpdateUserRequest request, Guid adminId)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return null;
            }

            // Prevent self deactivation
            if (user.Id == adminId && request.Status != UserStatus.Active)
            {
                throw new InvalidOperationException("You cannot deactivate or suspend your own account.");
            }

            var role = await _context.Roles.FindAsync(request.RoleId);
            if (role == null)
            {
                throw new KeyNotFoundException("Specified role was not found.");
            }

            // Capture old values for audit
            var oldValues = JsonSerializer.Serialize(new { user.FullName, user.Phone, RoleName = user.Role.Name, Status = user.Status.ToString() });

            // Apply updates
            user.FullName = request.FullName;
            user.Phone = request.Phone;
            user.RoleId = request.RoleId;
            user.Status = request.Status;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Fetch updated user with role for response mapping
            var updatedUser = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.CreatedByUser)
                .FirstAsync(u => u.Id == user.Id);

            var newValues = JsonSerializer.Serialize(new { updatedUser.FullName, updatedUser.Phone, RoleName = role.Name, Status = updatedUser.Status.ToString() });

            // Audit Log
            var auditLog = new AuditLog
            {
                UserId = adminId,
                Action = "User.Updated",
                EntityType = "User",
                EntityId = user.Id,
                OldValues = oldValues,
                NewValues = newValues,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return MapToUserResponse(updatedUser);
        }

        public async Task<bool> DeactivateUserAsync(Guid id, Guid adminId)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return false;
            }

            if (user.Id == adminId)
            {
                throw new InvalidOperationException("You cannot deactivate your own account.");
            }

            user.Status = UserStatus.Inactive;
            user.UpdatedAt = DateTime.UtcNow;

            // Revoke active refresh tokens
            var activeTokens = await _context.RefreshTokens
                .Where(t => t.UserId == id && !t.IsRevoked)
                .ToListAsync();

            foreach (var token in activeTokens)
            {
                token.IsRevoked = true;
            }

            // Audit Log
            var auditLog = new AuditLog
            {
                UserId = adminId,
                Action = "User.Deactivated",
                EntityType = "User",
                EntityId = user.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<RoleDto>> GetRolesAsync()
        {
            return await _context.Roles
                .Select(r => new RoleDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Description = r.Description
                })
                .ToListAsync();
        }

        private static UserResponse MapToUserResponse(User user)
        {
            return new UserResponse
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Phone = user.Phone,
                RoleId = user.RoleId,
                Role = user.Role?.Name ?? string.Empty,
                Status = user.Status.ToString(),
                LastLoginAt = user.LastLoginAt,
                CreatedBy = user.CreatedByUser?.FullName,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };
        }
    }
}
