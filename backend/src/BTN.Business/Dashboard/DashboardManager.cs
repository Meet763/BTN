using BTN.Core.DTOs.Dashboard;
using BTN.Core.Enums;
using BTN.Data.Dashboard;
using BTN.Data.Lead;

namespace BTN.Business.Dashboard;

public interface IDashboardManager
{
    Task<AdminDashboardResponse> GetAdminDashboardAsync();
}

public class DashboardManager : IDashboardManager
{
    private readonly IDashboardRepository _dashboardRepository;
    private readonly ILeadRepository _leadRepository;

    public DashboardManager(IDashboardRepository dashboardRepository, ILeadRepository leadRepository)
    {
        _dashboardRepository = dashboardRepository;
        _leadRepository = leadRepository;
    }

    public async Task<AdminDashboardResponse> GetAdminDashboardAsync()
    {
        return new AdminDashboardResponse
        {
            TotalLeads = await _dashboardRepository.CountLeadsAsync(),
            PendingVerification = await _dashboardRepository.CountLeadsByStatusAsync(LeadStatus.Pending),
            VerifiedLeads = await _dashboardRepository.CountLeadsByStatusAsync(LeadStatus.Verified),
            TotalSales = await _dashboardRepository.CountSalesAsync(),
            TotalWalletCredits = await _dashboardRepository.SumWalletCreditsAsync()
        };
    }
}
