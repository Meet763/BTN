using System.Security.Claims;
using BTN.Core.DTOs.Org;
using BTN.Data;
using BTN.Data.Employee;
using BTN.Data.Entities;
using BTN.Data.OrgUnits;
using BTN.Data.Context;
using BTN.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace BTN.Business.Org;

public class OrgUnitManager : IOrgUnitManager
{
    private readonly IOrgUnitRepository _orgUnitRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IOrgScopeService _orgScopeService;
    private readonly BtnDbContext _context;
    private readonly IUnitOfWork _unitOfWork;

    public OrgUnitManager(
        IOrgUnitRepository orgUnitRepository,
        IEmployeeRepository employeeRepository,
        IOrgScopeService orgScopeService,
        BtnDbContext context,
        IUnitOfWork unitOfWork)
    {
        _orgUnitRepository = orgUnitRepository;
        _employeeRepository = employeeRepository;
        _orgScopeService = orgScopeService;
        _context = context;
        _unitOfWork = unitOfWork;
    }

    public async Task<List<OrgUnitResponse>> GetAllAsync()
    {
        var units = await _orgUnitRepository.Query().OrderBy(o => o.Name).ToListAsync();
        return units.Select(Map).ToList();
    }

    public async Task<OrgUnitResponse?> GetByIdAsync(Guid id)
    {
        var unit = await _orgUnitRepository.GetByIdAsync(id);
        return unit == null ? null : Map(unit);
    }

    public async Task<OrgUnitResponse> CreateAsync(CreateOrgUnitRequest request, Guid actorUserId)
    {
        var code = NormalizeCode(request.Code);
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(code))
        {
            throw new InvalidOperationException("Name and Code are required.");
        }

        if (await _orgUnitRepository.CodeExistsAsync(code))
        {
            throw new InvalidOperationException($"Org unit code '{code}' already exists.");
        }

        await ValidateParentAndHeadAsync(request.ParentOrgUnitId, request.HeadEmployeeId, null);

        var unit = new OrgUnit
        {
            Name = request.Name.Trim(),
            Code = code,
            ParentOrgUnitId = request.ParentOrgUnitId,
            HeadEmployeeId = request.HeadEmployeeId,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _orgUnitRepository.Add(unit);
        await _unitOfWork.SaveChangesAsync();

        if (request.HeadEmployeeId.HasValue)
        {
            await EnsureHeadMembershipAsync(unit.Id, request.HeadEmployeeId.Value);
            await _unitOfWork.SaveChangesAsync();
        }

        await _orgScopeService.AddAuditAsync(actorUserId, "OrgUnit.Create", "OrgUnit", unit.Id, null, new
        {
            unit.Name,
            unit.Code,
            unit.HeadEmployeeId,
            unit.ParentOrgUnitId
        });

        var created = await _orgUnitRepository.GetByIdAsync(unit.Id);
        return Map(created!);
    }

    public async Task<OrgUnitResponse?> UpdateAsync(Guid id, UpdateOrgUnitRequest request, Guid actorUserId)
    {
        var unit = await _orgUnitRepository.GetByIdAsync(id);
        if (unit == null) return null;

        var code = NormalizeCode(request.Code);
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(code))
        {
            throw new InvalidOperationException("Name and Code are required.");
        }

        if (await _orgUnitRepository.CodeExistsAsync(code, id))
        {
            throw new InvalidOperationException($"Org unit code '{code}' already exists.");
        }

        if (request.ParentOrgUnitId == id)
        {
            throw new InvalidOperationException("Org unit cannot be its own parent.");
        }

        await ValidateParentAndHeadAsync(request.ParentOrgUnitId, request.HeadEmployeeId, id);

        var old = new { unit.Name, unit.Code, unit.HeadEmployeeId, unit.ParentOrgUnitId, unit.IsActive };
        var previousHead = unit.HeadEmployeeId;

        unit.Name = request.Name.Trim();
        unit.Code = code;
        unit.ParentOrgUnitId = request.ParentOrgUnitId;
        unit.HeadEmployeeId = request.HeadEmployeeId;
        unit.IsActive = request.IsActive;
        unit.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        if (request.HeadEmployeeId.HasValue && request.HeadEmployeeId != previousHead)
        {
            await EnsureHeadMembershipAsync(unit.Id, request.HeadEmployeeId.Value);
            await _unitOfWork.SaveChangesAsync();
            await _orgScopeService.AddAuditAsync(actorUserId, "OrgUnit.ChangeHead", "OrgUnit", unit.Id,
                new { HeadEmployeeId = previousHead },
                new { HeadEmployeeId = request.HeadEmployeeId });
        }

        await _orgScopeService.AddAuditAsync(actorUserId, "OrgUnit.Update", "OrgUnit", unit.Id, old, new
        {
            unit.Name,
            unit.Code,
            unit.HeadEmployeeId,
            unit.ParentOrgUnitId,
            unit.IsActive
        });

        var updated = await _orgUnitRepository.GetByIdAsync(id);
        return Map(updated!);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid actorUserId)
    {
        var unit = await _orgUnitRepository.GetByIdAsync(id);
        if (unit == null) return false;

        var hasChildren = await _context.OrgUnits.AnyAsync(o => o.ParentOrgUnitId == id);
        if (hasChildren)
        {
            throw new InvalidOperationException("Cannot delete an org unit that has child units.");
        }

        var memberCount = await _context.Employees.CountAsync(e => e.OrgUnitId == id);
        if (memberCount > 0)
        {
            throw new InvalidOperationException("Move or clear members before deleting this org unit.");
        }

        _orgUnitRepository.Remove(unit);
        await _unitOfWork.SaveChangesAsync();
        await _orgScopeService.AddAuditAsync(actorUserId, "OrgUnit.Delete", "OrgUnit", id,
            new { unit.Name, unit.Code }, null);
        return true;
    }

    public async Task<OrgUnitSummaryResponse?> GetSummaryAsync(Guid id, Guid actorUserId, ClaimsPrincipal principal)
    {
        if (!await _orgScopeService.CanViewOrgUnitAsync(actorUserId, id, principal))
        {
            throw new UnauthorizedAccessException("You cannot view this org unit.");
        }

        var unit = await _orgUnitRepository.GetByIdAsync(id);
        if (unit == null) return null;

        var openStatuses = new[] { LeadStatus.Pending };
        var totalLeads = await _context.Leads.CountAsync(l => l.OrgUnitId == id);
        var openLeads = await _context.Leads.CountAsync(l =>
            l.OrgUnitId == id && openStatuses.Contains(l.VerificationStatus));
        var purchased = await _context.Purchases.CountAsync(p => p.Lead!.OrgUnitId == id);
        var customers = await _context.Purchases
            .Where(p => p.Lead!.OrgUnitId == id)
            .Select(p => p.CustomerId)
            .Distinct()
            .CountAsync();

        return new OrgUnitSummaryResponse
        {
            Id = unit.Id,
            Name = unit.Name,
            Code = unit.Code,
            HeadEmployeeId = unit.HeadEmployeeId,
            HeadEmployeeName = unit.HeadEmployee?.User?.FullName,
            MemberCount = unit.Members.Count,
            OpenLeadCount = openLeads,
            TotalLeadCount = totalLeads,
            PurchasedLeadCount = purchased,
            CustomerPurchaseCount = customers
        };
    }

    public async Task<List<HierarchyEmployeeCard>> GetMembersAsync(Guid id, Guid actorUserId, ClaimsPrincipal principal)
    {
        if (!await _orgScopeService.CanViewOrgUnitAsync(actorUserId, id, principal))
        {
            throw new UnauthorizedAccessException("You cannot view this org unit.");
        }

        var members = await _employeeRepository.Query()
            .Where(e => e.OrgUnitId == id)
            .OrderBy(e => e.User!.FullName)
            .ToListAsync();

        var cards = new List<HierarchyEmployeeCard>();
        foreach (var m in members)
        {
            cards.Add(new HierarchyEmployeeCard
            {
                EmployeeId = m.Id,
                UserId = m.UserId,
                FullName = m.User?.FullName ?? string.Empty,
                Email = m.User?.Email ?? string.Empty,
                JobTitle = m.JobTitle.ToString(),
                OrgUnitId = m.OrgUnitId,
                OrgUnitName = m.OrgUnit?.Name,
                OrgUnitCode = m.OrgUnit?.Code,
                ReportsToEmployeeId = m.ReportsToEmployeeId,
                ReportsToName = m.ReportsToEmployee?.User?.FullName,
                IsActive = m.IsActive,
                OpenLeadCount = await _employeeRepository.CountOpenLeadsAsync(m.Id)
            });
        }

        return cards;
    }

    private async Task ValidateParentAndHeadAsync(Guid? parentId, Guid? headId, Guid? selfId)
    {
        if (parentId.HasValue)
        {
            var parent = await _orgUnitRepository.GetByIdAsync(parentId.Value);
            if (parent == null) throw new InvalidOperationException("Parent org unit not found.");
            if (selfId.HasValue && parentId == selfId) throw new InvalidOperationException("Invalid parent.");
        }

        if (headId.HasValue)
        {
            var head = await _employeeRepository.GetByIdAsync(headId.Value);
            if (head == null) throw new KeyNotFoundException("Head employee not found.");
            if (!head.IsActive) throw new InvalidOperationException("Head employee must be active.");
        }
    }

    private async Task EnsureHeadMembershipAsync(Guid orgUnitId, Guid headEmployeeId)
    {
        var head = await _employeeRepository.GetByIdAsync(headEmployeeId);
        if (head == null) return;

        head.OrgUnitId = orgUnitId;
        if (head.JobTitle is not (JobTitle.Head or JobTitle.SubAdmin))
        {
            head.JobTitle = JobTitle.Head;
        }
    }

    private static string NormalizeCode(string code) =>
        (code ?? string.Empty).Trim().ToUpperInvariant();

    private static OrgUnitResponse Map(OrgUnit unit) =>
        new()
        {
            Id = unit.Id,
            Name = unit.Name,
            Code = unit.Code,
            ParentOrgUnitId = unit.ParentOrgUnitId,
            ParentName = unit.ParentOrgUnit?.Name,
            HeadEmployeeId = unit.HeadEmployeeId,
            HeadEmployeeName = unit.HeadEmployee?.User?.FullName,
            IsActive = unit.IsActive,
            MemberCount = unit.Members?.Count ?? 0,
            CreatedAt = unit.CreatedAt,
            UpdatedAt = unit.UpdatedAt
        };
}
