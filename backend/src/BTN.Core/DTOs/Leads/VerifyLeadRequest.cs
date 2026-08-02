using System.ComponentModel.DataAnnotations;
using BTN.Core.Enums;

namespace BTN.Core.DTOs.Leads
{
    public class VerifyLeadRequest
    {
        [Required]
        public bool IsPhoneValid { get; set; }

        [Required]
        public bool IsRequirementReal { get; set; }

        [Required]
        [StringLength(20)]
        public string IntentLevel { get; set; } = string.Empty; // Serious / Exploring / NotInterested / Fake

        [Required]
        public bool IsLocationServiceable { get; set; }

        public bool CallAttempted { get; set; } = false;

        public bool CallConnected { get; set; } = false;

        public int? CallDurationSeconds { get; set; }

        public string? CallNotes { get; set; }

        [Required]
        public VerificationResult Result { get; set; }

        [StringLength(200)]
        public string? RejectionReason { get; set; }
    }
}
