using LeadEntity = BTN.Data.Entities.Lead;

namespace BTN.Business.Routing;

public interface ILeadRoutingService
{
    Task RouteLeadAsync(LeadEntity lead, bool autoAssign, Guid? systemUserId = null);
}
