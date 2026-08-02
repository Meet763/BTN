using System;
using System.ComponentModel.DataAnnotations;

namespace BTN.Core.DTOs.Users
{
    public class CreateUserRequest
    {
        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(150)]
        public string Email { get; set; } = string.Empty;

        [Phone]
        [StringLength(15)]
        public string? Phone { get; set; }

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public Guid RoleId { get; set; }
    }
}
