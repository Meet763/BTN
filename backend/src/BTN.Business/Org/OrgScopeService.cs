using System.Security.Claims;
using System.Text.Json;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Context;
using BTN.Data.Entities;
using BTN.Data.Employee;
using Microsoft.EntityFrameworkCore;
using EmployeeEntity = BTN.Data.Entities.Employee;

namespace BTN.Business.Org;

public class OrgScopeService : IOrgScopeService
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly BtnDbContext _context;
    private readonly IUnitOfWork _unitOfWork;

    public OrgScopeService(
        IEmployeeRepository employeeRepository,
        BtnDbContext context,
        IUnitOfWork unitOfWork)
    {
        _employeeRepository = employeeRepository;
        _context = context;
        _unitOfWork = unitOfWork;
    }

    public Task<EmployeeEntity?> GetCallerEmployeeAsync(Guid userId) =>
        _employeeRepository.GetByUserIdAsync(userId);

    public bool IsPlatformOwner(ClaimsPrincipal user) =>
        user.IsInRole(UserRole.PlatformOwner.ToString()) ||
        user.Claims.Any(c =>
            (c.Type == ClaimTypes.Role || c.Type == "role") &&
            c.Value == UserRole.PlatformOwner.ToString());

    public async Task<bool> CanViewOrgUnitAsync(Guid userId, Guid orgUnitId, ClaimsPrincipal? principal = null)
    {
        if (principal != null && IsPlatformOwner(principal)) return true;

        var employee = await GetCallerEmployeeAsync(userId);
        if (employee == null) return false;

        if (employee.JobTitle is JobTitle.Head or JobTitle.SubAdmin)
        {
            if (employee.OrgUnitId == orgUnitId) return true;
            return await _context.OrgUnits.AnyAsync(o => o.Id == orgUnitId && o.HeadEmployeeId == employee.Id);
        }

        return employee.OrgUnitId == orgUnitId;
    }

    public async Task<bool> CanViewEmployeeSubtreeAsync(Guid viewerUserId, Guid targetEmployeeId, ClaimsPrincipal? principal = null)
    {
        if (principal != null && IsPlatformOwner(principal)) return true;

        var viewer = await GetCallerEmployeeAsync(viewerUserId);
        if (viewer == null) return false;
        if (viewer.Id == targetEmployeeId) return true;

        var visible = await GetVisibleEmployeeIdsAsync(viewerUserId, principal);
        return visible.Contains(targetEmployeeId);
    }

    public async Task<bool> CanAssignToEmployeeAsync(
        Guid actorUserId,
        Guid targetEmployeeId,
        Guid? leadOrgUnitId,
        ClaimsPrincipal? principal = null)
    {
        if (principal != null && IsPlatformOwner(principal)) return true;

        var actor = await GetCallerEmployeeAsync(actorUserId);
        var target = await _employeeRepository.GetByIdAsync(targetEmployeeId);
        if (actor == null || target == null || !target.IsActive) return false;

        if (leadOrgUnitId.HasValue && target.OrgUnitId.HasValue && target.OrgUnitId != leadOrgUnitId)
        {
            return false;
        }

        if (actor.JobTitle is JobTitle.Head or JobTitle.SubAdmin)
        {
            var actorUnits = await GetHeadedOrMemberUnitIdsAsync(actor);
            return target.OrgUnitId.HasValue && actorUnits.Contains(target.OrgUnitId.Value);
        }

        if (actor.JobTitle == JobTitle.Manager)
        {
            var descendants = await GetDescendantEmployeeIdsAsync(actor.Id);
            return descendants.Contains(target.Id);
        }

        return false;
    }

    public async Task<HashSet<Guid>> GetVisibleEmployeeIdsAsync(Guid userId, ClaimsPrincipal? principal = null)
    {
        if (principal != null && IsPlatformOwner(principal))
        {
            return (await _context.Employees.Select(e => e.Id).ToListAsync()).ToHashSet();
        }

        var employee = await GetCallerEmployeeAsync(userId);
        if (employee == null) return new HashSet<Guid>();

        if (employee.JobTitle is JobTitle.Head or JobTitle.SubAdmin)
        {
            var unitIds = await GetHeadedOrMemberUnitIdsAsync(employee);
            return (await _context.Employees
                .Where(e => e.OrgUnitId.HasValue && unitIds.Contains(e.OrgUnitId.Value))
                .Select(e => e.Id)
                .ToListAsync()).ToHashSet();
        }

        if (employee.JobTitle == JobTitle.Manager)
        {
            return await GetDescendantEmployeeIdsAsync(employee.Id);
        }

        return new HashSet<Guid> { employee.Id };
    }

    public async Task AddAuditAsync(
        Guid? userId,
        string action,
        string entityType,
        Guid? entityId,
        object? oldValues,
        object? newValues)
    {
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OldValues = oldValues == null ? null : JsonSerializer.Serialize(oldValues),
            NewValues = newValues == null ? null : JsonSerializer.Serialize(newValues),
            CreatedAt = DateTime.UtcNow
        });
        await _unitOfWork.SaveChangesAsync();
    }

    private async Task<HashSet<Guid>> GetHeadedOrMemberUnitIdsAsync(EmployeeEntity employee)
    {
        var ids = await _context.OrgUnits
            .Where(o => o.HeadEmployeeId == employee.Id)
            .Select(o => o.Id)
            .ToListAsync();
        var set = ids.ToHashSet();
        if (employee.OrgUnitId.HasValue) set.Add(employee.OrgUnitId.Value);
        return set;
    }

    private async Task<HashSet<Guid>> GetDescendantEmployeeIdsAsync(Guid rootEmployeeId)
    {
        var all = await _context.Employees
            .Select(e => new { e.Id, e.ReportsToEmployeeId })
            .ToListAsync();
        var byParent = all
            .Where(e => e.ReportsToEmployeeId.HasValue)
            .GroupBy(e => e.ReportsToEmployeeId!.Value)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Id).ToList());

        var result = new HashSet<Guid>();
        var stack = new Stack<Guid>();
        stack.Push(rootEmployeeId);
        while (stack.Count > 0)
        {
            var current = stack.Pop();
            if (!byParent.TryGetValue(current, out var children)) continue;
            foreach (var child in children)
            {
                if (result.Add(child)) stack.Push(child);
            }
        }

        return result;
    }
}
