using BTN.Core.DTOs.Auth;
using BTN.Core.DTOs.Users;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Authentication;
using BTN.Data.Entities;
using UserEntity = BTN.Data.Entities.User;

namespace BTN.Business.Authentication;

public class AuthenticationManager : IAuthenticationManager
{
    private readonly IAuthenticationRepository _authRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenGenerator _tokenGenerator;

    public AuthenticationManager(
        IAuthenticationRepository authRepository,
        IUnitOfWork unitOfWork,
        ITokenGenerator tokenGenerator)
    {
        _authRepository = authRepository;
        _unitOfWork = unitOfWork;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request, string? ipAddress)
    {
        var user = await _authRepository.GetUserByEmailAsync(request.Email);
        if (user == null || user.Status != UserStatus.Active)
        {
            return null;
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return null;
        }

        var accessToken = _tokenGenerator.GenerateAccessToken(user);
        var refreshToken = _tokenGenerator.GenerateRefreshToken(user.Id);
        _authRepository.AddRefreshToken(refreshToken);

        user.LastLoginAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        _authRepository.AddAuditLog(new AuditLog
        {
            UserId = user.Id,
            Action = "Auth.Login",
            EntityType = "User",
            EntityId = user.Id,
            IpAddress = ipAddress,
            CreatedAt = DateTime.UtcNow
        });

        await _unitOfWork.SaveChangesAsync();

        return MapLogin(user, accessToken, refreshToken.Token);
    }

    public async Task<LoginResponse?> RefreshAsync(string refreshToken)
    {
        var tokenEntity = await _authRepository.GetRefreshTokenAsync(refreshToken);
        if (tokenEntity == null || !tokenEntity.IsActive || tokenEntity.User.Status != UserStatus.Active)
        {
            return null;
        }

        _authRepository.RevokeToken(tokenEntity);
        var newAccessToken = _tokenGenerator.GenerateAccessToken(tokenEntity.User);
        var newRefreshToken = _tokenGenerator.GenerateRefreshToken(tokenEntity.UserId);
        _authRepository.AddRefreshToken(newRefreshToken);
        await _unitOfWork.SaveChangesAsync();

        return MapLogin(tokenEntity.User, newAccessToken, newRefreshToken.Token);
    }

    public async Task<bool> LogoutAsync(string refreshToken, Guid userId)
    {
        var tokenEntity = await _authRepository.GetRefreshTokenAsync(refreshToken);
        if (tokenEntity == null || tokenEntity.UserId != userId)
        {
            return false;
        }

        _authRepository.RevokeToken(tokenEntity);
        _authRepository.AddAuditLog(new AuditLog
        {
            UserId = userId,
            Action = "Auth.Logout",
            EntityType = "User",
            EntityId = userId,
            CreatedAt = DateTime.UtcNow
        });
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private static LoginResponse MapLogin(UserEntity user, string accessToken, string refreshToken) =>
        new()
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn = 3600,
            User = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role?.Name ?? string.Empty,
                EmployeeId = user.Employee?.Id,
                OrgUnitId = user.Employee?.OrgUnitId,
                JobTitle = user.Employee?.JobTitle.ToString()
            }
        };
}
