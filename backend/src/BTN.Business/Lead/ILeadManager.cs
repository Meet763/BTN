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

