using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;
using UserEntity = BTN.Data.Entities.User;

namespace BTN.Data.User;

public interface IUserRepository
{
    IQueryable<UserEntity> QueryUsers();
    Task<UserEntity?> GetByIdAsync(Guid id);
    Task<bool> EmailExistsAsync(string email);
    Task<Role?> GetRoleAsync(Guid roleId);
    Task<List<Role>> GetAllRolesAsync();
    void Add(UserEntity user);
    Task<List<RefreshToken>> GetActiveTokensAsync(Guid userId);
}

