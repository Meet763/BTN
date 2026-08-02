namespace BTN.Core.DTOs.Billing;

public class BillingOrganizationResponse
{
    public Guid Id { get; set; }
    public string LegalName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? LogoUrl { get; set; }
    public string InvoicePrefix { get; set; } = "INV";
}

public class UpsertBillingOrganizationRequest
{
    public string LegalName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? LogoUrl { get; set; }
    public string InvoicePrefix { get; set; } = "INV";
}

public class BillingCustomerDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
}

public class CreateBillingCustomerRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
}

public class BillingProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal UnitPrice { get; set; }
    public bool IsActive { get; set; }
}

public class CreateBillingProductRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal UnitPrice { get; set; }
}

public class InvoiceLineRequest
{
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
}

public class CreateInvoiceRequest
{
    public Guid BillingCustomerId { get; set; }
    public DateTime? DueAt { get; set; }
    public List<InvoiceLineRequest> Lines { get; set; } = new();
}

public class InvoiceResponse
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal AmountPaid { get; set; }
    public DateTime IssuedAt { get; set; }
    public DateTime? DueAt { get; set; }
    public BillingCustomerDto? Customer { get; set; }
    public List<InvoiceLineResponse> Lines { get; set; } = new();
    public BillingOrganizationResponse? Organization { get; set; }
}

public class InvoiceLineResponse
{
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}

public class RecordInvoicePaymentRequest
{
    public decimal Amount { get; set; }
    public string? Method { get; set; }
    public string? Reference { get; set; }
}

public class CreateQuotationRequest
{
    public Guid BillingCustomerId { get; set; }
    public DateTime? ValidUntil { get; set; }
    public List<InvoiceLineRequest> Lines { get; set; } = new();
}

public class QuotationResponse
{
    public Guid Id { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public DateTime IssuedAt { get; set; }
    public DateTime? ValidUntil { get; set; }
    public BillingCustomerDto? Customer { get; set; }
    public List<InvoiceLineResponse> Lines { get; set; } = new();
    public BillingOrganizationResponse? Organization { get; set; }
}
