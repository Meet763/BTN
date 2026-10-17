using BTN.Core.DTOs;
using BTN.Core.DTOs.Customer;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Customer;
using BTN.Data.User;
using BTN.Data.Wallet;
using Microsoft.EntityFrameworkCore;
using UserEntity = BTN.Data.Entities.User;

namespace BTN.Business.Customer;

public interface ICustomerManager
{
    Task<PagedResult<CustomerResponse>> GetCustomersAsync(int page, int pageSize);
    Task<CustomerResponse> CreateAsync(CreateCustomerRequest request, Guid adminId);
    Task<CustomerResponse?> GetByUserIdAsync(Guid userId);
    Task<PagedResult<BTN.Core.DTOs.Leads.LeadResponse>> GetAvailableLeadsAsync(int page, int pageSize, string? search, string? city);
}

