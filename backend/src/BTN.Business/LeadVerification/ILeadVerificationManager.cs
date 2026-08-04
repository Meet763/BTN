using System.Text.Json;
using BTN.Core.DTOs.Leads;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Employee;
using BTN.Data.Lead;
using BTN.Data.Entities;

namespace BTN.Business.LeadVerification;

public interface ILeadVerificationManager
{
    Task<List<VerificationMethodDto>> GetMethodsAsync();
    Task<List<VerificationResponse>> GetHistoryAsync(Guid leadId);
    Task<LeadResponse?> VerifyLeadAsync(Guid leadId, CreateVerificationRequest request, Guid userId);
    Task<VerificationResponse?> GetLatestVerificationAsync(Guid leadId);
}

