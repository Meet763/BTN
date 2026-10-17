using System.Security.Claims;
using EmployeeEntity = BTN.Data.Entities.Employee;

namespace BTN.Business.Org;

public interface IOrgScopeService
{
    Task<EmployeeEntity?> GetCallerEmployeeAsync(Guid userId);
    bool IsPlatformOwner(ClaimsPrincipal user);
    Task<bool> CanViewOrgUnitAsync(Guid userId, Guid orgUnitId, ClaimsPrincipal? principal = null);
    Task<bool> CanViewEmployeeSubtreeAsync(Guid viewerUserId, Guid targetEmployeeId, ClaimsPrincipal? principal = null);
    Task<bool> CanAssignToEmployeeAsync(Guid actorUserId, Guid targetEmployeeId, Guid? leadOrgUnitId, ClaimsPrincipal? principal = null);
    Task<HashSet<Guid>> GetVisibleEmployeeIdsAsync(Guid userId, ClaimsPrincipal? principal = null);
    Task AddAuditAsync(Guid? userId, string action, string entityType, Guid? entityId, object? oldValues, object? newValues);
}
