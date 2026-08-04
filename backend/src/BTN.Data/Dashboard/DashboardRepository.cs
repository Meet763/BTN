using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Data.Dashboard;

public class DashboardRepository : IDashboardRepository
{
    private readonly BtnDbContext _context;

    public DashboardRepository(BtnDbContext context)
    {
        _context = context;
    }

    public Task<int> CountLeadsAsync() => _context.Leads.CountAsync();

    public Task<int> CountLeadsByStatusAsync(Core.Enums.LeadStatus status) =>
        _context.Leads.CountAsync(l => l.VerificationStatus == status);

    public Task<int> CountSalesAsync() => _context.Purchases.CountAsync();

    public async Task<decimal> SumWalletCreditsAsync()
    {
        var sum = await _context.WalletTransactions
            .Where(t => t.Type == Core.Enums.WalletTransactionType.Credit)
            .SumAsync(t => (long?)t.AmountMinor) ?? 0;
        return sum / 100m;
    }
}
