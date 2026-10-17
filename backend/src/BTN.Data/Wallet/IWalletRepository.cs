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

