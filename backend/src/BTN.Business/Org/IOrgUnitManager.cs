using BTN.Core.DTOs.Org;
using System.Security.Claims;

namespace BTN.Business.Org;

public interface IOrgUnitManager
{
    Task<List<OrgUnitResponse>> GetAllAsync();
    Task<OrgUnitResponse?> GetByIdAsync(Guid id);
    Task<OrgUnitResponse> CreateAsync(CreateOrgUnitRequest request, Guid actorUserId);
    Task<OrgUnitResponse?> UpdateAsync(Guid id, UpdateOrgUnitRequest request, Guid actorUserId);
    Task<bool> DeleteAsync(Guid id, Guid actorUserId);
    Task<OrgUnitSummaryResponse?> GetSummaryAsync(Guid id, Guid actorUserId, ClaimsPrincipal principal);
    Task<List<HierarchyEmployeeCard>> GetMembersAsync(Guid id, Guid actorUserId, ClaimsPrincipal principal);
}
