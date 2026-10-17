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

public class CustomerManager : ICustomerManager
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IUserRepository _userRepository;
    private readonly IWalletRepository _walletRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CustomerManager(
        ICustomerRepository customerRepository,
        IUserRepository userRepository,
        IWalletRepository walletRepository,
        IUnitOfWork unitOfWork)
    {
        _customerRepository = customerRepository;
        _userRepository = userRepository;
        _walletRepository = walletRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<CustomerResponse>> GetCustomersAsync(int page, int pageSize)
    {
        var query = _customerRepository.Query();
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<CustomerResponse>
        {
            Items = items.Select(Map).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<CustomerResponse> CreateAsync(CreateCustomerRequest request, Guid adminId)
    {
        if (await _userRepository.EmailExistsAsync(request.Email))
        {
            throw new InvalidOperationException("Email address is already in use.");
        }

        var customerRole = (await _userRepository.GetAllRolesAsync())
            .FirstOrDefault(r => r.Name == UserRole.Customer.ToString())
            ?? throw new InvalidOperationException("Customer role is not configured.");

        var user = new UserEntity
        {
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12),
            RoleId = customerRole.Id,
            Status = UserStatus.Active,
            CreatedBy = adminId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _userRepository.Add(user);
        await _unitOfWork.SaveChangesAsync();

        var customer = new Data.Entities.Customer
        {
            UserId = user.Id,
            CompanyName = request.CompanyName,
            CreatedAt = DateTime.UtcNow
        };
        _customerRepository.Add(customer);
        await _unitOfWork.SaveChangesAsync();

        _walletRepository.Add(new Data.Entities.Wallet
        {
            Id = Guid.NewGuid(),
            CustomerId = customer.Id,
            BalanceMinor = 0,
            Currency = "INR",
            RowVersion = Guid.NewGuid().ToByteArray(),
            UpdatedAt = DateTime.UtcNow
        });

        await _unitOfWork.SaveChangesAsync();
        var created = await _customerRepository.GetByIdAsync(customer.Id);
        return Map(created!);
    }

    public async Task<CustomerResponse?> GetByUserIdAsync(Guid userId)
    {
        var customer = await _customerRepository.GetByUserIdAsync(userId);
        return customer == null ? null : Map(customer);
    }

    public async Task<PagedResult<BTN.Core.DTOs.Leads.LeadResponse>> GetAvailableLeadsAsync(int page, int pageSize, string? search, string? city)
    {
        var query = _customerRepository.QueryAvailableLeads();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(l => l.ProductInterest != null && l.ProductInterest.ToLower().Contains(lower));
        }

        if (!string.IsNullOrWhiteSpace(city))
        {
            query = query.Where(l => l.City != null && l.City.ToLower() == city.ToLower());
        }

        var total = await query.CountAsync();
        var leads = await query.OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<BTN.Core.DTOs.Leads.LeadResponse>
        {
            Items = leads.Select(l => BTN.Business.Lead.LeadMapper.Map(l, maskPii: true)).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    private static CustomerResponse Map(Data.Entities.Customer customer) =>
        new()
        {
            Id = customer.Id,
            UserId = customer.UserId,
            FullName = customer.User?.FullName ?? string.Empty,
            Email = customer.User?.Email ?? string.Empty,
            Phone = customer.User?.Phone,
            CompanyName = customer.CompanyName,
            CreatedAt = customer.CreatedAt
        };
}
