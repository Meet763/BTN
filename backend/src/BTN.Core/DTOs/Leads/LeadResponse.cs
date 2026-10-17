using System;
using System.Text.Json;

namespace BTN.Core.DTOs.Leads
{
    public class LeadResponse
    {
        public Guid Id { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }
        public string Source { get; set; } = string.Empty;
        public string? ProductInterest { get; set; }
        public JsonElement? RawData { get; set; }
        public string VerificationStatus { get; set; } = string.Empty;
        public string WorkflowStatus { get; set; } = string.Empty;
        public string SaleStatus { get; set; } = string.Empty;
        public Guid? AssignedEmployeeId { get; set; }
        public string? AssignedEmployeeName { get; set; }
        public Guid? OrgUnitId { get; set; }
        public string? OrgUnitName { get; set; }
        public string? OrgUnitCode { get; set; }
        public Guid? AssignedHeadEmployeeId { get; set; }
        public string? AssignedHeadEmployeeName { get; set; }
        public string? InquiryType { get; set; }
        public string? InquiryDetails { get; set; }
        public string? CustomerRequirements { get; set; }
        public decimal? BudgetAmount { get; set; }
        public string? BudgetCurrency { get; set; }
        public string? Timeline { get; set; }
        public string? ContactOutcome { get; set; }
        public DateTime? FollowUpAt { get; set; }
        public string? Remarks { get; set; }
        public decimal? ListPrice { get; set; }
        public string? VerifiedByUser { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public bool IsDuplicate { get; set; }
        public Guid? DuplicateOfLeadId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public VerificationResponse? Verification { get; set; }
    }
}
