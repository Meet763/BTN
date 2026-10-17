using BTN.Core.Enums;

namespace BTN.Core.DTOs.Org;

public class OrgUnitResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public Guid? ParentOrgUnitId { get; set; }
    public string? ParentName { get; set; }
    public Guid? HeadEmployeeId { get; set; }
    public string? HeadEmployeeName { get; set; }
    public bool IsActive { get; set; }
    public int MemberCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateOrgUnitRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public Guid? ParentOrgUnitId { get; set; }
    public Guid? HeadEmployeeId { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateOrgUnitRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public Guid? ParentOrgUnitId { get; set; }
    public Guid? HeadEmployeeId { get; set; }
    public bool IsActive { get; set; } = true;
}

public class OrgUnitSummaryResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public Guid? HeadEmployeeId { get; set; }
    public string? HeadEmployeeName { get; set; }
    public int MemberCount { get; set; }
    public int OpenLeadCount { get; set; }
    public int TotalLeadCount { get; set; }
    public int PurchasedLeadCount { get; set; }
    public int CustomerPurchaseCount { get; set; }
}

public class HierarchyNodeResponse
{
    public Guid EmployeeId { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public Guid? OrgUnitId { get; set; }
    public string? OrgUnitName { get; set; }
    public string? OrgUnitCode { get; set; }
    public Guid? ReportsToEmployeeId { get; set; }
    public bool IsActive { get; set; }
    public int OpenLeadCount { get; set; }
    public List<HierarchyNodeResponse> Children { get; set; } = new();
}

public class HierarchyEmployeeCard
{
    public Guid EmployeeId { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public Guid? OrgUnitId { get; set; }
    public string? OrgUnitName { get; set; }
    public string? OrgUnitCode { get; set; }
    public Guid? ReportsToEmployeeId { get; set; }
    public string? ReportsToName { get; set; }
    public bool IsActive { get; set; }
    public int OpenLeadCount { get; set; }
}

public class OrgMemberUpdateRequest
{
    public Guid? OrgUnitId { get; set; }
    public Guid? ReportsToEmployeeId { get; set; }
    public JobTitle JobTitle { get; set; } = JobTitle.Employee;
}
