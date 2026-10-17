using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Data.Employee;

public interface IEmployeeRepository
{
    IQueryable<Entities.Employee> Query();
    Task<Entities.Employee?> GetByIdAsync(Guid id);
    Task<Entities.Employee?> GetByUserIdAsync(Guid userId);
    void Add(Entities.Employee employee);
    Task<List<Entities.Lead>> GetAssignedLeadsAsync(Guid employeeId, int page, int pageSize);
    Task<int> CountAssignedLeadsAsync(Guid employeeId);
    Task<int> CountOpenLeadsAsync(Guid employeeId);
    Task<int> CountVerificationsAsync(Guid employeeId, DateTime? since = null);
    Task<List<LeadAssignment>> GetAssignmentHistoryAsync(Guid employeeId, int take = 50);
    Task<List<LeadVerification>> GetVerificationHistoryAsync(Guid employeeId, int take = 50);
}

