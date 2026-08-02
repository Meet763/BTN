using System.Text.Json;
using BTN.Core.DTOs;
using BTN.Core.DTOs.Leads;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Entities;
using BTN.Data.Lead;
using Microsoft.EntityFrameworkCore;
using LeadEntity = BTN.Data.Entities.Lead;

namespace BTN.Business.Lead;

public interface ILeadManager
{
    Task<LeadResponse> CreateLeadAsync(CreateLeadRequest request);
    Task<PagedResult<LeadResponse>> GetLeadsAsync(int page, int pageSize, string? status, string? source, string? search, DateTime? dateFrom, DateTime? dateTo, bool? isDuplicate, Guid? assignedEmployeeId = null);
    Task<LeadResponse?> GetLeadByIdAsync(Guid id, bool maskPii = false);
    Task<LeadResponse?> UpdateLeadAsync(Guid id, UpdateLeadRequest request, Guid userId);
    Task<LeadStatsResponse> GetStatsAsync();
    Task<BulkImportResponse> BulkImportLeadsAsync(BulkImportLeadsRequest request);
    Task<LeadResponse?> SetListPriceAsync(Guid id, decimal price, Guid changedBy);
    Task<LeadResponse?> SetSaleStatusAsync(Guid id, SaleStatus saleStatus, Guid changedBy);
    Task<bool> DeleteLeadAsync(Guid id);
}

public class LeadManager : ILeadManager
{
    private readonly ILeadRepository _leadRepository;
    private readonly IUnitOfWork _unitOfWork;

    public LeadManager(ILeadRepository leadRepository, IUnitOfWork unitOfWork)
    {
        _leadRepository = leadRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<LeadResponse> CreateLeadAsync(CreateLeadRequest request)
    {
        var cleanPhone = request.Phone.Trim();
        var duplicateOf = await _leadRepository.FindDuplicateByPhoneAsync(cleanPhone, DateTime.UtcNow.AddDays(-30));
        var rawDataString = request.RawData.HasValue ? JsonSerializer.Serialize(request.RawData.Value) : null;

        var lead = new LeadEntity
        {
            CustomerName = request.CustomerName,
            Phone = cleanPhone,
            Email = request.Email,
            City = request.City,
            State = request.State,
            Pincode = request.Pincode,
            Source = request.Source,
            ProductInterest = request.ProductInterest,
            RawData = rawDataString,
            VerificationStatus = LeadStatus.Pending,
            WorkflowStatus = LeadWorkflowStatus.Created,
            SaleStatus = SaleStatus.NotForSale,
            IsDuplicate = duplicateOf != null,
            DuplicateOfLeadId = duplicateOf?.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _leadRepository.Add(lead);
        await _unitOfWork.SaveChangesAsync();
        return LeadMapper.Map(lead);
    }

    public async Task<PagedResult<LeadResponse>> GetLeadsAsync(int page, int pageSize, string? status, string? source, string? search, DateTime? dateFrom, DateTime? dateTo, bool? isDuplicate, Guid? assignedEmployeeId = null)
    {
        var query = _leadRepository.QueryLeads();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<LeadStatus>(status, true, out var statusEnum))
        {
            query = query.Where(l => l.VerificationStatus == statusEnum);
        }

        if (!string.IsNullOrWhiteSpace(source) && Enum.TryParse<LeadSource>(source, true, out var sourceEnum))
        {
            query = query.Where(l => l.Source == sourceEnum);
        }

        if (isDuplicate.HasValue)
        {
            query = query.Where(l => l.IsDuplicate == isDuplicate.Value);
        }

        if (assignedEmployeeId.HasValue)
        {
            query = query.Where(l => l.AssignedEmployeeId == assignedEmployeeId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowerSearch = search.ToLower();
            query = query.Where(l => l.CustomerName.ToLower().Contains(lowerSearch) || l.Phone.Contains(lowerSearch));
        }

        if (dateFrom.HasValue)
        {
            query = query.Where(l => l.CreatedAt >= DateTime.SpecifyKind(dateFrom.Value, DateTimeKind.Utc));
        }

        if (dateTo.HasValue)
        {
            query = query.Where(l => l.CreatedAt <= DateTime.SpecifyKind(dateTo.Value, DateTimeKind.Utc));
        }

        var totalCount = await query.CountAsync();
        var leads = await query.OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<LeadResponse>
        {
            Items = leads.Select(l => LeadMapper.Map(l)).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<LeadResponse?> GetLeadByIdAsync(Guid id, bool maskPii = false)
    {
        var lead = await _leadRepository.GetByIdAsync(id);
        return lead == null ? null : LeadMapper.Map(lead, maskPii);
    }

    public async Task<LeadResponse?> UpdateLeadAsync(Guid id, UpdateLeadRequest request, Guid userId)
    {
        var lead = await _leadRepository.GetByIdForUpdateAsync(id);
        if (lead == null) return null;

        lead.InquiryType = request.InquiryType ?? lead.InquiryType;
        lead.ProductInterest = request.ProductInterest ?? lead.ProductInterest;
        lead.InquiryDetails = request.InquiryDetails ?? lead.InquiryDetails;
        lead.CustomerRequirements = request.CustomerRequirements ?? lead.CustomerRequirements;
        lead.BudgetAmount = request.BudgetAmount ?? lead.BudgetAmount;
        lead.Timeline = request.Timeline ?? lead.Timeline;
        lead.ContactOutcome = request.ContactOutcome ?? lead.ContactOutcome;
        lead.FollowUpAt = request.FollowUpAt ?? lead.FollowUpAt;
        lead.Remarks = request.Remarks ?? lead.Remarks;
        lead.InternalNotes = request.InternalNotes ?? lead.InternalNotes;
        lead.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync();
        return await GetLeadByIdAsync(id);
    }

    public async Task<LeadStatsResponse> GetStatsAsync()
    {
        var today = DateTime.UtcNow.Date;
        var query = _leadRepository.QueryLeads();

        var totalLeads = await query.CountAsync();
        var pendingVerification = await query.CountAsync(l => l.VerificationStatus == LeadStatus.Pending);
        var verifiedToday = await query.CountAsync(l => l.VerificationStatus == LeadStatus.Verified && l.VerifiedAt >= today);
        var rejectedToday = await query.CountAsync(l => l.VerificationStatus == LeadStatus.Rejected && l.VerifiedAt >= today);
        var duplicatesFound = await query.CountAsync(l => l.IsDuplicate);

        var verifiedCount = await query.CountAsync(l => l.VerificationStatus == LeadStatus.Verified);
        var rejectedCount = await query.CountAsync(l => l.VerificationStatus == LeadStatus.Rejected);
        var totalProcessed = verifiedCount + rejectedCount;
        var verificationRate = totalProcessed > 0 ? Math.Round((double)verifiedCount / totalProcessed * 100, 1) : 0;

        var callsWithDuration = await _leadRepository.QueryVerifications()
            .Where(v => v.CallDurationSeconds.HasValue && v.CallDurationSeconds > 0)
            .Select(v => v.CallDurationSeconds!.Value)
            .ToListAsync();

        var avgCallDuration = callsWithDuration.Count > 0 ? (int)Math.Round(callsWithDuration.Average()) : 0;

        var sourceBreakdown = await query.GroupBy(l => l.Source)
            .Select(g => new { Source = g.Key.ToString(), Count = g.Count() })
            .ToDictionaryAsync(x => x.Source, x => x.Count);

        foreach (var src in Enum.GetNames<LeadSource>())
        {
            sourceBreakdown.TryAdd(src, 0);
        }

        var rejectionReasons = await _leadRepository.QueryVerifications()
            .Where(v => v.Result == VerificationResult.Rejected && v.RejectionReason != null)
            .GroupBy(v => v.RejectionReason!)
            .Select(g => new { Reason = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Reason, x => x.Count);

        return new LeadStatsResponse
        {
            TotalLeads = totalLeads,
            PendingVerification = pendingVerification,
            VerifiedToday = verifiedToday,
            RejectedToday = rejectedToday,
            DuplicatesFound = duplicatesFound,
            VerificationRate = verificationRate,
            AvgCallDurationSeconds = avgCallDuration,
            SourceBreakdown = sourceBreakdown,
            RejectionReasons = rejectionReasons
        };
    }

    public async Task<BulkImportResponse> BulkImportLeadsAsync(BulkImportLeadsRequest request)
    {
        var response = new BulkImportResponse
        {
            TotalReceived = request.Leads.Count
        };

        foreach (var item in request.Leads)
        {
            try
            {
                var created = await CreateLeadAsync(item);
                response.Created++;
                if (created.IsDuplicate) response.Duplicates++;
            }
            catch
            {
                response.Errors++;
            }
        }

        return response;
    }

    public async Task<LeadResponse?> SetListPriceAsync(Guid id, decimal price, Guid changedBy)
    {
        var lead = await _leadRepository.GetByIdForUpdateAsync(id);
        if (lead == null) return null;
        var from = lead.WorkflowStatus.ToString();
        lead.ListPrice = price;
        lead.UpdatedAt = DateTime.UtcNow;
        // Price only — admin must click Publish to list on customer marketplace.

        _leadRepository.AddStatusHistory(new LeadStatusHistory
        {
            LeadId = lead.Id,
            FromStatus = from,
            ToStatus = lead.WorkflowStatus.ToString(),
            ChangedBy = changedBy,
            ChangedAt = DateTime.UtcNow,
            Note = $"List price set to {price} (not published yet)"
        });

        await _unitOfWork.SaveChangesAsync();
        return await GetLeadByIdAsync(id);
    }

    public async Task<LeadResponse?> SetSaleStatusAsync(Guid id, SaleStatus saleStatus, Guid changedBy)
    {
        var lead = await _leadRepository.GetByIdForUpdateAsync(id);
        if (lead == null) return null;
        var from = lead.SaleStatus.ToString();
        lead.SaleStatus = saleStatus;
        lead.UpdatedAt = DateTime.UtcNow;
        if (saleStatus == SaleStatus.Available)
        {
            lead.WorkflowStatus = LeadWorkflowStatus.ListedForSale;
        }
        else if (saleStatus == SaleStatus.Sold)
        {
            lead.WorkflowStatus = LeadWorkflowStatus.Sold;
        }

        _leadRepository.AddStatusHistory(new LeadStatusHistory
        {
            LeadId = lead.Id,
            FromStatus = from,
            ToStatus = saleStatus.ToString(),
            ChangedBy = changedBy,
            ChangedAt = DateTime.UtcNow,
            Note = $"Sale status → {saleStatus}"
        });

        await _unitOfWork.SaveChangesAsync();
        return await GetLeadByIdAsync(id);
    }

    public async Task<bool> DeleteLeadAsync(Guid id)
    {
        var lead = await _leadRepository.GetByIdForUpdateAsync(id);
        if (lead == null) return false;

        if (lead.SaleStatus == SaleStatus.Sold)
        {
            throw new InvalidOperationException("Cannot delete a sold lead.");
        }

        _leadRepository.Remove(lead);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
}
