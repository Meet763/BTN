using System.Text.Json;
using BTN.Core.DTOs.Leads;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Employee;
using BTN.Data.Lead;
using BTN.Data.Entities;

namespace BTN.Business.LeadVerification;

public class LeadVerificationManager : ILeadVerificationManager
{
    private readonly ILeadRepository _leadRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public LeadVerificationManager(
        ILeadRepository leadRepository,
        IEmployeeRepository employeeRepository,
        IUnitOfWork unitOfWork)
    {
        _leadRepository = leadRepository;
        _employeeRepository = employeeRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<List<VerificationMethodDto>> GetMethodsAsync()
    {
        var methods = await _leadRepository.GetVerificationMethodsAsync();
        return methods.Select(m => new VerificationMethodDto
        {
            Id = m.Id,
            Code = m.Code,
            DisplayName = m.DisplayName
        }).ToList();
    }

    public async Task<List<VerificationResponse>> GetHistoryAsync(Guid leadId)
    {
        var items = await _leadRepository.GetVerificationsAsync(leadId);
        return items.Select(BTN.Business.Lead.LeadMapper.MapVerification).ToList();
    }

    public async Task<LeadResponse?> VerifyLeadAsync(Guid leadId, CreateVerificationRequest request, Guid userId)
    {
        var lead = await _leadRepository.GetByIdForUpdateAsync(leadId);
        if (lead == null) return null;

        if (lead.VerificationStatus != LeadStatus.Pending && lead.VerificationStatus != LeadStatus.Rejected)
        {
            throw new InvalidOperationException("This lead cannot be verified in its current state.");
        }

        var method = await _leadRepository.GetVerificationMethodByCodeAsync(request.VerificationMethodCode)
            ?? throw new InvalidOperationException("Invalid verification method.");

        var employee = await _employeeRepository.GetByUserIdAsync(userId);
        if (employee == null)
        {
            employee = new BTN.Data.Entities.Employee
            {
                UserId = userId,
                IsActive = true,
                JoinedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            _employeeRepository.Add(employee);
            await _unitOfWork.SaveChangesAsync();
        }

        var verification = new BTN.Data.Entities.LeadVerification
        {
            LeadId = lead.Id,
            EmployeeId = employee.Id,
            VerifiedBy = userId,
            VerificationMethodId = method.Id,
            IsPhoneValid = request.IsPhoneValid,
            IsRequirementReal = request.IsRequirementReal,
            IntentLevel = request.IntentLevel,
            IsLocationServiceable = request.IsLocationServiceable,
            CallAttempted = request.CallAttempted,
            CallConnected = request.CallConnected,
            CallDurationSeconds = request.CallDurationSeconds,
            CallNotes = request.CallNotes,
            InquiryType = request.InquiryType,
            ProductOrService = request.ProductOrService,
            InquiryDetails = request.InquiryDetails,
            CustomerRequirements = request.CustomerRequirements,
            BudgetAmount = request.BudgetAmount,
            Timeline = request.Timeline,
            ContactOutcome = request.ContactOutcome,
            FollowUpAt = request.FollowUpAt,
            Remarks = request.Remarks,
            AdditionalNotes = request.AdditionalNotes,
            FormSnapshotJson = JsonSerializer.Serialize(request),
            Result = request.Result,
            RejectionReason = request.Result == VerificationResult.Rejected ? request.RejectionReason : null,
            CreatedAt = DateTime.UtcNow
        };

        _leadRepository.AddVerification(verification);

        lead.VerificationStatus = request.Result == VerificationResult.Verified ? LeadStatus.Verified : LeadStatus.Rejected;
        lead.WorkflowStatus = request.Result == VerificationResult.Verified ? LeadWorkflowStatus.Verified : LeadWorkflowStatus.Rejected;
        lead.VerifiedBy = userId;
        lead.VerifiedAt = DateTime.UtcNow;
        lead.InquiryType = request.InquiryType ?? lead.InquiryType;
        lead.ProductInterest = request.ProductOrService ?? lead.ProductInterest;
        lead.InquiryDetails = request.InquiryDetails ?? lead.InquiryDetails;
        lead.CustomerRequirements = request.CustomerRequirements ?? lead.CustomerRequirements;
        lead.BudgetAmount = request.BudgetAmount ?? lead.BudgetAmount;
        lead.Timeline = request.Timeline ?? lead.Timeline;
        lead.ContactOutcome = request.ContactOutcome ?? lead.ContactOutcome;
        lead.FollowUpAt = request.FollowUpAt ?? lead.FollowUpAt;
        lead.Remarks = request.Remarks ?? lead.Remarks;
        lead.UpdatedAt = DateTime.UtcNow;
        // Verified leads stay NotForSale until admin sets price and clicks Publish on Lead sales.

        _leadRepository.AddStatusHistory(new LeadStatusHistory
        {
            LeadId = lead.Id,
            FromStatus = LeadWorkflowStatus.InVerification.ToString(),
            ToStatus = lead.WorkflowStatus.ToString(),
            ChangedBy = userId,
            ChangedAt = DateTime.UtcNow,
            Note = request.Result.ToString()
        });

        await _unitOfWork.SaveChangesAsync();
        var updated = await _leadRepository.GetByIdAsync(leadId);
        return updated == null ? null : BTN.Business.Lead.LeadMapper.Map(updated);
    }

    public async Task<VerificationResponse?> GetLatestVerificationAsync(Guid leadId)
    {
        var items = await _leadRepository.GetVerificationsAsync(leadId);
        var latest = items.FirstOrDefault();
        return latest == null ? null : BTN.Business.Lead.LeadMapper.MapVerification(latest);
    }
}
