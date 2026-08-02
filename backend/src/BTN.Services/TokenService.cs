using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using BTN.Core.Entities;
using BTN.Core.Interfaces;

namespace BTN.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;

        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateAccessToken(User user)
        {
            var secretKey = _configuration["JwtSettings:SecretKey"] 
                ?? throw new InvalidOperationException("JWT Secret Key is not configured.");
            var issuer = _configuration["JwtSettings:Issuer"] ?? "BTN-API";
            var audience = _configuration["JwtSettings:Audience"] ?? "BTN-Frontend";
            var expirationMinutes = double.Parse(_configuration["JwtSettings:AccessTokenExpirationMinutes"] ?? "60");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role?.Name ?? string.Empty),
                new Claim("role", user.Role?.Name ?? string.Empty) // For easy client parsing
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public RefreshToken GenerateRefreshToken(Guid userId)
        {
            var expirationDays = double.Parse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7");
            
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            var tokenString = Convert.ToBase64String(randomNumber);

            return new RefreshToken
            {
                UserId = userId,
                Token = tokenString,
                ExpiresAt = DateTime.UtcNow.AddDays(expirationDays),
                IsRevoked = false,
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}
