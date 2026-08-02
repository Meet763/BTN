using BTN.Core.DTOs;
using BTN.Core.DTOs.Purchase;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Customer;
using BTN.Data.Purchase;
using BTN.Data.Wallet;
using Microsoft.EntityFrameworkCore;

namespace BTN.Business.Purchase;

public interface IPurchaseManager
{
    Task<PurchaseResponse> PurchaseLeadAsync(Guid customerId, PurchaseLeadRequest request);
    Task<PagedResult<PurchaseResponse>> GetPurchasesAsync(Guid customerId, int page, int pageSize);
    Task<PurchaseResponse?> GetPurchaseAsync(Guid customerId, Guid purchaseId);
}

public class PurchaseManager : IPurchaseManager
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IPurchaseRepository _purchaseRepository;
    private readonly IWalletRepository _walletRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PurchaseManager(
        ICustomerRepository customerRepository,
        IPurchaseRepository purchaseRepository,
        IWalletRepository walletRepository,
        IUnitOfWork unitOfWork)
    {
        _customerRepository = customerRepository;
        _purchaseRepository = purchaseRepository;
        _walletRepository = walletRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PurchaseResponse> PurchaseLeadAsync(Guid customerId, PurchaseLeadRequest request)
    {
        var lead = await _customerRepository.GetLeadForCustomerAsync(request.LeadId, customerId);
        if (lead == null || lead.SaleStatus != SaleStatus.Available)
        {
            throw new InvalidOperationException("Lead is not available for purchase.");
        }

        if (await _purchaseRepository.LeadAlreadySoldAsync(request.LeadId))
        {
            throw new InvalidOperationException("Lead has already been sold.");
        }

        if (!lead.ListPrice.HasValue || lead.ListPrice <= 0)
        {
            throw new InvalidOperationException("Lead price is not set.");
        }

        var wallet = await _walletRepository.GetByCustomerIdForUpdateAsync(customerId)
            ?? throw new InvalidOperationException("Wallet not found.");

        var priceMinor = (long)Math.Round(lead.ListPrice.Value * 100);
        if (wallet.BalanceMinor < priceMinor)
        {
            throw new InvalidOperationException("Insufficient wallet balance.");
        }

        wallet.BalanceMinor -= priceMinor;
        wallet.RowVersion = Guid.NewGuid().ToByteArray();
        wallet.UpdatedAt = DateTime.UtcNow;

        var debitTx = new Data.Entities.WalletTransaction
        {
            WalletId = wallet.Id,
            Type = WalletTransactionType.Debit,
            AmountMinor = priceMinor,
            BalanceAfter = wallet.BalanceMinor,
            ReferenceType = "Lead",
            ReferenceId = lead.Id,
            Description = $"Purchase lead {lead.Id}",
            IdempotencyKey = $"purchase-{customerId}-{lead.Id}",
            CreatedAt = DateTime.UtcNow
        };
        _walletRepository.AddTransaction(debitTx);

        lead.SaleStatus = SaleStatus.Sold;
        lead.WorkflowStatus = LeadWorkflowStatus.Sold;
        lead.UpdatedAt = DateTime.UtcNow;

        var purchase = new Data.Entities.Purchase
        {
            CustomerId = customerId,
            LeadId = lead.Id,
            PriceMinor = priceMinor,
            PurchasedAt = DateTime.UtcNow
        };
        _purchaseRepository.Add(purchase);
        await _unitOfWork.SaveChangesAsync();

        debitTx.ReferenceId = purchase.Id;
        await _unitOfWork.SaveChangesAsync();

        return await MapPurchaseAsync(purchase.Id, customerId);
    }

    public async Task<PagedResult<PurchaseResponse>> GetPurchasesAsync(Guid customerId, int page, int pageSize)
    {
        var query = _purchaseRepository.QueryByCustomer(customerId);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(p => p.PurchasedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var responses = new List<PurchaseResponse>();
        foreach (var item in items)
        {
            responses.Add(new PurchaseResponse
            {
                Id = item.Id,
                LeadId = item.LeadId,
                Price = item.PriceMinor / 100m,
                PurchasedAt = item.PurchasedAt,
                Lead = item.Lead == null ? null : BTN.Business.Lead.LeadMapper.Map(item.Lead)
            });
        }

        return new PagedResult<PurchaseResponse>
        {
            Items = responses,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PurchaseResponse?> GetPurchaseAsync(Guid customerId, Guid purchaseId)
    {
        var purchase = await _purchaseRepository.GetByIdAsync(purchaseId);
        if (purchase == null || purchase.CustomerId != customerId) return null;
        return await MapPurchaseAsync(purchaseId, customerId);
    }

    private async Task<PurchaseResponse> MapPurchaseAsync(Guid purchaseId, Guid customerId)
    {
        var purchase = await _purchaseRepository.GetByIdAsync(purchaseId);
        return new PurchaseResponse
        {
            Id = purchase!.Id,
            LeadId = purchase.LeadId,
            Price = purchase.PriceMinor / 100m,
            PurchasedAt = purchase.PurchasedAt,
            Lead = purchase.Lead == null ? null : BTN.Business.Lead.LeadMapper.Map(purchase.Lead)
        };
    }
}
