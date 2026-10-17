using BTN.Core.DTOs.Billing;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Billing;
using BTN.Data.Customer;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Business.Billing;

public interface IBillingManager
{
    Task<BillingOrganizationResponse?> GetOrganizationAsync(Guid customerId);
    Task<BillingOrganizationResponse> UpsertOrganizationAsync(Guid customerId, UpsertBillingOrganizationRequest request);
    Task<BillingCustomerDto> CreateBillingCustomerAsync(Guid customerId, CreateBillingCustomerRequest request);
    Task<List<BillingCustomerDto>> GetBillingCustomersAsync(Guid customerId);
    Task<BillingProductDto> CreateProductAsync(Guid customerId, CreateBillingProductRequest request);
    Task<List<BillingProductDto>> GetProductsAsync(Guid customerId);
    Task<InvoiceResponse> CreateInvoiceAsync(Guid customerId, CreateInvoiceRequest request);
    Task<List<InvoiceResponse>> GetInvoicesAsync(Guid customerId);
    Task<InvoiceResponse?> GetInvoiceAsync(Guid customerId, Guid invoiceId);
    Task<InvoiceResponse?> RecordPaymentAsync(Guid customerId, Guid invoiceId, RecordInvoicePaymentRequest request);
    Task<QuotationResponse> CreateQuotationAsync(Guid customerId, CreateQuotationRequest request);
    Task<List<QuotationResponse>> GetQuotationsAsync(Guid customerId);
    Task<QuotationResponse?> GetQuotationAsync(Guid customerId, Guid quotationId);
    Task<InvoiceResponse?> ConvertQuotationToInvoiceAsync(Guid customerId, Guid quotationId);
}

