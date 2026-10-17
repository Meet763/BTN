using System.Text.RegularExpressions;

namespace BTN.Core.Campaign;

public static class GiftFormThemes
{
    public const string ForestGold = "forest-gold";
    public const string WarmTrust = "warm-trust";
    public const string MidnightRose = "midnight-rose";
    public const string Custom = "custom";

    public static readonly Guid AppearanceId = Guid.Parse("7c0a0c11-0f0f-4e11-9f01-000000000001");

    private static readonly Regex Hex = new("^#[0-9A-Fa-f]{6}$", RegexOptions.Compiled);

    public static bool IsHex(string? value) => !string.IsNullOrWhiteSpace(value) && Hex.IsMatch(value.Trim());

    public static string NormalizeHex(string? value, string fallback)
    {
        if (!IsHex(value)) return fallback;
        return value!.Trim().ToLowerInvariant();
    }

    public static bool IsKnownTheme(string? themeKey)
    {
        var key = (themeKey ?? string.Empty).Trim().ToLowerInvariant();
        return key is ForestGold or WarmTrust or MidnightRose or Custom;
    }

    public static (string ThemeKey, string Background, string Accent, string Cta) Resolve(string? themeKey, string? background, string? accent, string? cta)
    {
        var key = (themeKey ?? ForestGold).Trim().ToLowerInvariant();
        return key switch
        {
            WarmTrust => (WarmTrust, "#f6f1e8", "#1e3a5f", "#c45c26"),
            MidnightRose => (MidnightRose, "#1a1420", "#e8b4b8", "#d4a574"),
            Custom => (
                Custom,
                NormalizeHex(background, "#0f1c17"),
                NormalizeHex(accent, "#e8c572"),
                NormalizeHex(cta, "#d4a853")),
            _ => (ForestGold, "#0f1c17", "#e8c572", "#d4a853")
        };
    }
}
