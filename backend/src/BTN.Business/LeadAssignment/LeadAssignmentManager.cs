using System.Security.Claims;
using BTN.Core.DTOs.LeadAssignment;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Employee;
using BTN.Data.Lead;
using BTN.Data.Entities;
using BTN.Business.Org;

namespace BTN.Business.LeadAssignment;

public class LeadAssignmentManager : ILeadAssignmentManager
{
    private readonly ILeadRepository _leadRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IOrgScopeService _orgScopeService;
    private readonly IUnitOfWork _unitOfWork;

    public LeadAssignmentManager(
        ILeadRepository leadRepository,
        IEmployeeRepository employeeRepository,
        IOrgScopeService orgScopeService,
        IUnitOfWork unitOfWork)
    {
        _leadRepository = leadRepository;
        _employeeRepository = employeeRepository;
        _orgScopeService = orgScopeService;
        _unitOfWork = unitOfWork;
    }

    public Task<LeadAssignmentResponse> AssignAsync(
        Guid leadId, AssignLeadRequest request, Guid actorUserId, ClaimsPrincipal? principal = null) =>
        AssignInternalAsync(leadId, request, actorUserId, reassign: false, principal);

    public Task<LeadAssignmentResponse> ReassignAsync(
        Guid leadId, AssignLeadRequest request, Guid actorUserId, ClaimsPrincipal? principal = null) =>
        AssignInternalAsync(leadId, request, actorUserId, reassign: true, principal);

    private async Task<LeadAssignmentResponse> AssignInternalAsync(
        Guid leadId, AssignLeadRequest request, Guid actorUserId, bool reassign, ClaimsPrincipal? principal)
    {
        var lead = await _leadRepository.GetByIdForUpdateAsync(leadId)
            ?? throw new KeyNotFoundException("Lead not found.");

        var employee = await _employeeRepository.GetByIdAsync(request.EmployeeId)
            ?? throw new KeyNotFoundException("Employee not found.");

        if (!employee.IsActive)
        {
            throw new InvalidOperationException("Cannot assign to an inactive employee.");
        }

        var allowed = await _orgScopeService.CanAssignToEmployeeAsync(
            actorUserId, employee.Id, lead.OrgUnitId ?? employee.OrgUnitId, principal);
        if (!allowed)
        {
            throw new UnauthorizedAccessException("You cannot assign leads outside your product unit or team.");
        }

        if (lead.OrgUnitId.HasValue && employee.OrgUnitId.HasValue && lead.OrgUnitId != employee.OrgUnitId)
        {
            throw new InvalidOperationException("Target employee must belong to the lead's product org unit.");
        }

        if (!lead.OrgUnitId.HasValue && employee.OrgUnitId.HasValue)
        {
            lead.OrgUnitId = employee.OrgUnitId;
        }

        if (employee.OrgUnitId.HasValue)
        {
            var unitHeadId = employee.OrgUnit?.HeadEmployeeId;
            if (unitHeadId == null && employee.OrgUnitId.HasValue)
            {
                // OrgUnit may not be loaded with head; employee.OrgUnit should be loaded via repo include
            }

            lead.AssignedHeadEmployeeId ??= employee.OrgUnit?.HeadEmployeeId;
        }

        var fromStatus = lead.WorkflowStatus.ToString();
        var now = DateTime.UtcNow;

        if (reassign || lead.AssignedEmployeeId.HasValue)
        {
            await _leadRepository.CloseOpenAssignmentsAsync(lead.Id, now);
        }

        lead.AssignedEmployeeId = employee.Id;
        lead.WorkflowStatus = LeadWorkflowStatus.Assigned;
        if (lead.VerificationStatus is not (LeadStatus.Verified or LeadStatus.Rejected))
        {
            lead.VerificationStatus = LeadStatus.Pending;
        }
        lead.UpdatedAt = now;

        var assignment = new BTN.Data.Entities.LeadAssignment
        {
            LeadId = lead.Id,
            EmployeeId = employee.Id,
            AssignedByUserId = actorUserId,
            AssignedAt = now,
            Reason = request.Reason ?? (reassign ? "Reassigned" : "Assigned")
        };
        _leadRepository.AddAssignment(assignment);

        _leadRepository.AddStatusHistory(new LeadStatusHistory
        {
            LeadId = lead.Id,
            FromStatus = fromStatus,
            ToStatus = LeadWorkflowStatus.Assigned.ToString(),
            ChangedBy = actorUserId,
            ChangedAt = now,
            Note = request.Reason ?? (reassign ? "Lead reassigned" : "Lead assigned")
        });

        await _unitOfWork.SaveChangesAsync();

        await _orgScopeService.AddAuditAsync(actorUserId, reassign ? "Lead.Reassign" : "Lead.Assign", "Lead", lead.Id,
            null,
            new { LeadId = lead.Id, EmployeeId = employee.Id, OrgUnitId = lead.OrgUnitId });

        return new LeadAssignmentResponse
        {
            Id = assignment.Id,
            LeadId = assignment.LeadId,
            EmployeeId = assignment.EmployeeId,
            EmployeeName = employee.User?.FullName ?? string.Empty,
            AssignedBy = actorUserId.ToString(),
            AssignedAt = assignment.AssignedAt,
            Reason = assignment.Reason
        };
    }

    public async Task<List<LeadAssignmentResponse>> GetHistoryAsync(Guid leadId)
    {
        var lead = await _leadRepository.GetByIdAsync(leadId);
        if (lead == null) return new List<LeadAssignmentResponse>();

        return lead.Assignments.OrderByDescending(a => a.AssignedAt).Select(a => new LeadAssignmentResponse
        {
            Id = a.Id,
            LeadId = a.LeadId,
            EmployeeId = a.EmployeeId,
            EmployeeName = a.Employee?.User?.FullName ?? string.Empty,
            AssignedBy = a.AssignedByUser?.FullName ?? a.AssignedByUserId.ToString(),
            AssignedAt = a.AssignedAt,
            UnassignedAt = a.UnassignedAt,
            Reason = a.Reason
        }).ToList();
    }

    public async Task<List<LeadStatusHistoryResponse>> GetStatusHistoryAsync(Guid leadId)
    {
        var rows = await _leadRepository.GetStatusHistoryAsync(leadId);
        return rows.Select(h => new LeadStatusHistoryResponse
        {
            Id = h.Id,
            FromStatus = h.FromStatus,
            ToStatus = h.ToStatus,
            ChangedBy = h.ChangedByUser?.FullName ?? h.ChangedBy.ToString(),
            ChangedAt = h.ChangedAt,
            Note = h.Note
        }).ToList();
    }
}
