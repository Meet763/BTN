using System;

namespace BTN.Core.DTOs.Users
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public Guid? EmployeeId { get; set; }
        public Guid? OrgUnitId { get; set; }
        public string? JobTitle { get; set; }
    }
}
