using BTN.Core.DTOs.Users;

namespace BTN.Core.DTOs.Auth
{
    public class LoginResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public int ExpiresIn { get; set; }
        public UserDto User { get; set; } = null!;
    }
}
