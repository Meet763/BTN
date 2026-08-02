using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BTN.Core.DTOs;
using BTN.Core.DTOs.Leads;
using BTN.Core.Entities;
using BTN.Core.Enums;
using BTN.Core.Interfaces;
using BTN.Infrastructure.Data;

namespace BTN.Services
{
    public class LeadService : ILeadService
    {
        private readonly BtnDbContext _context;

        public LeadService(BtnDbContext context)
        {
            _context = context;
        }

        public async Task<LeadResponse> CreateLeadAsync(CreateLeadRequest request)
        {
            // Clean phone string
            var cleanPhone = request.Phone.Trim();

            // Duplicate detection: check if same phone number was added in the last 30 days
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var duplicateOf = await _context.Leads
                .Where(l => l.Phone == cleanPhone && l.CreatedAt >= thirtyDaysAgo)
                .OrderByDescending(l => l.CreatedAt)
                .FirstOrDefaultAsync();

            var rawDataString = request.RawData.HasValue ? JsonSerializer.Serialize(request.RawData.Value) : null;

            var lead = new Lead
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
                IsDuplicate = duplicateOf != null,
                DuplicateOfLeadId = duplicateOf?.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Leads.Add(lead);
            await _context.SaveChangesAsync();

            // Audit log
            var auditLog = new AuditLog
            {
                Action = "Lead.Created",
                EntityType = "Lead",
                EntityId = lead.Id,
                NewValues = JsonSerializer.Serialize(new { lead.CustomerName, lead.Phone, Source = lead.Source.ToString(), lead.IsDuplicate }),
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return MapToLeadResponse(lead);
        }

        public async Task<PagedResult<LeadResponse>> GetLeadsAsync(int page, int pageSize, string? status, string? source, string? search, DateTime? dateFrom, DateTime? dateTo, bool? isDuplicate)
        {
            var query = _context.Leads
                .Include(l => l.VerifiedByUser)
                .Include(l => l.Verification)
                .AsQueryable();

            // Status filter
            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<LeadStatus>(status, true, out var statusEnum))
            {
                query = query.Where(l => l.VerificationStatus == statusEnum);
            }

            // Source filter
            if (!string.IsNullOrWhiteSpace(source) && Enum.TryParse<LeadSource>(source, true, out var sourceEnum))
            {
                query = query.Where(l => l.Source == sourceEnum);
            }

            // Duplicate filter
            if (isDuplicate.HasValue)
            {
                query = query.Where(l => l.IsDuplicate == isDuplicate.Value);
            }

            // Search filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(l => l.CustomerName.ToLower().Contains(lowerSearch) || l.Phone.Contains(lowerSearch));
            }

            // Date range filter
            if (dateFrom.HasValue)
            {
                query = query.Where(l => l.CreatedAt >= DateTime.SpecifyKind(dateFrom.Value, DateTimeKind.Utc));
            }
            if (dateTo.HasValue)
            {
                query = query.Where(l => l.CreatedAt <= DateTime.SpecifyKind(dateTo.Value, DateTimeKind.Utc));
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(l => l.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => MapToLeadResponse(l))
                .ToListAsync();

            return new PagedResult<LeadResponse>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<LeadResponse?> GetLeadByIdAsync(Guid id)
        {
            var lead = await _context.Leads
                .Include(l => l.VerifiedByUser)
                .Include(l => l.Verification)
                .ThenInclude(v => v.VerifiedByUser)
                .FirstOrDefaultAsync(l => l.Id == id);

            return lead != null ? MapToLeadResponse(lead) : null;
        }

        public async Task<LeadResponse?> VerifyLeadAsync(Guid id, VerifyLeadRequest request, Guid userId)
        {
            var lead = await _context.Leads
                .Include(l => l.Verification)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lead == null)
            {
                return null;
            }

            if (lead.VerificationStatus != LeadStatus.Pending)
            {
                throw new InvalidOperationException("This lead has already been processed.");
            }

            var agent = await _context.Users.FindAsync(userId);
            if (agent == null)
            {
                throw new KeyNotFoundException("Verification agent not found.");
            }

            // Create verification entry
            var verification = new LeadVerification
            {
                LeadId = lead.Id,
                VerifiedBy = userId,
                IsPhoneValid = request.IsPhoneValid,
                IsRequirementReal = request.IsRequirementReal,
                IntentLevel = request.IntentLevel,
                IsLocationServiceable = request.IsLocationServiceable,
                CallAttempted = request.CallAttempted,
                CallConnected = request.CallConnected,
                CallDurationSeconds = request.CallDurationSeconds,
                CallNotes = request.CallNotes,
                Result = request.Result,
                RejectionReason = request.Result == VerificationResult.Rejected ? request.RejectionReason : null,
                CreatedAt = DateTime.UtcNow
            };

            _context.LeadVerifications.Add(verification);

            // Update lead
            lead.VerificationStatus = request.Result == VerificationResult.Verified ? LeadStatus.Verified : LeadStatus.Rejected;
            lead.VerifiedBy = userId;
            lead.VerifiedAt = DateTime.UtcNow;
            lead.UpdatedAt = DateTime.UtcNow;

            // Audit log
            var auditLog = new AuditLog
            {
                UserId = userId,
                Action = request.Result == VerificationResult.Verified ? "Lead.Verified" : "Lead.Rejected",
                EntityType = "Lead",
                EntityId = lead.Id,
                NewValues = JsonSerializer.Serialize(new { Result = lead.VerificationStatus.ToString(), Notes = request.CallNotes }),
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();

            // Return updated lead
            return await GetLeadByIdAsync(lead.Id);
        }

        public async Task<LeadStatsResponse> GetStatsAsync()
        {
            var today = DateTime.UtcNow.Date;
            
            var totalLeads = await _context.Leads.CountAsync();
            var pendingVerification = await _context.Leads.CountAsync(l => l.VerificationStatus == LeadStatus.Pending);
            
            var verifiedToday = await _context.Leads.CountAsync(l => l.VerificationStatus == LeadStatus.Verified && l.VerifiedAt >= today);
            var rejectedToday = await _context.Leads.CountAsync(l => l.VerificationStatus == LeadStatus.Rejected && l.VerifiedAt >= today);
            
            var duplicatesFound = await _context.Leads.CountAsync(l => l.IsDuplicate);

            var verifiedCount = await _context.Leads.CountAsync(l => l.VerificationStatus == LeadStatus.Verified);
            var rejectedCount = await _context.Leads.CountAsync(l => l.VerificationStatus == LeadStatus.Rejected);
            var totalProcessed = verifiedCount + rejectedCount;
            
            double verificationRate = totalProcessed > 0 
                ? Math.Round(((double)verifiedCount / totalProcessed) * 100, 1) 
                : 0;

            var avgCallDuration = 0;
            var callsWithDuration = await _context.LeadVerifications
                .Where(v => v.CallDurationSeconds.HasValue && v.CallDurationSeconds > 0)
                .Select(v => v.CallDurationSeconds!.Value)
                .ToListAsync();

            if (callsWithDuration.Any())
            {
                avgCallDuration = (int)Math.Round(callsWithDuration.Average());
            }

            // Source Breakdown
            var sourceGroup = await _context.Leads
                .GroupBy(l => l.Source)
                .Select(g => new { Source = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();
            
            var sourceBreakdown = sourceGroup.ToDictionary(g => g.Source, g => g.Count);

            // Fill empty sources if not present
            foreach (var src in Enum.GetNames<LeadSource>())
            {
                if (!sourceBreakdown.ContainsKey(src))
                {
                    sourceBreakdown[src] = 0;
                }
            }

            // Rejection reasons breakdown
            var rejectionsGroup = await _context.LeadVerifications
                .Where(v => v.Result == VerificationResult.Rejected && !string.IsNullOrEmpty(v.RejectionReason))
                .GroupBy(v => v.RejectionReason!)
                .Select(g => new { Reason = g.Key, Count = g.Count() })
                .ToListAsync();

            var rejectionReasons = rejectionsGroup.ToDictionary(g => g.Reason, g => g.Count);

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
                TotalReceived = request.Leads.Count,
                Created = 0,
                Duplicates = 0,
                Errors = 0
            };

            foreach (var item in request.Leads)
            {
                try
                {
                    var createdLead = await CreateLeadAsync(item);
                    response.Created++;
                    if (createdLead.IsDuplicate)
                    {
                        response.Duplicates++;
                    }
                }
                catch
                {
                    response.Errors++;
                }
            }

            return response;
        }

        public async Task<VerificationResponse?> GetLeadVerificationAsync(Guid id)
        {
            var verification = await _context.LeadVerifications
                .Include(v => v.VerifiedByUser)
                .FirstOrDefaultAsync(v => v.LeadId == id);

            if (verification == null) return null;

            return new VerificationResponse
            {
                LeadId = verification.LeadId,
                VerifiedByUser = verification.VerifiedByUser?.FullName ?? "Unknown",
                IsPhoneValid = verification.IsPhoneValid,
                IsRequirementReal = verification.IsRequirementReal,
                IntentLevel = verification.IntentLevel,
                IsLocationServiceable = verification.IsLocationServiceable,
                CallAttempted = verification.CallAttempted,
                CallConnected = verification.CallConnected,
                CallDurationSeconds = verification.CallDurationSeconds,
                CallNotes = verification.CallNotes,
                Result = verification.Result.ToString(),
                RejectionReason = verification.RejectionReason,
                CreatedAt = verification.CreatedAt
            };
        }

        private static LeadResponse MapToLeadResponse(Lead lead)
        {
            JsonElement? rawDataElement = null;
            if (!string.IsNullOrEmpty(lead.RawData))
            {
                try
                {
                    rawDataElement = JsonDocument.Parse(lead.RawData).RootElement;
                }
                catch
                {
                    // Ignore malformed json in db
                }
            }

            return new LeadResponse
            {
                Id = lead.Id,
                CustomerName = lead.CustomerName,
                Phone = lead.Phone,
                Email = lead.Email,
                City = lead.City,
                State = lead.State,
                Pincode = lead.Pincode,
                Source = lead.Source.ToString(),
                ProductInterest = lead.ProductInterest,
                RawData = rawDataElement,
                VerificationStatus = lead.VerificationStatus.ToString(),
                VerifiedByUser = lead.VerifiedByUser?.FullName,
                VerifiedAt = lead.VerifiedAt,
                IsDuplicate = lead.IsDuplicate,
                DuplicateOfLeadId = lead.DuplicateOfLeadId,
                CreatedAt = lead.CreatedAt,
                UpdatedAt = lead.UpdatedAt,
                Verification = lead.Verification != null ? new VerificationResponse
                {
                    LeadId = lead.Verification.LeadId,
                    VerifiedByUser = lead.Verification.VerifiedByUser?.FullName ?? "Unknown",
                    IsPhoneValid = lead.Verification.IsPhoneValid,
                    IsRequirementReal = lead.Verification.IsRequirementReal,
                    IntentLevel = lead.Verification.IntentLevel,
                    IsLocationServiceable = lead.Verification.IsLocationServiceable,
                    CallAttempted = lead.Verification.CallAttempted,
                    CallConnected = lead.Verification.CallConnected,
                    CallDurationSeconds = lead.Verification.CallDurationSeconds,
                    CallNotes = lead.Verification.CallNotes,
                    Result = lead.Verification.Result.ToString(),
                    RejectionReason = lead.Verification.RejectionReason,
                    CreatedAt = lead.Verification.CreatedAt
                } : null
            };
        }
    }
}
