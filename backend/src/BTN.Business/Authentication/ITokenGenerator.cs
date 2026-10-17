using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BTN.Data.Entities;
using UserEntity = BTN.Data.Entities.User;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BTN.Business.Authentication;

public interface ITokenGenerator
{
    string GenerateAccessToken(UserEntity user);
    RefreshToken GenerateRefreshToken(Guid userId);
}

