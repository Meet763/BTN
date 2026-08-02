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

public class UserRepository : IUserRepository
{
    private readonly BtnDbContext _context;

    public UserRepository(BtnDbContext context)
    {
        _context = context;
    }

    public IQueryable<UserEntity> QueryUsers() =>
        _context.Users.Include(u => u.Role).Include(u => u.CreatedByUser);

    public Task<UserEntity?> GetByIdAsync(Guid id) =>
        _context.Users.Include(u => u.Role).Include(u => u.CreatedByUser).FirstOrDefaultAsync(u => u.Id == id);

    public Task<bool> EmailExistsAsync(string email) =>
        _context.Users.AnyAsync(u => u.Email.ToLower() == email.ToLower());

    public Task<Role?> GetRoleAsync(Guid roleId) =>
        _context.Roles.FirstOrDefaultAsync(r => r.Id == roleId);

    public Task<List<Role>> GetAllRolesAsync() => _context.Roles.ToListAsync();

    public void Add(UserEntity user) => _context.Users.Add(user);

    public Task<List<RefreshToken>> GetActiveTokensAsync(Guid userId) =>
        _context.RefreshTokens.Where(t => t.UserId == userId && !t.IsRevoked).ToListAsync();
}
