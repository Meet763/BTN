namespace BTN.Core.DTOs.Customer;

using System.ComponentModel.DataAnnotations;

public class CustomerResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? CompanyName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCustomerRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? CompanyName { get; set; }
}

public class UpdateCustomerBrandingRequest
{
    [Required]
    [StringLength(80, MinimumLength = 1)]
    public string CompanyName { get; set; } = string.Empty;
}
