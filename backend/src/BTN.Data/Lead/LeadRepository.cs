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

public class LeadRepository : ILeadRepository
{
    private readonly BtnDbContext _context;

    public LeadRepository(BtnDbContext context)
    {
        _context = context;
    }

    public IQueryable<Entities.Lead> QueryLeads() =>
        _context.Leads
            .Include(l => l.VerifiedByUser)
            .Include(l => l.AssignedEmployee).ThenInclude(e => e!.User)
            .Include(l => l.Verifications).ThenInclude(v => v.VerifiedByUser)
            .Include(l => l.Assignments).ThenInclude(a => a.Employee).ThenInclude(e => e!.User)
            .Include(l => l.Assignments).ThenInclude(a => a.AssignedByUser)
            .Include(l => l.Verifications).ThenInclude(v => v.VerificationMethod)
            .Include(l => l.StatusHistory).ThenInclude(h => h.ChangedByUser);

    public Task<Entities.Lead?> GetByIdAsync(Guid id) =>
        QueryLeads().FirstOrDefaultAsync(l => l.Id == id);

    public Task<Entities.Lead?> GetByIdForUpdateAsync(Guid id) =>
        _context.Leads.FirstOrDefaultAsync(l => l.Id == id);

    public Task<Entities.Lead?> FindDuplicateByPhoneAsync(string phone, DateTime since) =>
        _context.Leads.Where(l => l.Phone == phone && l.CreatedAt >= since)
            .OrderByDescending(l => l.CreatedAt).FirstOrDefaultAsync();

    public void Add(Entities.Lead lead) => _context.Leads.Add(lead);

    public void Remove(Entities.Lead lead) => _context.Leads.Remove(lead);

    public void AddVerification(LeadVerification verification) => _context.LeadVerifications.Add(verification);

    public void AddStatusHistory(LeadStatusHistory history) => _context.LeadStatusHistory.Add(history);

    public void AddAssignment(LeadAssignment assignment) => _context.LeadAssignments.Add(assignment);

    public Task<List<LeadStatusHistory>> GetStatusHistoryAsync(Guid leadId) =>
        _context.LeadStatusHistory
            .Include(h => h.ChangedByUser)
            .Where(h => h.LeadId == leadId)
            .OrderByDescending(h => h.ChangedAt)
            .ToListAsync();

    public async Task CloseOpenAssignmentsAsync(Guid leadId, DateTime unassignedAt)
    {
        var open = await _context.LeadAssignments
            .Where(a => a.LeadId == leadId && a.UnassignedAt == null)
            .ToListAsync();
        foreach (var a in open)
        {
            a.UnassignedAt = unassignedAt;
        }
    }

    public Task<List<LeadVerification>> GetVerificationsAsync(Guid leadId) =>
        _context.LeadVerifications
            .Include(v => v.VerifiedByUser)
            .Include(v => v.VerificationMethod)
            .Where(v => v.LeadId == leadId)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync();

    public Task<VerificationMethod?> GetVerificationMethodByCodeAsync(string code) =>
        _context.VerificationMethods.FirstOrDefaultAsync(m => m.Code == code);

    public Task<List<VerificationMethod>> GetVerificationMethodsAsync() =>
        _context.VerificationMethods.Where(m => m.IsActive).OrderBy(m => m.SortOrder).ToListAsync();

    public IQueryable<LeadVerification> QueryVerifications() => _context.LeadVerifications;
}
