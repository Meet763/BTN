using System;

namespace BTN.Core.DTOs.Leads
{
    public class VerificationResponse
    {
        public Guid Id { get; set; }
        public Guid LeadId { get; set; }
        public string VerificationMethod { get; set; } = string.Empty;
        public string VerifiedByUser { get; set; } = string.Empty;
        public bool IsPhoneValid { get; set; }
        public bool IsRequirementReal { get; set; }
        public string IntentLevel { get; set; } = string.Empty;
        public bool IsLocationServiceable { get; set; }
        public bool CallAttempted { get; set; }
        public bool CallConnected { get; set; }
        public int? CallDurationSeconds { get; set; }
        public string? CallNotes { get; set; }
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
        public string Result { get; set; } = string.Empty;
        public string? RejectionReason { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
