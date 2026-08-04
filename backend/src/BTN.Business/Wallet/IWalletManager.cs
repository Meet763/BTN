using BTN.Core.DTOs;
using BTN.Core.DTOs.Wallet;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Customer;
using BTN.Data.Wallet;
using Microsoft.Extensions.Configuration;

namespace BTN.Business.Wallet;

public interface IWalletManager
{
    Task<WalletResponse?> GetWalletAsync(Guid customerId);
    Task<PagedResult<WalletTransactionResponse>> GetTransactionsAsync(Guid customerId, int page, int pageSize);
    Task<TopUpResponse> CreateTopUpAsync(Guid customerId, TopUpRequest request);
    Task<bool> ConfirmTopUpAsync(Guid customerId, ConfirmTopUpRequest request);
    Task<bool> ProcessWebhookAsync(string providerOrderId, string? idempotencyKey);
}

