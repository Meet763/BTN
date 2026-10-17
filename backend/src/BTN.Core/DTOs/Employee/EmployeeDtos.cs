namespace BTN.Core.DTOs.Employee;

public class EmployeeResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? EmployeeCode { get; set; }
    public string? Department { get; set; }
    public Guid? OrgUnitId { get; set; }
    public string? OrgUnitName { get; set; }
    public string? OrgUnitCode { get; set; }
    public Guid? ReportsToEmployeeId { get; set; }
    public string? ReportsToName { get; set; }
    public string JobTitle { get; set; } = "Employee";
    public bool IsActive { get; set; }
    public DateTime? JoinedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateEmployeeRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? EmployeeCode { get; set; }
    public string? Department { get; set; }
    public Guid? OrgUnitId { get; set; }
    public Guid? ReportsToEmployeeId { get; set; }
    public string? JobTitle { get; set; }
    public bool SetAsOrgUnitHead { get; set; }
}

public class UpdateEmployeeRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? EmployeeCode { get; set; }
    public string? Department { get; set; }
    public Guid? OrgUnitId { get; set; }
    public Guid? ReportsToEmployeeId { get; set; }
    public string? JobTitle { get; set; }
    public bool IsActive { get; set; } = true;
    public bool SetAsOrgUnitHead { get; set; }
}

public class EmployeePerformanceResponse
{
    public Guid EmployeeId { get; set; }
    public int AssignedLeads { get; set; }
    public int VerificationsTotal { get; set; }
    public int VerificationsThisMonth { get; set; }
}

public class EmployeeWorkHistoryItem
{
    public Guid LeadId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string ActivityType { get; set; } = string.Empty;
    public string? Detail { get; set; }
    public DateTime At { get; set; }
}
