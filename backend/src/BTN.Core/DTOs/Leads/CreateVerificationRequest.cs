using System.ComponentModel.DataAnnotations;
using BTN.Core.Enums;

namespace BTN.Core.DTOs.Leads;

public class CreateVerificationRequest
{
    [Required]
    public string VerificationMethodCode { get; set; } = "PhoneCall";

    public string? InquiryType { get; set; }
    public string? ProductOrService { get; set; }
    public string? InquiryDetails { get; set; }
    public string? CustomerRequirements { get; set; }
    public decimal? BudgetAmount { get; set; }
    public string? Timeline { get; set; }
    public string? ContactOutcome { get; set; }
    public DateTime? FollowUpAt { get; set; }
    public string? Remarks { get; set; }
    public string? AdditionalNotes { get; set; }

    [Required]
    public bool IsPhoneValid { get; set; }

    [Required]
    public bool IsRequirementReal { get; set; }

    [Required]
    [StringLength(20)]
    public string IntentLevel { get; set; } = string.Empty;

    [Required]
    public bool IsLocationServiceable { get; set; }

    public bool CallAttempted { get; set; }
    public bool CallConnected { get; set; }
    public int? CallDurationSeconds { get; set; }
    public string? CallNotes { get; set; }

    [Required]
    public VerificationResult Result { get; set; }

    [StringLength(200)]
    public string? RejectionReason { get; set; }
}
