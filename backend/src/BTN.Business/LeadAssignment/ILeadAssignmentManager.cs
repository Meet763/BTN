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

