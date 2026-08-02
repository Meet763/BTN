using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Data.Wallet;

public interface IWalletRepository
{
    Task<Entities.Wallet?> GetByCustomerIdAsync(Guid customerId);
    Task<Entities.Wallet?> GetByCustomerIdForUpdateAsync(Guid customerId);
    void Add(Entities.Wallet wallet);
    void AddTransaction(WalletTransaction transaction);
    void AddPaymentOrder(PaymentOrder order);
    Task<PaymentOrder?> GetPaymentOrderAsync(Guid id);
    Task<PaymentOrder?> GetPaymentOrderByProviderIdAsync(string providerOrderId);
    Task<List<WalletTransaction>> GetTransactionsAsync(Guid walletId, int page, int pageSize);
    Task<int> CountTransactionsAsync(Guid walletId);
}

public class WalletRepository : IWalletRepository
{
    private readonly BtnDbContext _context;

    public WalletRepository(BtnDbContext context)
    {
        _context = context;
    }

    public Task<Entities.Wallet?> GetByCustomerIdAsync(Guid customerId) =>
        _context.Wallets.FirstOrDefaultAsync(w => w.CustomerId == customerId);

    public Task<Entities.Wallet?> GetByCustomerIdForUpdateAsync(Guid customerId) =>
        _context.Wallets.FirstOrDefaultAsync(w => w.CustomerId == customerId);

    public void Add(Entities.Wallet wallet) => _context.Wallets.Add(wallet);

    public void AddTransaction(WalletTransaction transaction) => _context.WalletTransactions.Add(transaction);

    public void AddPaymentOrder(PaymentOrder order) => _context.PaymentOrders.Add(order);

    public Task<PaymentOrder?> GetPaymentOrderAsync(Guid id) =>
        _context.PaymentOrders.FirstOrDefaultAsync(o => o.Id == id);

    public Task<PaymentOrder?> GetPaymentOrderByProviderIdAsync(string providerOrderId) =>
        _context.PaymentOrders.FirstOrDefaultAsync(o => o.ProviderOrderId == providerOrderId);

    public Task<List<WalletTransaction>> GetTransactionsAsync(Guid walletId, int page, int pageSize) =>
        _context.WalletTransactions.Where(t => t.WalletId == walletId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

    public Task<int> CountTransactionsAsync(Guid walletId) =>
        _context.WalletTransactions.CountAsync(t => t.WalletId == walletId);
}
