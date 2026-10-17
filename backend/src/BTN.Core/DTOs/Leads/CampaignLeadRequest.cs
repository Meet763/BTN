using System.ComponentModel.DataAnnotations;

namespace BTN.Core.DTOs.Leads;

public class CampaignLeadRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string Phone { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(300, MinimumLength = 5)]
    public string Address { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string City { get; set; } = string.Empty;

    [Required]
    [StringLength(180)]
    public string State { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "Enter a valid 6-digit pincode.")]
    public string Pincode { get; set; } = string.Empty;

    [StringLength(200)]
    public string? ProductInterest { get; set; }

    [StringLength(20)]
    public string? JobInterest { get; set; }

    [StringLength(80)]
    public string? JobRole { get; set; }

    [StringLength(40)]
    public string? Platform { get; set; }

    [StringLength(120)]
    public string? Campaign { get; set; }

    /// <summary>Honeypot — must stay empty.</summary>
    public string? Website { get; set; }
}
