using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Context;
using BTN.Data.Entities;
using BTN.Data.Lead;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using EmployeeEntity = BTN.Data.Entities.Employee;
using LeadEntity = BTN.Data.Entities.Lead;
using LeadAssignmentEntity = BTN.Data.Entities.LeadAssignment;
using OrgUnitEntity = BTN.Data.Entities.OrgUnit;

namespace BTN.Business.Routing;

/// <summary>
/// Thin product→OrgUnit.Code matcher (keyword/code). Full Google taxonomy import can replace this later.
/// </summary>
public class LeadRoutingService : ILeadRoutingService
{
    private readonly BtnDbContext _context;
    private readonly ILeadRepository _leadRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;

    public LeadRoutingService(
        BtnDbContext context,
        ILeadRepository leadRepository,
        IUnitOfWork unitOfWork,
        IConfiguration configuration)
    {
        _context = context;
        _leadRepository = leadRepository;
        _unitOfWork = unitOfWork;
        _configuration = configuration;
    }

    public async Task RouteLeadAsync(LeadEntity lead, bool autoAssign, Guid? systemUserId = null)
    {
        if (lead.OrgUnitId.HasValue) return;

        var orgUnit = await MatchOrgUnitAsync(lead.ProductInterest);
        if (orgUnit == null) return;

        lead.OrgUnitId = orgUnit.Id;
        lead.AssignedHeadEmployeeId = orgUnit.HeadEmployeeId;
        lead.UpdatedAt = DateTime.UtcNow;

        var enabled = autoAssign ||
                      string.Equals(_configuration["Routing:AutoAssignEnabled"], "true", StringComparison.OrdinalIgnoreCase);
        if (!enabled || !orgUnit.HeadEmployeeId.HasValue)
        {
            await _unitOfWork.SaveChangesAsync();
            return;
        }

        var assignee = await PickLeastLoadEmployeeAsync(orgUnit.Id, orgUnit.HeadEmployeeId);
        if (assignee == null)
        {
            await _unitOfWork.SaveChangesAsync();
            return;
        }

        var now = DateTime.UtcNow;
        await _leadRepository.CloseOpenAssignmentsAsync(lead.Id, now);
        lead.AssignedEmployeeId = assignee.Id;
        lead.WorkflowStatus = LeadWorkflowStatus.Assigned;
        if (lead.VerificationStatus is not (LeadStatus.Verified or LeadStatus.Rejected))
        {
            lead.VerificationStatus = LeadStatus.Pending;
        }

        var actorId = systemUserId ?? Guid.Empty;
        if (actorId == Guid.Empty)
        {
            var head = await _context.Employees.FirstOrDefaultAsync(e => e.Id == orgUnit.HeadEmployeeId);
            actorId = head?.UserId ?? Guid.Empty;
        }

        if (actorId != Guid.Empty)
        {
            _leadRepository.AddAssignment(new LeadAssignmentEntity
            {
                LeadId = lead.Id,
                EmployeeId = assignee.Id,
                AssignedByUserId = actorId,
                AssignedAt = now,
                Reason = "Auto-routed by product OrgUnit"
            });
            _leadRepository.AddStatusHistory(new LeadStatusHistory
            {
                LeadId = lead.Id,
                FromStatus = LeadWorkflowStatus.Created.ToString(),
                ToStatus = LeadWorkflowStatus.Assigned.ToString(),
                ChangedBy = actorId,
                ChangedAt = now,
                Note = $"Auto-assigned to {orgUnit.Code}"
            });
        }

        await _unitOfWork.SaveChangesAsync();
    }

    private async Task<OrgUnitEntity?> MatchOrgUnitAsync(string? productInterest)
    {
        if (string.IsNullOrWhiteSpace(productInterest)) return null;

        var text = productInterest.Trim().ToLowerInvariant();
        var units = await _context.OrgUnits
            .Include(o => o.HeadEmployee)
            .Where(o => o.IsActive)
            .ToListAsync();

        var byCode = units.FirstOrDefault(u =>
            text.Contains(u.Code.ToLowerInvariant()) ||
            text.Equals(u.Code.ToLowerInvariant(), StringComparison.OrdinalIgnoreCase));
        if (byCode != null) return byCode;

        var byName = units
            .Select(u => new
            {
                Unit = u,
                Score = ScoreMatch(text, u.Name) + ScoreMatch(text, u.Code)
            })
            .Where(x => x.Score > 0)
            .OrderByDescending(x => x.Score)
            .FirstOrDefault();

        return byName?.Unit;
    }

    private static int ScoreMatch(string text, string candidate)
    {
        if (string.IsNullOrWhiteSpace(candidate)) return 0;
        var c = candidate.Trim().ToLowerInvariant();
        if (text.Contains(c)) return c.Length + 10;
        var tokens = c.Split(new[] { ' ', '-', '_' }, StringSplitOptions.RemoveEmptyEntries);
        return tokens.Count(t => t.Length > 2 && text.Contains(t)) * 3;
    }

    private async Task<EmployeeEntity?> PickLeastLoadEmployeeAsync(Guid orgUnitId, Guid? headEmployeeId)
    {
        var candidates = await _context.Employees
            .Where(e => e.IsActive && e.OrgUnitId == orgUnitId)
            .ToListAsync();

        var workers = candidates
            .Where(e => e.Id != headEmployeeId && e.JobTitle is JobTitle.Employee or JobTitle.Manager or JobTitle.HR)
            .ToList();
        if (workers.Count == 0) workers = candidates;
        if (workers.Count == 0) return null;

        var loads = new List<(EmployeeEntity Emp, int Load)>();
        foreach (var e in workers)
        {
            var load = await _context.Leads.CountAsync(l =>
                l.AssignedEmployeeId == e.Id &&
                l.VerificationStatus != LeadStatus.Verified &&
                l.VerificationStatus != LeadStatus.Rejected);
            loads.Add((e, load));
        }

        return loads.OrderBy(x => x.Load).ThenBy(x => x.Emp.CreatedAt).First().Emp;
    }
}
