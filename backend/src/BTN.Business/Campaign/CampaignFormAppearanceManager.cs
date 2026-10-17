using BTN.Core.Campaign;
using BTN.Core.DTOs.Campaign;
using BTN.Data;
using BTN.Data.Campaign;
using BTN.Data.Entities;

namespace BTN.Business.Campaign;

public interface ICampaignFormAppearanceManager
{
    Task<CampaignFormAppearanceResponse> GetAsync();
    Task<CampaignFormAppearanceResponse> UpdateAsync(UpdateCampaignFormAppearanceRequest request);
}

public class CampaignFormAppearanceManager : ICampaignFormAppearanceManager
{
    private readonly ICampaignFormAppearanceRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public CampaignFormAppearanceManager(ICampaignFormAppearanceRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<CampaignFormAppearanceResponse> GetAsync()
    {
        var row = await EnsureAsync();
        return Map(row);
    }

    public async Task<CampaignFormAppearanceResponse> UpdateAsync(UpdateCampaignFormAppearanceRequest request)
    {
        if (!GiftFormThemes.IsKnownTheme(request.ThemeKey))
        {
            throw new InvalidOperationException("Choose Forest Gold, Warm Trust, Midnight Rose, or Custom.");
        }

        var key = request.ThemeKey.Trim().ToLowerInvariant();
        if (key == GiftFormThemes.Custom)
        {
            if (!GiftFormThemes.IsHex(request.BackgroundColor) ||
                !GiftFormThemes.IsHex(request.AccentColor) ||
                !GiftFormThemes.IsHex(request.CtaColor))
            {
                throw new InvalidOperationException("Custom look needs three colors as #RRGGBB.");
            }
        }

        var resolved = GiftFormThemes.Resolve(key, request.BackgroundColor, request.AccentColor, request.CtaColor);
        var row = await EnsureAsync();
        row.ThemeKey = resolved.ThemeKey;
        row.BackgroundColor = resolved.Background;
        row.AccentColor = resolved.Accent;
        row.CtaColor = resolved.Cta;
        row.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();
        return Map(row);
    }

    private async Task<CampaignFormAppearance> EnsureAsync()
    {
        var row = await _repository.GetAsync();
        if (row != null)
        {
            return row;
        }

        var seed = GiftFormThemes.Resolve(GiftFormThemes.ForestGold, null, null, null);
        row = new CampaignFormAppearance
        {
            Id = GiftFormThemes.AppearanceId,
            ThemeKey = seed.ThemeKey,
            BackgroundColor = seed.Background,
            AccentColor = seed.Accent,
            CtaColor = seed.Cta,
            UpdatedAt = DateTime.UtcNow
        };
        _repository.Add(row);
        await _unitOfWork.SaveChangesAsync();
        return row;
    }

    private static CampaignFormAppearanceResponse Map(CampaignFormAppearance row) => new()
    {
        ThemeKey = row.ThemeKey,
        BackgroundColor = row.BackgroundColor,
        AccentColor = row.AccentColor,
        CtaColor = row.CtaColor
    };
}
