using System.Text.Json;
using BTN.Core.DTOs.Leads;
using LeadVerificationEntity = BTN.Data.Entities.LeadVerification;

using LeadEntity = BTN.Data.Entities.Lead;

namespace BTN.Business.Lead;

internal static class LeadMapper
{
    public static LeadResponse Map(LeadEntity lead, bool maskPii = false)
    {
        JsonElement? rawDataElement = null;
        if (!string.IsNullOrEmpty(lead.RawData))
        {
            try
            {
                rawDataElement = JsonDocument.Parse(lead.RawData).RootElement;
            }
            catch
            {
                // ignore malformed json
            }
        }

        var latestVerification = lead.Verifications.OrderByDescending(v => v.CreatedAt).FirstOrDefault();

        return new LeadResponse
        {
            Id = lead.Id,
            CustomerName = maskPii ? MaskName(lead.CustomerName) : lead.CustomerName,
            Phone = maskPii ? MaskPhone(lead.Phone) : lead.Phone,
            Email = maskPii ? MaskEmail(lead.Email) : lead.Email,
            Address = lead.Address,
            City = lead.City,
            State = lead.State,
            Pincode = lead.Pincode,
            Source = lead.Source.ToString(),
            ProductInterest = lead.ProductInterest,
            RawData = maskPii ? null : rawDataElement,
            VerificationStatus = lead.VerificationStatus.ToString(),
            WorkflowStatus = lead.WorkflowStatus.ToString(),
            SaleStatus = lead.SaleStatus.ToString(),
            VerifiedByUser = lead.VerifiedByUser?.FullName,
            VerifiedAt = lead.VerifiedAt,
            IsDuplicate = lead.IsDuplicate,
            DuplicateOfLeadId = lead.DuplicateOfLeadId,
            AssignedEmployeeId = lead.AssignedEmployeeId,
            AssignedEmployeeName = lead.AssignedEmployee?.User?.FullName,
            OrgUnitId = lead.OrgUnitId,
            OrgUnitName = lead.OrgUnit?.Name,
            OrgUnitCode = lead.OrgUnit?.Code,
            AssignedHeadEmployeeId = lead.AssignedHeadEmployeeId,
            AssignedHeadEmployeeName = lead.AssignedHeadEmployee?.User?.FullName,
            InquiryType = lead.InquiryType,
            InquiryDetails = lead.InquiryDetails,
            CustomerRequirements = lead.CustomerRequirements,
            BudgetAmount = lead.BudgetAmount,
            BudgetCurrency = lead.BudgetCurrency,
            Timeline = lead.Timeline,
            ContactOutcome = lead.ContactOutcome,
            FollowUpAt = lead.FollowUpAt,
            Remarks = lead.Remarks,
            ListPrice = lead.ListPrice,
            CreatedAt = lead.CreatedAt,
            UpdatedAt = lead.UpdatedAt,
            Verification = latestVerification == null ? null : MapVerification(latestVerification)
        };
    }

    public static VerificationResponse MapVerification(LeadVerificationEntity verification) =>
        new()
        {
            Id = verification.Id,
            LeadId = verification.LeadId,
            VerificationMethod = verification.VerificationMethod?.DisplayName ?? verification.VerificationMethod?.Code ?? "",
            VerifiedByUser = verification.VerifiedByUser?.FullName ?? "Unknown",
            IsPhoneValid = verification.IsPhoneValid,
            IsRequirementReal = verification.IsRequirementReal,
            IntentLevel = verification.IntentLevel,
            IsLocationServiceable = verification.IsLocationServiceable,
            CallAttempted = verification.CallAttempted,
            CallConnected = verification.CallConnected,
            CallDurationSeconds = verification.CallDurationSeconds,
            CallNotes = verification.CallNotes,
            InquiryType = verification.InquiryType,
            ProductOrService = verification.ProductOrService,
            InquiryDetails = verification.InquiryDetails,
            CustomerRequirements = verification.CustomerRequirements,
            BudgetAmount = verification.BudgetAmount,
            Timeline = verification.Timeline,
            ContactOutcome = verification.ContactOutcome,
            FollowUpAt = verification.FollowUpAt,
            Remarks = verification.Remarks,
            AdditionalNotes = verification.AdditionalNotes,
            Result = verification.Result.ToString(),
            RejectionReason = verification.RejectionReason,
            CreatedAt = verification.CreatedAt
        };

    private static string MaskName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "***";
        return name.Length <= 2 ? "**" : $"{name[0]}***";
    }

    private static string MaskPhone(string phone)
    {
        if (phone.Length < 4) return "****";
        return new string('*', phone.Length - 4) + phone[^4..];
    }

    private static string? MaskEmail(string? email)
    {
        if (string.IsNullOrEmpty(email) || !email.Contains('@')) return "***@***";
        var parts = email.Split('@');
        return $"{parts[0][0]}***@{parts[1]}";
    }
}
