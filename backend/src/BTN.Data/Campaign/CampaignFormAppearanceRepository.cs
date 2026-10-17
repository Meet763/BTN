using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Data.Campaign;

public interface ICampaignFormAppearanceRepository
{
    Task<CampaignFormAppearance?> GetAsync();
    void Add(CampaignFormAppearance appearance);
}

public class CampaignFormAppearanceRepository : ICampaignFormAppearanceRepository
{
    private readonly BtnDbContext _context;

    public CampaignFormAppearanceRepository(BtnDbContext context)
    {
        _context = context;
    }

    public Task<CampaignFormAppearance?> GetAsync() =>
        _context.CampaignFormAppearances.OrderBy(a => a.Id).FirstOrDefaultAsync();

    public void Add(CampaignFormAppearance appearance) => _context.CampaignFormAppearances.Add(appearance);
}
