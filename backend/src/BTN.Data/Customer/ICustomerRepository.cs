using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Data.Customer;

public interface ICustomerRepository
{
    IQueryable<Entities.Customer> Query();
    Task<Entities.Customer?> GetByIdAsync(Guid id);
    Task<Entities.Customer?> GetByUserIdAsync(Guid userId);
    void Add(Entities.Customer customer);
    IQueryable<Entities.Lead> QueryAvailableLeads();
    Task<Entities.Lead?> GetLeadForCustomerAsync(Guid leadId, Guid customerId);
}

