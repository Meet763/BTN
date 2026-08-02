namespace BTN.Core.DTOs.Dashboard;

public class AdminDashboardResponse
{
    public int TotalLeads { get; set; }
    public int PendingVerification { get; set; }
    public int VerifiedLeads { get; set; }
    public int TotalSales { get; set; }
    public decimal TotalWalletCredits { get; set; }
}
