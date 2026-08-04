using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Data.Purchase;

public interface IPurchaseRepository
{
    void Add(Entities.Purchase purchase);
    Task<Entities.Purchase?> GetByIdAsync(Guid id);
    IQueryable<Entities.Purchase> QueryByCustomer(Guid customerId);
    Task<bool> LeadAlreadySoldAsync(Guid leadId);
}

