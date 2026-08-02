using System;
using System.ComponentModel.DataAnnotations;
using BTN.Core.Enums;

namespace BTN.Core.DTOs.Users
{
    public class UpdateUserRequest
    {
        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Phone]
        [StringLength(15)]
        public string? Phone { get; set; }

        [Required]
        public Guid RoleId { get; set; }

        [Required]
        public UserStatus Status { get; set; }
    }
}
