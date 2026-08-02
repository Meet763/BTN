using BTN.Core.DTOs;
using BTN.Core.DTOs.Employee;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Employee;
using BTN.Data.User;
using Microsoft.EntityFrameworkCore;
using UserEntity = BTN.Data.Entities.User;

namespace BTN.Business.Employee;

public interface IEmployeeManager
{
    Task<PagedResult<EmployeeResponse>> GetEmployeesAsync(int page, int pageSize, string? search);
    Task<EmployeeResponse?> GetByIdAsync(Guid id);
    Task<EmployeeResponse> CreateAsync(CreateEmployeeRequest request, Guid adminId);
    Task<EmployeeResponse?> UpdateAsync(Guid id, UpdateEmployeeRequest request);
    Task<bool> SetStatusAsync(Guid id, bool isActive);
    Task<EmployeePerformanceResponse?> GetPerformanceAsync(Guid id);
    Task<EmployeeResponse?> GetByUserIdAsync(Guid userId);
    Task<List<EmployeeWorkHistoryItem>> GetWorkHistoryAsync(Guid employeeId);
}

public class EmployeeManager : IEmployeeManager
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public EmployeeManager(
        IEmployeeRepository employeeRepository,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork)
    {
        _employeeRepository = employeeRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<EmployeeResponse>> GetEmployeesAsync(int page, int pageSize, string? search)
    {
        var query = _employeeRepository.Query();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(e =>
                e.User!.FullName.ToLower().Contains(lower) ||
                e.User.Email.ToLower().Contains(lower));
        }

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<EmployeeResponse>
        {
            Items = items.Select(Map).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<EmployeeResponse?> GetByIdAsync(Guid id)
    {
        var employee = await _employeeRepository.GetByIdAsync(id);
        return employee == null ? null : Map(employee);
    }

    public async Task<EmployeeResponse?> GetByUserIdAsync(Guid userId)
    {
        var employee = await _employeeRepository.GetByUserIdAsync(userId);
        return employee == null ? null : Map(employee);
    }

    public async Task<EmployeeResponse> CreateAsync(CreateEmployeeRequest request, Guid adminId)
    {
        if (await _userRepository.EmailExistsAsync(request.Email))
        {
            throw new InvalidOperationException("Email address is already in use.");
        }

        var employeeRole = (await _userRepository.GetAllRolesAsync())
            .FirstOrDefault(r => r.Name == UserRole.Employee.ToString() || r.Name == UserRole.VerificationAgent.ToString())
            ?? throw new InvalidOperationException("Employee role is not configured.");

        var user = new UserEntity
        {
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12),
            RoleId = employeeRole.Id,
            Status = UserStatus.Active,
            CreatedBy = adminId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _userRepository.Add(user);
        await _unitOfWork.SaveChangesAsync();

        var employee = new Data.Entities.Employee
        {
            UserId = user.Id,
            EmployeeCode = request.EmployeeCode,
            Department = request.Department,
            JoinedAt = DateTime.UtcNow,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _employeeRepository.Add(employee);
        await _unitOfWork.SaveChangesAsync();

        var created = await _employeeRepository.GetByIdAsync(employee.Id);
        return Map(created!);
    }

    public async Task<EmployeeResponse?> UpdateAsync(Guid id, UpdateEmployeeRequest request)
    {
        var employee = await _employeeRepository.GetByIdAsync(id);
        if (employee?.User == null) return null;

        employee.User.FullName = request.FullName;
        employee.User.Phone = request.Phone;
        employee.EmployeeCode = request.EmployeeCode;
        employee.Department = request.Department;
        employee.IsActive = request.IsActive;
        employee.User.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();
        return Map(employee);
    }

    public async Task<bool> SetStatusAsync(Guid id, bool isActive)
    {
        var employee = await _employeeRepository.GetByIdAsync(id);
        if (employee?.User == null) return false;
        employee.IsActive = isActive;
        employee.User.Status = isActive ? UserStatus.Active : UserStatus.Inactive;
        employee.User.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<EmployeePerformanceResponse?> GetPerformanceAsync(Guid id)
    {
        var employee = await _employeeRepository.GetByIdAsync(id);
        if (employee == null) return null;
        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        return new EmployeePerformanceResponse
        {
            EmployeeId = employee.Id,
            AssignedLeads = await _employeeRepository.CountAssignedLeadsAsync(employee.Id),
            VerificationsTotal = await _employeeRepository.CountVerificationsAsync(employee.Id),
            VerificationsThisMonth = await _employeeRepository.CountVerificationsAsync(employee.Id, monthStart)
        };
    }

    public async Task<List<EmployeeWorkHistoryItem>> GetWorkHistoryAsync(Guid employeeId)
    {
        var assignments = await _employeeRepository.GetAssignmentHistoryAsync(employeeId);
        var verifications = await _employeeRepository.GetVerificationHistoryAsync(employeeId);

        var items = assignments.Select(a => new EmployeeWorkHistoryItem
        {
            LeadId = a.LeadId,
            CustomerName = a.Lead?.CustomerName ?? "—",
            ActivityType = "Assignment",
            Detail = a.Reason,
            At = a.AssignedAt
        }).Concat(verifications.Select(v => new EmployeeWorkHistoryItem
        {
            LeadId = v.LeadId,
            CustomerName = v.Lead?.CustomerName ?? "—",
            ActivityType = "Verification",
            Detail = v.Result.ToString() + (string.IsNullOrWhiteSpace(v.CallNotes) ? "" : $" — {v.CallNotes}"),
            At = v.CreatedAt
        })).OrderByDescending(i => i.At).Take(100).ToList();

        return items;
    }

    private static EmployeeResponse Map(Data.Entities.Employee employee) =>
        new()
        {
            Id = employee.Id,
            UserId = employee.UserId,
            FullName = employee.User?.FullName ?? string.Empty,
            Email = employee.User?.Email ?? string.Empty,
            Phone = employee.User?.Phone,
            EmployeeCode = employee.EmployeeCode,
            Department = employee.Department,
            IsActive = employee.IsActive,
            JoinedAt = employee.JoinedAt,
            CreatedAt = employee.CreatedAt
        };
}
