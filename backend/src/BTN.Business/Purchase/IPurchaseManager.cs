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

