namespace BTN.Core.DTOs.LeadAssignment;

public class AssignLeadRequest
{
    public Guid EmployeeId { get; set; }
    public string? Reason { get; set; }
}

public class LeadAssignmentResponse
{
    public Guid Id { get; set; }
    public Guid LeadId { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string AssignedBy { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
    public DateTime? UnassignedAt { get; set; }
    public string? Reason { get; set; }
}

public class LeadStatusHistoryResponse
{
    public Guid Id { get; set; }
    public string FromStatus { get; set; } = string.Empty;
    public string ToStatus { get; set; } = string.Empty;
    public string ChangedBy { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public string? Note { get; set; }
}
