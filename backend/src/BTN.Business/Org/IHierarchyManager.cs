using System.Security.Claims;
using BTN.Core.DTOs.Org;

namespace BTN.Business.Org;

public interface IHierarchyManager
{
    Task<List<HierarchyNodeResponse>> GetFullTreeAsync();
    Task<List<HierarchyEmployeeCard>> GetUnderMeAsync(Guid userId, ClaimsPrincipal principal);
    Task<List<HierarchyEmployeeCard>> GetUnderEmployeeAsync(Guid actorUserId, Guid employeeId, ClaimsPrincipal principal);
}
