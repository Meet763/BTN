using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Data.Campaign;

public interface ICampaignSubmissionRepository
{
    void Add(CampaignSubmission submission);
    IQueryable<CampaignSubmission> Query();
}

public class CampaignSubmissionRepository : ICampaignSubmissionRepository
{
    private readonly BtnDbContext _context;

    public CampaignSubmissionRepository(BtnDbContext context)
    {
        _context = context;
    }

    public void Add(CampaignSubmission submission) => _context.CampaignSubmissions.Add(submission);

    public IQueryable<CampaignSubmission> Query() => _context.CampaignSubmissions.AsQueryable();
}
