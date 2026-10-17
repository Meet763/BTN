using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BTN.Data.Entities;
using UserEntity = BTN.Data.Entities.User;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BTN.Business.Authentication;

public class TokenGenerator : ITokenGenerator
{
    private readonly IConfiguration _configuration;

    public TokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateAccessToken(UserEntity user)
    {
        var secretKey = _configuration["JwtSettings:SecretKey"]
            ?? throw new InvalidOperationException("JWT Secret Key is not configured.");
        var issuer = _configuration["JwtSettings:Issuer"] ?? "BTN-API";
        var audience = _configuration["JwtSettings:Audience"] ?? "BTN-Frontend";
        var expirationMinutes = double.Parse(_configuration["JwtSettings:AccessTokenExpirationMinutes"] ?? "60");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Name, user.FullName),
            new(ClaimTypes.Role, user.Role?.Name ?? string.Empty),
            new("role", user.Role?.Name ?? string.Empty)
        };

        if (user.Employee != null)
        {
            claims.Add(new Claim("employee_id", user.Employee.Id.ToString()));
            if (user.Employee.OrgUnitId.HasValue)
            {
                claims.Add(new Claim("org_unit_id", user.Employee.OrgUnitId.Value.ToString()));
            }

            claims.Add(new Claim("job_title", user.Employee.JobTitle.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public RefreshToken GenerateRefreshToken(Guid userId)
    {
        var expirationDays = double.Parse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7");
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);

        return new RefreshToken
        {
            UserId = userId,
            Token = Convert.ToBase64String(randomNumber),
            ExpiresAt = DateTime.UtcNow.AddDays(expirationDays),
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        };
    }
}
