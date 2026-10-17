using System.Security.Claims;
using BTN.Core.DTOs.LeadAssignment;

namespace BTN.Business.LeadAssignment;

public interface ILeadAssignmentManager
{
    Task<LeadAssignmentResponse> AssignAsync(Guid leadId, AssignLeadRequest request, Guid actorUserId, ClaimsPrincipal? principal = null);
    Task<LeadAssignmentResponse> ReassignAsync(Guid leadId, AssignLeadRequest request, Guid actorUserId, ClaimsPrincipal? principal = null);
    Task<List<LeadAssignmentResponse>> GetHistoryAsync(Guid leadId);
    Task<List<LeadStatusHistoryResponse>> GetStatusHistoryAsync(Guid leadId);
}
