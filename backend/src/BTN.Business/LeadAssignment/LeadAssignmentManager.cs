using BTN.Core.DTOs.LeadAssignment;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Employee;
using BTN.Data.Lead;
using BTN.Data.Entities;

namespace BTN.Business.LeadAssignment;

public interface ILeadAssignmentManager
{
    Task<LeadAssignmentResponse> AssignAsync(Guid leadId, AssignLeadRequest request, Guid adminUserId);
    Task<LeadAssignmentResponse> ReassignAsync(Guid leadId, AssignLeadRequest request, Guid adminUserId);
    Task<List<LeadAssignmentResponse>> GetHistoryAsync(Guid leadId);
    Task<List<LeadStatusHistoryResponse>> GetStatusHistoryAsync(Guid leadId);
}

public class LeadAssignmentManager : ILeadAssignmentManager
{
    private readonly ILeadRepository _leadRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public LeadAssignmentManager(
        ILeadRepository leadRepository,
        IEmployeeRepository employeeRepository,
        IUnitOfWork unitOfWork)
    {
        _leadRepository = leadRepository;
        _employeeRepository = employeeRepository;
        _unitOfWork = unitOfWork;
    }

    public Task<LeadAssignmentResponse> AssignAsync(Guid leadId, AssignLeadRequest request, Guid adminUserId) =>
        AssignInternalAsync(leadId, request, adminUserId, reassign: false);

    public Task<LeadAssignmentResponse> ReassignAsync(Guid leadId, AssignLeadRequest request, Guid adminUserId) =>
        AssignInternalAsync(leadId, request, adminUserId, reassign: true);

    private async Task<LeadAssignmentResponse> AssignInternalAsync(
        Guid leadId, AssignLeadRequest request, Guid adminUserId, bool reassign)
    {
        var lead = await _leadRepository.GetByIdForUpdateAsync(leadId)
            ?? throw new KeyNotFoundException("Lead not found.");

        var employee = await _employeeRepository.GetByIdAsync(request.EmployeeId)
            ?? throw new KeyNotFoundException("Employee not found.");

        if (!employee.IsActive)
        {
            throw new InvalidOperationException("Cannot assign to an inactive employee.");
        }

        var fromStatus = lead.WorkflowStatus.ToString();
        var now = DateTime.UtcNow;

        if (reassign || lead.AssignedEmployeeId.HasValue)
        {
            await _leadRepository.CloseOpenAssignmentsAsync(lead.Id, now);
        }

        // Assignment only routes the lead to an employee for calling.
        // VerificationStatus stays Pending until the employee (or admin) verifies.
        lead.AssignedEmployeeId = employee.Id;
        lead.WorkflowStatus = LeadWorkflowStatus.Assigned;
        if (lead.VerificationStatus == LeadStatus.Verified || lead.VerificationStatus == LeadStatus.Rejected)
        {
            // Do not change an already processed verification result on reassignment.
        }
        else
        {
            lead.VerificationStatus = LeadStatus.Pending;
        }
        lead.UpdatedAt = now;

        var assignment = new BTN.Data.Entities.LeadAssignment
        {
            LeadId = lead.Id,
            EmployeeId = employee.Id,
            AssignedByUserId = adminUserId,
            AssignedAt = now,
            Reason = request.Reason ?? (reassign ? "Reassigned" : "Assigned")
        };
        _leadRepository.AddAssignment(assignment);

        _leadRepository.AddStatusHistory(new LeadStatusHistory
        {
            LeadId = lead.Id,
            FromStatus = fromStatus,
            ToStatus = LeadWorkflowStatus.Assigned.ToString(),
            ChangedBy = adminUserId,
            ChangedAt = now,
            Note = request.Reason ?? (reassign ? "Lead reassigned" : "Lead assigned")
        });

        await _unitOfWork.SaveChangesAsync();

        return new LeadAssignmentResponse
        {
            Id = assignment.Id,
            LeadId = assignment.LeadId,
            EmployeeId = assignment.EmployeeId,
            EmployeeName = employee.User?.FullName ?? string.Empty,
            AssignedBy = adminUserId.ToString(),
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
