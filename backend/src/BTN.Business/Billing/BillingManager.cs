using BTN.Core.DTOs.Billing;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Billing;
using BTN.Data.Customer;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Business.Billing;

public class BillingManager : IBillingManager
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IBillingRepository _billingRepository;
    private readonly IUnitOfWork _unitOfWork;

    public BillingManager(
        ICustomerRepository customerRepository,
        IBillingRepository billingRepository,
        IUnitOfWork unitOfWork)
    {
        _customerRepository = customerRepository;
        _billingRepository = billingRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<BillingOrganizationResponse?> GetOrganizationAsync(Guid customerId)
    {
        var org = await _billingRepository.GetOrganizationByCustomerAsync(customerId);
        return org == null ? null : MapOrg(org);
    }

    public async Task<BillingOrganizationResponse> UpsertOrganizationAsync(Guid customerId, UpsertBillingOrganizationRequest request)
    {
        var org = await _billingRepository.GetOrganizationByCustomerAsync(customerId);
        if (org == null)
        {
            org = new BillingOrganization
            {
                CustomerId = customerId,
                LegalName = request.LegalName,
                Address = request.Address,
                LogoUrl = request.LogoUrl,
                InvoicePrefix = request.InvoicePrefix,
                CreatedAt = DateTime.UtcNow
            };
            _billingRepository.AddOrganization(org);
        }
        else
        {
            org.LegalName = request.LegalName;
            org.Address = request.Address;
            org.LogoUrl = request.LogoUrl;
            org.InvoicePrefix = request.InvoicePrefix;
        }

        await _unitOfWork.SaveChangesAsync();
        return MapOrg(org);
    }

    public async Task<BillingCustomerDto> CreateBillingCustomerAsync(Guid customerId, CreateBillingCustomerRequest request)
    {
        var org = await GetOrCreateOrgAsync(customerId);
        var entity = new BillingCustomer
        {
            BillingOrganizationId = org.Id,
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
            CreatedAt = DateTime.UtcNow
        };
        _billingRepository.AddBillingCustomer(entity);
        await _unitOfWork.SaveChangesAsync();
        return MapCustomer(entity);
    }

    public async Task<List<BillingCustomerDto>> GetBillingCustomersAsync(Guid customerId)
    {
        var org = await _billingRepository.GetOrganizationByCustomerAsync(customerId);
        if (org == null) return new List<BillingCustomerDto>();
        // simplified query via context not exposed - use invoice query org id
        var customers = await _billingRepository.QueryBillingCustomers(org.Id).ToListAsync();
        return customers.Select(MapCustomer).ToList();
    }

    public async Task<BillingProductDto> CreateProductAsync(Guid customerId, CreateBillingProductRequest request)
    {
        var org = await GetOrCreateOrgAsync(customerId);
        var product = new BillingProduct
        {
            BillingOrganizationId = org.Id,
            Name = request.Name,
            Description = request.Description,
            UnitPrice = request.UnitPrice,
            IsActive = true
        };
        _billingRepository.AddProduct(product);
        await _unitOfWork.SaveChangesAsync();
        return MapProduct(product);
    }

    public async Task<List<BillingProductDto>> GetProductsAsync(Guid customerId)
    {
        var org = await _billingRepository.GetOrganizationByCustomerAsync(customerId);
        if (org == null) return new List<BillingProductDto>();
        var products = await _billingRepository.QueryProducts(org.Id).ToListAsync();
        return products.Select(MapProduct).ToList();
    }

    public async Task<InvoiceResponse> CreateInvoiceAsync(Guid customerId, CreateInvoiceRequest request)
    {
        var org = await GetOrCreateOrgAsync(customerId);

        var invoiceNumber = $"{org.InvoicePrefix}-{org.NextInvoiceNumber:D5}";
        org.NextInvoiceNumber++;

        var lines = request.Lines.Select(l => new BillingInvoiceLine
        {
            Description = l.Description,
            Quantity = l.Quantity,
            UnitPrice = l.UnitPrice,
            LineTotal = l.Quantity * l.UnitPrice
        }).ToList();

        var total = lines.Sum(l => l.LineTotal);
        var invoice = new BillingInvoice
        {
            BillingOrganizationId = org.Id,
            BillingCustomerId = request.BillingCustomerId,
            InvoiceNumber = invoiceNumber,
            Status = InvoiceStatus.Sent,
            IssuedAt = DateTime.UtcNow,
            DueAt = request.DueAt,
            TotalAmount = total,
            AmountPaid = 0,
            Lines = lines
        };
        _billingRepository.AddInvoice(invoice);
        await _unitOfWork.SaveChangesAsync();
        return (await GetInvoiceAsync(customerId, invoice.Id))!;
    }

    public async Task<List<InvoiceResponse>> GetInvoicesAsync(Guid customerId)
    {
        var org = await _billingRepository.GetOrganizationByCustomerAsync(customerId);
        if (org == null) return new List<InvoiceResponse>();
        var invoices = await _billingRepository.QueryInvoices(org.Id).ToListAsync();
        var result = new List<InvoiceResponse>();
        foreach (var inv in invoices)
        {
            var mapped = await GetInvoiceAsync(customerId, inv.Id);
            if (mapped != null) result.Add(mapped);
        }

        return result;
    }

    public async Task<InvoiceResponse?> GetInvoiceAsync(Guid customerId, Guid invoiceId)
    {
        var org = await _billingRepository.GetOrganizationByCustomerAsync(customerId);
        if (org == null) return null;
        var invoice = await _billingRepository.GetInvoiceAsync(invoiceId);
        if (invoice == null || invoice.BillingOrganizationId != org.Id) return null;

        return new InvoiceResponse
        {
            Id = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            Status = invoice.Status.ToString(),
            TotalAmount = invoice.TotalAmount,
            AmountPaid = invoice.AmountPaid,
            IssuedAt = invoice.IssuedAt,
            DueAt = invoice.DueAt,
            Customer = invoice.BillingCustomer == null ? null : MapCustomer(invoice.BillingCustomer),
            Organization = MapOrg(invoice.BillingOrganization ?? org),
            Lines = invoice.Lines.Select(l => new InvoiceLineResponse
            {
                Description = l.Description,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                LineTotal = l.LineTotal
            }).ToList()
        };
    }

    public async Task<InvoiceResponse?> RecordPaymentAsync(Guid customerId, Guid invoiceId, RecordInvoicePaymentRequest request)
    {
        var invoice = await GetInvoiceAsync(customerId, invoiceId);
        if (invoice == null) return null;
        var entity = await _billingRepository.GetInvoiceAsync(invoiceId);
        if (entity == null) return null;

        if (request.Amount <= 0) throw new InvalidOperationException("Payment amount must be positive.");

        _billingRepository.AddPayment(new BillingPayment
        {
            BillingInvoiceId = entity.Id,
            Amount = request.Amount,
            Method = request.Method,
            Reference = request.Reference,
            PaidAt = DateTime.UtcNow
        });

        entity.AmountPaid += request.Amount;
        if (entity.AmountPaid >= entity.TotalAmount)
        {
            entity.Status = InvoiceStatus.Paid;
        }
        else if (entity.AmountPaid > 0)
        {
            entity.Status = InvoiceStatus.PartiallyPaid;
        }

        await _unitOfWork.SaveChangesAsync();
        return await GetInvoiceAsync(customerId, invoiceId);
    }

    public async Task<QuotationResponse> CreateQuotationAsync(Guid customerId, CreateQuotationRequest request)
    {
        var org = await GetOrCreateOrgAsync(customerId);
        var count = await _billingRepository.QueryQuotations(org.Id).CountAsync();
        var quotationNumber = $"QT-{(count + 1):D5}";

        var lines = request.Lines.Select(l => new BillingQuotationLine
        {
            Description = l.Description,
            Quantity = l.Quantity,
            UnitPrice = l.UnitPrice,
            LineTotal = l.Quantity * l.UnitPrice
        }).ToList();

        var quotation = new BillingQuotation
        {
            BillingOrganizationId = org.Id,
            BillingCustomerId = request.BillingCustomerId,
            QuotationNumber = quotationNumber,
            IssuedAt = DateTime.UtcNow,
            ValidUntil = request.ValidUntil,
            TotalAmount = lines.Sum(l => l.LineTotal),
            Lines = lines
        };
        _billingRepository.AddQuotation(quotation);
        await _unitOfWork.SaveChangesAsync();
        return (await GetQuotationAsync(customerId, quotation.Id))!;
    }

    public async Task<List<QuotationResponse>> GetQuotationsAsync(Guid customerId)
    {
        var org = await _billingRepository.GetOrganizationByCustomerAsync(customerId);
        if (org == null) return new List<QuotationResponse>();
        var quotations = await _billingRepository.QueryQuotations(org.Id).OrderByDescending(q => q.IssuedAt).ToListAsync();
        var result = new List<QuotationResponse>();
        foreach (var q in quotations)
        {
            var mapped = await GetQuotationAsync(customerId, q.Id);
            if (mapped != null) result.Add(mapped);
        }
        return result;
    }

    public async Task<QuotationResponse?> GetQuotationAsync(Guid customerId, Guid quotationId)
    {
        var org = await _billingRepository.GetOrganizationByCustomerAsync(customerId);
        if (org == null) return null;
        var quotation = await _billingRepository.GetQuotationAsync(quotationId);
        if (quotation == null || quotation.BillingOrganizationId != org.Id) return null;

        return new QuotationResponse
        {
            Id = quotation.Id,
            QuotationNumber = quotation.QuotationNumber,
            TotalAmount = quotation.TotalAmount,
            IssuedAt = quotation.IssuedAt,
            ValidUntil = quotation.ValidUntil,
            Customer = quotation.BillingCustomer == null ? null : MapCustomer(quotation.BillingCustomer),
            Organization = MapOrg(quotation.BillingOrganization ?? org),
            Lines = quotation.Lines.Select(l => new InvoiceLineResponse
            {
                Description = l.Description,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                LineTotal = l.LineTotal
            }).ToList()
        };
    }

    public async Task<InvoiceResponse?> ConvertQuotationToInvoiceAsync(Guid customerId, Guid quotationId)
    {
        var quotation = await GetQuotationAsync(customerId, quotationId);
        if (quotation == null) return null;

        return await CreateInvoiceAsync(customerId, new CreateInvoiceRequest
        {
            BillingCustomerId = quotation.Customer!.Id,
            DueAt = quotation.ValidUntil,
            Lines = quotation.Lines.Select(l => new InvoiceLineRequest
            {
                Description = l.Description,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice
            }).ToList()
        });
    }

    private async Task<BillingOrganization> GetOrCreateOrgAsync(Guid customerId)
    {
        var org = await _billingRepository.GetOrganizationByCustomerAsync(customerId);
        if (org != null) return org;
        org = new BillingOrganization
        {
            CustomerId = customerId,
            LegalName = "My Company",
            InvoicePrefix = "INV",
            CreatedAt = DateTime.UtcNow
        };
        _billingRepository.AddOrganization(org);
        await _unitOfWork.SaveChangesAsync();
        return org;
    }

    private static BillingOrganizationResponse MapOrg(BillingOrganization org) =>
        new()
        {
            Id = org.Id,
            LegalName = org.LegalName,
            Address = org.Address,
            LogoUrl = org.LogoUrl,
            InvoicePrefix = org.InvoicePrefix
        };

    private static BillingCustomerDto MapCustomer(BillingCustomer customer) =>
        new()
        {
            Id = customer.Id,
            Name = customer.Name,
            Email = customer.Email,
            Phone = customer.Phone,
            Address = customer.Address
        };

    private static BillingProductDto MapProduct(BillingProduct product) =>
        new()
        {
            Id = product.Id,
            Name = product.Name,
            Description = product.Description,
            UnitPrice = product.UnitPrice,
            IsActive = product.IsActive
        };
}
