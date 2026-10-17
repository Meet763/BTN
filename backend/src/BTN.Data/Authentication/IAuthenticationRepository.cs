using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;
using UserEntity = BTN.Data.Entities.User;

namespace BTN.Data.Authentication;

public interface IAuthenticationRepository
{
    Task<UserEntity?> GetUserByEmailAsync(string email);
    Task<UserEntity?> GetUserWithRoleAsync(Guid id);
    Task<RefreshToken?> GetRefreshTokenAsync(string token);
    void AddRefreshToken(RefreshToken token);
    void AddAuditLog(AuditLog log);
    void RevokeToken(RefreshToken token);
}

