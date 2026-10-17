using BTN.Core.Campaign;
using BTN.Core.DTOs;
using BTN.Core.DTOs.Campaign;
using BTN.Core.DTOs.Leads;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Campaign;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Business.Campaign;

public interface ICampaignSubmissionManager
{
    Task<Guid> SubmitAsync(CampaignLeadRequest request);
    Task<PagedResult<CampaignSubmissionResponse>> GetSubmissionsAsync(int page, int pageSize, string? platform, string? search, GiftStatus? giftStatus, string? jobRole);
    Task<CampaignSubmissionResponse?> GetByIdAsync(Guid id);
    Task<CampaignSubmissionResponse> UpdateStatusAsync(Guid id, GiftStatus giftStatus);
}

public class CampaignSubmissionManager : ICampaignSubmissionManager
{
    private readonly ICampaignSubmissionRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public CampaignSubmissionManager(ICampaignSubmissionRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> SubmitAsync(CampaignLeadRequest request)
    {
        var phone = NormalizePhone(request.Phone);
        if (phone.Length != 10)
        {
            throw new InvalidOperationException("Enter a valid 10-digit mobile number.");
        }

        var submission = new CampaignSubmission
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            Phone = phone,
            Email = request.Email.Trim(),
            Address = request.Address.Trim(),
            City = request.City.Trim(),
            State = request.State.Trim(),
            Pincode = request.Pincode.Trim(),
            ProductInterest = string.IsNullOrWhiteSpace(request.ProductInterest) ? null : request.ProductInterest.Trim(),
            JobInterest = string.IsNullOrWhiteSpace(request.JobInterest) ? null : request.JobInterest.Trim().ToLowerInvariant(),
            JobRole = string.IsNullOrWhiteSpace(request.JobRole) ? null : request.JobRole.Trim(),
            Platform = CampaignPlatform.Normalize(request.Platform),
            Campaign = string.IsNullOrWhiteSpace(request.Campaign) ? "BTN Gift Campaign" : request.Campaign.Trim(),
            GiftStatus = GiftStatus.Processing,
            StatusUpdatedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _repository.Add(submission);
        await _unitOfWork.SaveChangesAsync();
        return submission.Id;
    }

    public async Task<PagedResult<CampaignSubmissionResponse>> GetSubmissionsAsync(int page, int pageSize, string? platform, string? search, GiftStatus? giftStatus, string? jobRole)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var query = _repository.Query();
        if (!string.IsNullOrWhiteSpace(platform) && !string.Equals(platform, "all", StringComparison.OrdinalIgnoreCase))
        {
            var normalized = CampaignPlatform.Normalize(platform);
            query = query.Where(s => s.Platform == normalized);
        }

        if (giftStatus.HasValue)
        {
            query = query.Where(s => s.GiftStatus == giftStatus.Value);
        }

        if (!string.IsNullOrWhiteSpace(jobRole) && !string.Equals(jobRole, "all", StringComparison.OrdinalIgnoreCase))
        {
            var role = jobRole.Trim();
            query = query.Where(s => s.JobRole == role);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(s =>
                s.FullName.ToLower().Contains(term) ||
                s.Phone.Contains(term) ||
                s.Email.ToLower().Contains(term) ||
                s.City.ToLower().Contains(term) ||
                s.Pincode.Contains(term) ||
                s.Campaign.ToLower().Contains(term) ||
                (s.JobRole != null && s.JobRole.ToLower().Contains(term)));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<CampaignSubmissionResponse>
        {
            Items = items.Select(Map).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<CampaignSubmissionResponse?> GetByIdAsync(Guid id)
    {
        var row = await _repository.Query().FirstOrDefaultAsync(s => s.Id == id);
        return row == null ? null : Map(row);
    }

    public async Task<CampaignSubmissionResponse> UpdateStatusAsync(Guid id, GiftStatus giftStatus)
    {
        var row = await _repository.Query().FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new KeyNotFoundException("Submission not found.");
        row.GiftStatus = giftStatus;
        row.StatusUpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();
        return Map(row);
    }

    private static CampaignSubmissionResponse Map(CampaignSubmission s) => new()
    {
        Id = s.Id,
        FullName = s.FullName,
        Phone = s.Phone,
        Email = s.Email,
        Address = s.Address,
        City = s.City,
        State = s.State,
        Pincode = s.Pincode,
        ProductInterest = s.ProductInterest,
        JobInterest = s.JobInterest,
        JobRole = s.JobRole,
        Platform = s.Platform,
        Campaign = s.Campaign,
        GiftStatus = s.GiftStatus,
        StatusUpdatedAt = s.StatusUpdatedAt,
        CreatedAt = s.CreatedAt
    };

    public static string NormalizePhone(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var digits = new string(raw.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("91") && digits.Length == 12) return digits[2..];
        if (digits.Length > 10) return digits[^10..];
        return digits;
    }
}
