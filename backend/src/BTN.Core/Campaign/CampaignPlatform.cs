using BTN.Core.Enums;

namespace BTN.Core.Campaign;

public static class CampaignPlatform
{
    public static LeadSource ToLeadSource(string? platform)
    {
        return Normalize(platform) switch
        {
            "instagram" or "ig" or "insta" => LeadSource.Instagram,
            "facebook" or "fb" or "meta" or "metaads" => LeadSource.MetaAds,
            "twitter" or "x" => LeadSource.Twitter,
            "linkedin" => LeadSource.LinkedIn,
            "youtube" or "yt" => LeadSource.YouTube,
            "whatsapp" or "wa" => LeadSource.WhatsApp,
            "google" or "googleads" => LeadSource.GoogleAds,
            "website" or "web" => LeadSource.Website,
            "referral" => LeadSource.Referral,
            _ => LeadSource.Other
        };
    }

    public static string Normalize(string? platform)
    {
        if (string.IsNullOrWhiteSpace(platform)) return "other";
        return platform.Trim().ToLowerInvariant().Replace(" ", "");
    }

    public static string DisplayName(string? platform) => Normalize(platform) switch
    {
        "instagram" or "ig" or "insta" => "Instagram",
        "facebook" or "fb" or "meta" or "metaads" => "Facebook",
        "twitter" or "x" => "X / Twitter",
        "linkedin" => "LinkedIn",
        "youtube" or "yt" => "YouTube",
        "whatsapp" or "wa" => "WhatsApp",
        "google" or "googleads" => "Google",
        "website" or "web" => "Website",
        "referral" => "Referral",
        _ => "Campaign"
    };
}
