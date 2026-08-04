using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;
using UserEntity = BTN.Data.Entities.User;

namespace BTN.Data.Authentication;

public class AuthenticationRepository : IAuthenticationRepository
{
    private readonly BtnDbContext _context;

    public AuthenticationRepository(BtnDbContext context)
    {
        _context = context;
    }

    public Task<UserEntity?> GetUserByEmailAsync(string email) =>
        _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

    public Task<UserEntity?> GetUserWithRoleAsync(Guid id) =>
        _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);

    public Task<RefreshToken?> GetRefreshTokenAsync(string token) =>
        _context.RefreshTokens.Include(t => t.User).ThenInclude(u => u!.Role)
            .FirstOrDefaultAsync(t => t.Token == token);

    public void AddRefreshToken(RefreshToken token) => _context.RefreshTokens.Add(token);

    public void AddAuditLog(AuditLog log) => _context.AuditLogs.Add(log);

    public void RevokeToken(RefreshToken token) => token.IsRevoked = true;
}
