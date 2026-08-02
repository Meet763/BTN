namespace BTN.Core.DTOs.Purchase;

public class PurchaseLeadRequest
{
    public Guid LeadId { get; set; }
}

public class PurchaseResponse
{
    public Guid Id { get; set; }
    public Guid LeadId { get; set; }
    public decimal Price { get; set; }
    public DateTime PurchasedAt { get; set; }
    public BTN.Core.DTOs.Leads.LeadResponse? Lead { get; set; }
}
