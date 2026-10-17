using BTN.Core.DTOs.Auth;
using BTN.Core.DTOs.Users;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Authentication;
using BTN.Data.Entities;
using UserEntity = BTN.Data.Entities.User;

namespace BTN.Business.Authentication;

public interface IAuthenticationManager
{
    Task<LoginResponse?> LoginAsync(LoginRequest request, string? ipAddress);
    Task<LoginResponse?> RefreshAsync(string refreshToken);
    Task<bool> LogoutAsync(string refreshToken, Guid userId);
}

