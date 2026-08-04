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

public interface IUserManager
{
    Task<PagedResult<UserResponse>> GetUsersAsync(int page, int pageSize, string? search, string? role, string? status);
    Task<UserResponse?> GetUserByIdAsync(Guid id);
    Task<UserResponse> CreateUserAsync(CreateUserRequest request, Guid adminId);
    Task<UserResponse?> UpdateUserAsync(Guid id, UpdateUserRequest request, Guid adminId);
    Task<bool> DeactivateUserAsync(Guid id, Guid adminId);
    Task<List<RoleDto>> GetRolesAsync();
}

