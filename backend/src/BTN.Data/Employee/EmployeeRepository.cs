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
    Task<int> CountVerificationsAsync(Guid employeeId, DateTime? since = null);
    Task<List<LeadAssignment>> GetAssignmentHistoryAsync(Guid employeeId, int take = 50);
    Task<List<LeadVerification>> GetVerificationHistoryAsync(Guid employeeId, int take = 50);
}

public class EmployeeRepository : IEmployeeRepository
{
    private readonly BtnDbContext _context;

    public EmployeeRepository(BtnDbContext context)
    {
        _context = context;
    }

    public IQueryable<Entities.Employee> Query() =>
        _context.Employees.Include(e => e.User).ThenInclude(u => u!.Role);

    public Task<Entities.Employee?> GetByIdAsync(Guid id) =>
        Query().FirstOrDefaultAsync(e => e.Id == id);

    public Task<Entities.Employee?> GetByUserIdAsync(Guid userId) =>
        Query().FirstOrDefaultAsync(e => e.UserId == userId);

    public void Add(Entities.Employee employee) => _context.Employees.Add(employee);

    public Task<List<Entities.Lead>> GetAssignedLeadsAsync(Guid employeeId, int page, int pageSize) =>
        _context.Leads
            .Where(l => l.AssignedEmployeeId == employeeId)
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

    public Task<int> CountAssignedLeadsAsync(Guid employeeId) =>
        _context.Leads.CountAsync(l => l.AssignedEmployeeId == employeeId);

    public Task<int> CountVerificationsAsync(Guid employeeId, DateTime? since = null)
    {
        var query = _context.LeadVerifications.Where(v => v.EmployeeId == employeeId);
        if (since.HasValue)
        {
            query = query.Where(v => v.CreatedAt >= since.Value);
        }

        return query.CountAsync();
    }

    public Task<List<LeadAssignment>> GetAssignmentHistoryAsync(Guid employeeId, int take = 50) =>
        _context.LeadAssignments
            .Include(a => a.Lead)
            .Where(a => a.EmployeeId == employeeId)
            .OrderByDescending(a => a.AssignedAt)
            .Take(take)
            .ToListAsync();

    public Task<List<LeadVerification>> GetVerificationHistoryAsync(Guid employeeId, int take = 50) =>
        _context.LeadVerifications
            .Include(v => v.Lead)
            .Where(v => v.EmployeeId == employeeId)
            .OrderByDescending(v => v.CreatedAt)
            .Take(take)
            .ToListAsync();
}
