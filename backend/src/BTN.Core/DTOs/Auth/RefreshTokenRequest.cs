using System.ComponentModel.DataAnnotations;

namespace BTN.Core.DTOs.Auth
{
    public class RefreshTokenRequest
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
