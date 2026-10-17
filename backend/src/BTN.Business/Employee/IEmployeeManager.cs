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

