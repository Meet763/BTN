namespace BTN.Core.DTOs.Leads;

public class UpdateLeadRequest
{
    public string? InquiryType { get; set; }
    public string? ProductInterest { get; set; }
    public string? InquiryDetails { get; set; }
    public string? CustomerRequirements { get; set; }
    public decimal? BudgetAmount { get; set; }
    public string? Timeline { get; set; }
    public string? ContactOutcome { get; set; }
    public DateTime? FollowUpAt { get; set; }
    public string? Remarks { get; set; }
    public string? InternalNotes { get; set; }
}
