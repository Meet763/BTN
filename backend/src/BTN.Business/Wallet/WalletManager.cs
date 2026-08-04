using BTN.Core.DTOs;
using BTN.Core.DTOs.Wallet;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Customer;
using BTN.Data.Wallet;
using Microsoft.Extensions.Configuration;

namespace BTN.Business.Wallet;

public class WalletManager : IWalletManager
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IWalletRepository _walletRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;

    public WalletManager(
        ICustomerRepository customerRepository,
        IWalletRepository walletRepository,
        IUnitOfWork unitOfWork,
        IConfiguration configuration)
    {
        _customerRepository = customerRepository;
        _walletRepository = walletRepository;
        _unitOfWork = unitOfWork;
        _configuration = configuration;
    }

    public async Task<WalletResponse?> GetWalletAsync(Guid customerId)
    {
        var wallet = await _walletRepository.GetByCustomerIdAsync(customerId);
        return wallet == null ? null : Map(wallet);
    }

    public async Task<PagedResult<WalletTransactionResponse>> GetTransactionsAsync(Guid customerId, int page, int pageSize)
    {
        var wallet = await _walletRepository.GetByCustomerIdAsync(customerId);
        if (wallet == null)
        {
            return new PagedResult<WalletTransactionResponse> { Items = new(), Page = page, PageSize = pageSize };
        }

        var total = await _walletRepository.CountTransactionsAsync(wallet.Id);
        var items = await _walletRepository.GetTransactionsAsync(wallet.Id, page, pageSize);
        return new PagedResult<WalletTransactionResponse>
        {
            Items = items.Select(MapTx).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<TopUpResponse> CreateTopUpAsync(Guid customerId, TopUpRequest request)
    {
        if (request.Amount <= 0) throw new InvalidOperationException("Amount must be positive.");

        var customer = await _customerRepository.GetByIdAsync(customerId)
            ?? throw new KeyNotFoundException("Customer not found.");

        var amountMinor = (long)Math.Round(request.Amount * 100);
        var providerOrderId = $"order_{Guid.NewGuid():N}";

        var order = new Data.Entities.PaymentOrder
        {
            CustomerId = customer.Id,
            AmountMinor = amountMinor,
            Currency = "INR",
            Status = PaymentOrderStatus.Created,
            Provider = "Razorpay",
            ProviderOrderId = providerOrderId,
            CreatedAt = DateTime.UtcNow
        };
        _walletRepository.AddPaymentOrder(order);
        await _unitOfWork.SaveChangesAsync();

        return new TopUpResponse
        {
            PaymentOrderId = order.Id,
            Provider = order.Provider,
            ProviderOrderId = providerOrderId,
            RazorpayKeyId = _configuration["Razorpay:KeyId"],
            AmountMinor = amountMinor,
            Currency = "INR"
        };
    }

    public async Task<bool> ConfirmTopUpAsync(Guid customerId, ConfirmTopUpRequest request)
    {
        var order = await _walletRepository.GetPaymentOrderAsync(request.PaymentOrderId);
        if (order == null || order.CustomerId != customerId) return false;
        if (order.Status == PaymentOrderStatus.Paid) return true;

        return await CreditWalletFromOrderAsync(order, request.IdempotencyKey ?? request.ProviderPaymentId ?? Guid.NewGuid().ToString());
    }

    public async Task<bool> ProcessWebhookAsync(string providerOrderId, string? idempotencyKey)
    {
        var order = await _walletRepository.GetPaymentOrderByProviderIdAsync(providerOrderId);
        if (order == null) return false;
        if (order.Status == PaymentOrderStatus.Paid) return true;
        return await CreditWalletFromOrderAsync(order, idempotencyKey ?? providerOrderId);
    }

    private async Task<bool> CreditWalletFromOrderAsync(Data.Entities.PaymentOrder order, string idempotencyKey)
    {
        var wallet = await _walletRepository.GetByCustomerIdAsync(order.CustomerId)
            ?? throw new InvalidOperationException("Wallet not found.");

        wallet.BalanceMinor += order.AmountMinor;
        wallet.RowVersion = Guid.NewGuid().ToByteArray();
        wallet.UpdatedAt = DateTime.UtcNow;
        order.Status = PaymentOrderStatus.Paid;
        order.PaidAt = DateTime.UtcNow;

        _walletRepository.AddTransaction(new Data.Entities.WalletTransaction
        {
            WalletId = wallet.Id,
            Type = WalletTransactionType.Credit,
            AmountMinor = order.AmountMinor,
            BalanceAfter = wallet.BalanceMinor,
            ReferenceType = "PaymentOrder",
            ReferenceId = order.Id,
            Description = "Wallet top-up",
            IdempotencyKey = idempotencyKey,
            CreatedAt = DateTime.UtcNow
        });

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private static WalletResponse Map(Data.Entities.Wallet wallet) =>
        new() { Id = wallet.Id, BalanceMinor = wallet.BalanceMinor, Currency = wallet.Currency };

    private static WalletTransactionResponse MapTx(Data.Entities.WalletTransaction tx) =>
        new()
        {
            Id = tx.Id,
            Type = tx.Type.ToString(),
            AmountMinor = tx.AmountMinor,
            BalanceAfter = tx.BalanceAfter,
            Description = tx.Description,
            CreatedAt = tx.CreatedAt
        };
}
