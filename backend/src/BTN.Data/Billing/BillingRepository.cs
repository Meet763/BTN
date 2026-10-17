using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Data.Billing;

public class BillingRepository : IBillingRepository
{
    private readonly BtnDbContext _context;

    public BillingRepository(BtnDbContext context)
    {
        _context = context;
    }

    public Task<BillingOrganization?> GetOrganizationByCustomerAsync(Guid customerId) =>
        _context.BillingOrganizations.FirstOrDefaultAsync(o => o.CustomerId == customerId);

    public void AddOrganization(BillingOrganization organization) =>
        _context.BillingOrganizations.Add(organization);

    public Task<BillingOrganization?> GetOrganizationAsync(Guid id) =>
        _context.BillingOrganizations.FirstOrDefaultAsync(o => o.Id == id);

    public void AddBillingCustomer(BillingCustomer customer) =>
        _context.BillingCustomers.Add(customer);

    public IQueryable<BillingCustomer> QueryBillingCustomers(Guid organizationId) =>
        _context.BillingCustomers.Where(c => c.BillingOrganizationId == organizationId);

    public void AddProduct(BillingProduct product) => _context.BillingProducts.Add(product);

    public IQueryable<BillingProduct> QueryProducts(Guid organizationId) =>
        _context.BillingProducts.Where(p => p.BillingOrganizationId == organizationId);

    public void AddQuotation(BillingQuotation quotation) => _context.BillingQuotations.Add(quotation);

    public Task<BillingQuotation?> GetQuotationAsync(Guid id) =>
        _context.BillingQuotations
            .Include(q => q.Lines)
            .Include(q => q.BillingCustomer)
            .Include(q => q.BillingOrganization)
            .FirstOrDefaultAsync(q => q.Id == id);

    public IQueryable<BillingQuotation> QueryQuotations(Guid organizationId) =>
        _context.BillingQuotations.Include(q => q.BillingCustomer)
            .Where(q => q.BillingOrganizationId == organizationId);

    public void AddInvoice(BillingInvoice invoice) => _context.BillingInvoices.Add(invoice);

    public Task<BillingInvoice?> GetInvoiceAsync(Guid id) =>
        _context.BillingInvoices
            .Include(i => i.Lines)
            .Include(i => i.BillingCustomer)
            .Include(i => i.BillingOrganization)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == id);

    public IQueryable<BillingInvoice> QueryInvoices(Guid organizationId) =>
        _context.BillingInvoices.Include(i => i.BillingCustomer)
            .Where(i => i.BillingOrganizationId == organizationId);

    public void AddPayment(BillingPayment payment) => _context.BillingPayments.Add(payment);
}
