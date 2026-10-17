using BTN.Core.DTOs.Dashboard;
using BTN.Core.Enums;
using BTN.Data.Dashboard;
using BTN.Data.Lead;

namespace BTN.Business.Dashboard;

public interface IDashboardManager
{
    Task<AdminDashboardResponse> GetAdminDashboardAsync();
}

