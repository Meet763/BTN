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

public class PurchaseRepository : IPurchaseRepository
{
    private readonly BtnDbContext _context;

    public PurchaseRepository(BtnDbContext context)
    {
        _context = context;
    }

    public void Add(Entities.Purchase purchase) => _context.Purchases.Add(purchase);

    public Task<Entities.Purchase?> GetByIdAsync(Guid id) =>
        _context.Purchases.Include(p => p.Lead).FirstOrDefaultAsync(p => p.Id == id);

    public IQueryable<Entities.Purchase> QueryByCustomer(Guid customerId) =>
        _context.Purchases.Include(p => p.Lead).Where(p => p.CustomerId == customerId);

    public Task<bool> LeadAlreadySoldAsync(Guid leadId) =>
        _context.Purchases.AnyAsync(p => p.LeadId == leadId);
}
