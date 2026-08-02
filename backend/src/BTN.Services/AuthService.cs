using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BTN.Core.DTOs.Auth;
using BTN.Core.DTOs.Users;
using BTN.Core.Entities;
using BTN.Core.Enums;
using BTN.Core.Interfaces;
using BTN.Infrastructure.Data;
using BCrypt.Net;

namespace BTN.Services
{
    public class AuthService : IAuthService
    {
        private readonly BtnDbContext _context;
        private readonly ITokenService _tokenService;

        public AuthService(BtnDbContext context, ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request, string? ipAddress)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

            if (user == null)
            {
                return null;
            }

            // Verify status
            if (user.Status != UserStatus.Active)
            {
                return null;
            }

            // Verify password
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return null;
            }

            // Generate tokens
            var accessToken = _tokenService.GenerateAccessToken(user);
            var refreshTokenEntity = _tokenService.GenerateRefreshToken(user.Id);

            // Save refresh token
            _context.RefreshTokens.Add(refreshTokenEntity);

            // Update user last login
            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            // Log Audit
            var auditLog = new AuditLog
            {
                UserId = user.Id,
                Action = "Auth.Login",
                EntityType = "User",
                EntityId = user.Id,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshTokenEntity.Token,
                ExpiresIn = 3600, // 1 hour in seconds
                User = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Role = user.Role.Name
                }
            };
        }

        public async Task<LoginResponse?> RefreshAsync(string refreshToken)
        {
            var tokenEntity = await _context.RefreshTokens
                .Include(t => t.User)
                .ThenInclude(u => u.Role)
                .FirstOrDefaultAsync(t => t.Token == refreshToken);

            if (tokenEntity == null || !tokenEntity.IsActive || tokenEntity.User.Status != UserStatus.Active)
            {
                return null;
            }

            // Revoke current token
            tokenEntity.IsRevoked = true;

            // Generate new tokens
            var newAccessToken = _tokenService.GenerateAccessToken(tokenEntity.User);
            var newRefreshTokenEntity = _tokenService.GenerateRefreshToken(tokenEntity.UserId);

            _context.RefreshTokens.Add(newRefreshTokenEntity);
            await _context.SaveChangesAsync();

            return new LoginResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshTokenEntity.Token,
                ExpiresIn = 3600,
                User = new UserDto
                {
                    Id = tokenEntity.User.Id,
                    FullName = tokenEntity.User.FullName,
                    Email = tokenEntity.User.Email,
                    Role = tokenEntity.User.Role.Name
                }
            };
        }

        public async Task<bool> LogoutAsync(string refreshToken, Guid userId)
        {
            var tokenEntity = await _context.RefreshTokens
                .FirstOrDefaultAsync(t => t.Token == refreshToken && t.UserId == userId);

            if (tokenEntity == null)
            {
                return false;
            }

            tokenEntity.IsRevoked = true;

            // Log Audit
            var auditLog = new AuditLog
            {
                UserId = userId,
                Action = "Auth.Logout",
                EntityType = "User",
                EntityId = userId,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
