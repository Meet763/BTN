using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Data.Billing;

public interface IBillingRepository
{
    Task<BillingOrganization?> GetOrganizationByCustomerAsync(Guid customerId);
    void AddOrganization(BillingOrganization organization);
    Task<BillingOrganization?> GetOrganizationAsync(Guid id);
    IQueryable<BillingCustomer> QueryBillingCustomers(Guid organizationId);
    void AddBillingCustomer(BillingCustomer customer);
    void AddProduct(BillingProduct product);
    IQueryable<BillingProduct> QueryProducts(Guid organizationId);
    void AddQuotation(BillingQuotation quotation);
    Task<BillingQuotation?> GetQuotationAsync(Guid id);
    IQueryable<BillingQuotation> QueryQuotations(Guid organizationId);
    void AddInvoice(BillingInvoice invoice);
    Task<BillingInvoice?> GetInvoiceAsync(Guid id);
    IQueryable<BillingInvoice> QueryInvoices(Guid organizationId);
    void AddPayment(BillingPayment payment);
}

