using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Data.Lead;

public interface ILeadRepository
{
    IQueryable<Entities.Lead> QueryLeads();
    Task<Entities.Lead?> GetByIdAsync(Guid id);
    Task<Entities.Lead?> GetByIdForUpdateAsync(Guid id);
    Task<Entities.Lead?> FindDuplicateByPhoneAsync(string phone, DateTime since);
    void Add(Entities.Lead lead);
    void Remove(Entities.Lead lead);
    void AddVerification(LeadVerification verification);
    void AddStatusHistory(LeadStatusHistory history);
    void AddAssignment(LeadAssignment assignment);
    Task<List<LeadStatusHistory>> GetStatusHistoryAsync(Guid leadId);
    Task CloseOpenAssignmentsAsync(Guid leadId, DateTime unassignedAt);
    Task<List<LeadVerification>> GetVerificationsAsync(Guid leadId);
    Task<VerificationMethod?> GetVerificationMethodByCodeAsync(string code);
    Task<List<VerificationMethod>> GetVerificationMethodsAsync();
    IQueryable<LeadVerification> QueryVerifications();
}

