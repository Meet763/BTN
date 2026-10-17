using BTN.Core.Enums;

namespace BTN.Core.DTOs.Campaign;

public class CampaignSubmissionResponse
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public string? ProductInterest { get; set; }
    public string? JobInterest { get; set; }
    public string? JobRole { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string Campaign { get; set; } = string.Empty;
    public GiftStatus GiftStatus { get; set; }
    public DateTime? StatusUpdatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateGiftStatusRequest
{
    public GiftStatus GiftStatus { get; set; }
}

public class CampaignFormAppearanceResponse
{
    public string ThemeKey { get; set; } = "forest-gold";
    public string BackgroundColor { get; set; } = "#0f1c17";
    public string AccentColor { get; set; } = "#e8c572";
    public string CtaColor { get; set; } = "#d4a853";
}

public class UpdateCampaignFormAppearanceRequest
{
    public string ThemeKey { get; set; } = "forest-gold";
    public string? BackgroundColor { get; set; }
    public string? AccentColor { get; set; }
    public string? CtaColor { get; set; }
}
