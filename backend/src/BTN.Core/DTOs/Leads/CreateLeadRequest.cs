using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using BTN.Core.Enums;

namespace BTN.Core.DTOs.Leads
{
    public class CreateLeadRequest
    {
        [Required]
        [StringLength(100)]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        [Phone]
        [StringLength(15)]
        public string Phone { get; set; } = string.Empty;

        [EmailAddress]
        [StringLength(150)]
        public string? Email { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(100)]
        public string? State { get; set; }

        [StringLength(10)]
        public string? Pincode { get; set; }

        [Required]
        public LeadSource Source { get; set; }

        [StringLength(200)]
        public string? ProductInterest { get; set; }

        public JsonElement? RawData { get; set; }
    }
}
