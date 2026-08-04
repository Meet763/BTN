using System.Text.Json;
using BTN.Core.DTOs;
using BTN.Core.DTOs.Users;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Entities;
using BTN.Data.User;
using Microsoft.EntityFrameworkCore;
using UserEntity = BTN.Data.Entities.User;

namespace BTN.Business.User;

public class UserManager : IUserManager
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UserManager(IUserRepository userRepository, IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<UserResponse>> GetUsersAsync(int page, int pageSize, string? search, string? role, string? status)
    {
        var query = _userRepository.QueryUsers();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowerSearch = search.ToLower();
            query = query.Where(u => u.FullName.ToLower().Contains(lowerSearch) || u.Email.ToLower().Contains(lowerSearch));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            query = query.Where(u => u.Role!.Name == role);
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<UserStatus>(status, true, out var statusEnum))
        {
            query = query.Where(u => u.Status == statusEnum);
        }

        var totalCount = await query.CountAsync();
        var items = await query.OrderByDescending(u => u.CreatedAt)
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
        var user = await _userRepository.GetByIdAsync(id);
        return user == null ? null : MapToUserResponse(user);
    }

    public async Task<UserResponse> CreateUserAsync(CreateUserRequest request, Guid adminId)
    {
        if (await _userRepository.EmailExistsAsync(request.Email))
        {
            throw new InvalidOperationException("Email address is already in use.");
        }

        var role = await _userRepository.GetRoleAsync(request.RoleId)
            ?? throw new KeyNotFoundException("Specified role was not found.");

        var user = new UserEntity
        {
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12),
            RoleId = request.RoleId,
            Status = UserStatus.Active,
            CreatedBy = adminId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _userRepository.Add(user);
        await _unitOfWork.SaveChangesAsync();

        var created = await _userRepository.GetByIdAsync(user.Id);
        return MapToUserResponse(created!);
    }

    public async Task<UserResponse?> UpdateUserAsync(Guid id, UpdateUserRequest request, Guid adminId)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return null;

        if (user.Id == adminId && request.Status != UserStatus.Active)
        {
            throw new InvalidOperationException("You cannot deactivate or suspend your own account.");
        }

        var role = await _userRepository.GetRoleAsync(request.RoleId)
            ?? throw new KeyNotFoundException("Specified role was not found.");

        user.FullName = request.FullName;
        user.Phone = request.Phone;
        user.RoleId = request.RoleId;
        user.Status = request.Status;
        user.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        var updated = await _userRepository.GetByIdAsync(id);
        return MapToUserResponse(updated!);
    }

    public async Task<bool> DeactivateUserAsync(Guid id, Guid adminId)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return false;
        if (user.Id == adminId) throw new InvalidOperationException("You cannot deactivate your own account.");

        user.Status = UserStatus.Inactive;
        user.UpdatedAt = DateTime.UtcNow;
        foreach (var token in await _userRepository.GetActiveTokensAsync(id))
        {
            token.IsRevoked = true;
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<List<RoleDto>> GetRolesAsync()
    {
        var roles = await _userRepository.GetAllRolesAsync();
        return roles.Select(r => new RoleDto { Id = r.Id, Name = r.Name, Description = r.Description }).ToList();
    }

    private static UserResponse MapToUserResponse(UserEntity user) =>
        new()
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
