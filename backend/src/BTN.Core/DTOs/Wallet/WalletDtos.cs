namespace BTN.Core.DTOs.Wallet;

public class WalletResponse
{
    public Guid Id { get; set; }
    public long BalanceMinor { get; set; }
    public decimal Balance => BalanceMinor / 100m;
    public string Currency { get; set; } = "INR";
}

public class WalletTransactionResponse
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public long AmountMinor { get; set; }
    public decimal Amount => AmountMinor / 100m;
    public long BalanceAfter { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TopUpRequest
{
    public decimal Amount { get; set; }
}

public class TopUpResponse
{
    public Guid PaymentOrderId { get; set; }
    public string Provider { get; set; } = "Razorpay";
    public string? ProviderOrderId { get; set; }
    public string? RazorpayKeyId { get; set; }
    public long AmountMinor { get; set; }
    public string Currency { get; set; } = "INR";
}

public class ConfirmTopUpRequest
{
    public Guid PaymentOrderId { get; set; }
    public string? ProviderPaymentId { get; set; }
    public string? IdempotencyKey { get; set; }
}
