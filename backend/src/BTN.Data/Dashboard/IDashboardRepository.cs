using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Data.Dashboard;

public interface IDashboardRepository
{
    Task<int> CountLeadsAsync();
    Task<int> CountLeadsByStatusAsync(Core.Enums.LeadStatus status);
    Task<int> CountSalesAsync();
    Task<decimal> SumWalletCreditsAsync();
}

