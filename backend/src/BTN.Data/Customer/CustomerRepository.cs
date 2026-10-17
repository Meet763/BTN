using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Data.Customer;

public class CustomerRepository : ICustomerRepository
{
    private readonly BtnDbContext _context;

    public CustomerRepository(BtnDbContext context)
    {
        _context = context;
    }

    public IQueryable<Entities.Customer> Query() =>
        _context.Customers.Include(c => c.User).ThenInclude(u => u!.Role).Include(c => c.Wallet);

    public Task<Entities.Customer?> GetByIdAsync(Guid id) =>
        Query().FirstOrDefaultAsync(c => c.Id == id);

    public Task<Entities.Customer?> GetByUserIdAsync(Guid userId) =>
        Query().FirstOrDefaultAsync(c => c.UserId == userId);

    public void Add(Entities.Customer customer) => _context.Customers.Add(customer);

    public IQueryable<Entities.Lead> QueryAvailableLeads() =>
        _context.Leads.Where(l =>
            l.VerificationStatus == Core.Enums.LeadStatus.Verified &&
            l.SaleStatus == Core.Enums.SaleStatus.Available);

    public async Task<Entities.Lead?> GetLeadForCustomerAsync(Guid leadId, Guid customerId)
    {
        var purchased = await _context.Purchases.AnyAsync(p => p.CustomerId == customerId && p.LeadId == leadId);
        var lead = await _context.Leads.FirstOrDefaultAsync(l => l.Id == leadId);
        if (lead == null) return null;
        if (purchased || lead.SaleStatus == Core.Enums.SaleStatus.Available)
        {
            return lead;
        }

        return null;
    }
}
