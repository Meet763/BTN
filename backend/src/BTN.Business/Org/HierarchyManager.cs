using System.Security.Claims;
using BTN.Core.DTOs.Org;
using BTN.Core.Enums;
using BTN.Data.Employee;
using Microsoft.EntityFrameworkCore;

namespace BTN.Business.Org;

public class HierarchyManager : IHierarchyManager
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IOrgScopeService _orgScopeService;

    public HierarchyManager(IEmployeeRepository employeeRepository, IOrgScopeService orgScopeService)
    {
        _employeeRepository = employeeRepository;
        _orgScopeService = orgScopeService;
    }

    public async Task<List<HierarchyNodeResponse>> GetFullTreeAsync()
    {
        var employees = await _employeeRepository.Query().ToListAsync();
        var openCounts = new Dictionary<Guid, int>();
        foreach (var e in employees)
        {
            openCounts[e.Id] = await _employeeRepository.CountOpenLeadsAsync(e.Id);
        }

        var nodes = employees.ToDictionary(
            e => e.Id,
            e => new HierarchyNodeResponse
            {
                EmployeeId = e.Id,
                UserId = e.UserId,
                FullName = e.User?.FullName ?? string.Empty,
                Email = e.User?.Email ?? string.Empty,
                JobTitle = e.JobTitle.ToString(),
                OrgUnitId = e.OrgUnitId,
                OrgUnitName = e.OrgUnit?.Name,
                OrgUnitCode = e.OrgUnit?.Code,
                ReportsToEmployeeId = e.ReportsToEmployeeId,
                IsActive = e.IsActive,
                OpenLeadCount = openCounts[e.Id]
            });

        var roots = new List<HierarchyNodeResponse>();
        foreach (var e in employees)
        {
            var node = nodes[e.Id];
            if (e.ReportsToEmployeeId.HasValue && nodes.TryGetValue(e.ReportsToEmployeeId.Value, out var parent))
            {
                parent.Children.Add(node);
            }
            else
            {
                roots.Add(node);
            }
        }

        return roots.OrderBy(r => r.FullName).ToList();
    }

    public async Task<List<HierarchyEmployeeCard>> GetUnderMeAsync(Guid userId, ClaimsPrincipal principal)
    {
        var me = await _orgScopeService.GetCallerEmployeeAsync(userId);
        if (me == null) return new List<HierarchyEmployeeCard>();

        var visibleIds = await _orgScopeService.GetVisibleEmployeeIdsAsync(userId, principal);
        visibleIds.Remove(me.Id);
        return await BuildCardsAsync(visibleIds);
    }

    public async Task<List<HierarchyEmployeeCard>> GetUnderEmployeeAsync(
        Guid actorUserId,
        Guid employeeId,
        ClaimsPrincipal principal)
    {
        if (!await _orgScopeService.CanViewEmployeeSubtreeAsync(actorUserId, employeeId, principal))
        {
            throw new UnauthorizedAccessException("You cannot view this employee's team.");
        }

        var target = await _employeeRepository.GetByIdAsync(employeeId)
            ?? throw new KeyNotFoundException("Employee not found.");

        HashSet<Guid> ids;
        if (_orgScopeService.IsPlatformOwner(principal) ||
            target.JobTitle is JobTitle.Head or JobTitle.SubAdmin)
        {
            // For heads: everyone in their unit(s). For admin viewing anyone: use that person's visible set.
            ids = await _orgScopeService.GetVisibleEmployeeIdsAsync(target.UserId, null);
            if (target.JobTitle is JobTitle.Head or JobTitle.SubAdmin)
            {
                // Recompute as if that head were viewing
                ids = await VisibleForEmployeeAsync(target);
            }
            else if (target.JobTitle == JobTitle.Manager)
            {
                ids = await VisibleForEmployeeAsync(target);
            }
            else
            {
                ids = new HashSet<Guid>();
            }
        }
        else
        {
            ids = await VisibleForEmployeeAsync(target);
        }

        ids.Remove(employeeId);
        return await BuildCardsAsync(ids);
    }

    private async Task<HashSet<Guid>> VisibleForEmployeeAsync(Data.Entities.Employee employee)
    {
        if (employee.JobTitle is JobTitle.Head or JobTitle.SubAdmin)
        {
            return await _orgScopeService.GetVisibleEmployeeIdsAsync(employee.UserId, null);
        }

        if (employee.JobTitle == JobTitle.Manager)
        {
            return await _orgScopeService.GetVisibleEmployeeIdsAsync(employee.UserId, null);
        }

        return new HashSet<Guid>();
    }

    private async Task<List<HierarchyEmployeeCard>> BuildCardsAsync(HashSet<Guid> ids)
    {
        if (ids.Count == 0) return new List<HierarchyEmployeeCard>();

        var employees = await _employeeRepository.Query()
            .Where(e => ids.Contains(e.Id))
            .OrderBy(e => e.User!.FullName)
            .ToListAsync();

        var cards = new List<HierarchyEmployeeCard>();
        foreach (var e in employees)
        {
            cards.Add(new HierarchyEmployeeCard
            {
                EmployeeId = e.Id,
                UserId = e.UserId,
                FullName = e.User?.FullName ?? string.Empty,
                Email = e.User?.Email ?? string.Empty,
                JobTitle = e.JobTitle.ToString(),
                OrgUnitId = e.OrgUnitId,
                OrgUnitName = e.OrgUnit?.Name,
                OrgUnitCode = e.OrgUnit?.Code,
                ReportsToEmployeeId = e.ReportsToEmployeeId,
                ReportsToName = e.ReportsToEmployee?.User?.FullName,
                IsActive = e.IsActive,
                OpenLeadCount = await _employeeRepository.CountOpenLeadsAsync(e.Id)
            });
        }

        return cards;
    }
}
