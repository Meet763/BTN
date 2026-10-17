using BTN.Core.DTOs;
using BTN.Core.DTOs.Employee;
using BTN.Core.Enums;
using BTN.Data;
using BTN.Data.Employee;
using BTN.Data.OrgUnits;
using BTN.Data.User;
using BTN.Business.Org;
using Microsoft.EntityFrameworkCore;
using UserEntity = BTN.Data.Entities.User;

namespace BTN.Business.Employee;

public class EmployeeManager : IEmployeeManager
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUserRepository _userRepository;
    private readonly IOrgUnitRepository _orgUnitRepository;
    private readonly IOrgScopeService _orgScopeService;
    private readonly IUnitOfWork _unitOfWork;

    public EmployeeManager(
        IEmployeeRepository employeeRepository,
        IUserRepository userRepository,
        IOrgUnitRepository orgUnitRepository,
        IOrgScopeService orgScopeService,
        IUnitOfWork unitOfWork)
    {
        _employeeRepository = employeeRepository;
        _userRepository = userRepository;
        _orgUnitRepository = orgUnitRepository;
        _orgScopeService = orgScopeService;
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

        var jobTitle = ParseJobTitle(request.JobTitle);
        await ValidateOrgLinksAsync(request.OrgUnitId, request.ReportsToEmployeeId, null);

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
            OrgUnitId = request.OrgUnitId,
            ReportsToEmployeeId = request.ReportsToEmployeeId,
            JobTitle = jobTitle,
            JoinedAt = DateTime.UtcNow,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _employeeRepository.Add(employee);
        await _unitOfWork.SaveChangesAsync();

        if (request.SetAsOrgUnitHead && request.OrgUnitId.HasValue)
        {
            await SetAsHeadAsync(request.OrgUnitId.Value, employee.Id, adminId);
        }

        await _orgScopeService.AddAuditAsync(adminId, "Employee.Create", "Employee", employee.Id, null, new
        {
            employee.OrgUnitId,
            employee.ReportsToEmployeeId,
            JobTitle = employee.JobTitle.ToString(),
            request.SetAsOrgUnitHead
        });

        var created = await _employeeRepository.GetByIdAsync(employee.Id);
        return Map(created!);
    }

    public async Task<EmployeeResponse?> UpdateAsync(Guid id, UpdateEmployeeRequest request)
    {
        var employee = await _employeeRepository.GetByIdAsync(id);
        if (employee?.User == null) return null;

        var jobTitle = ParseJobTitle(request.JobTitle ?? employee.JobTitle.ToString());
        await ValidateOrgLinksAsync(request.OrgUnitId, request.ReportsToEmployeeId, id);

        var old = new
        {
            employee.OrgUnitId,
            employee.ReportsToEmployeeId,
            JobTitle = employee.JobTitle.ToString(),
            employee.IsActive
        };

        employee.User.FullName = request.FullName;
        employee.User.Phone = request.Phone;
        employee.EmployeeCode = request.EmployeeCode;
        employee.Department = request.Department;
        employee.OrgUnitId = request.OrgUnitId;
        employee.ReportsToEmployeeId = request.ReportsToEmployeeId;
        employee.JobTitle = jobTitle;
        employee.IsActive = request.IsActive;
        employee.User.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        if (request.SetAsOrgUnitHead && request.OrgUnitId.HasValue)
        {
            await SetAsHeadAsync(request.OrgUnitId.Value, employee.Id, employee.UserId);
        }

        await _orgScopeService.AddAuditAsync(employee.UserId, "Employee.UpdateMembership", "Employee", employee.Id, old, new
        {
            employee.OrgUnitId,
            employee.ReportsToEmployeeId,
            JobTitle = employee.JobTitle.ToString(),
            employee.IsActive,
            request.SetAsOrgUnitHead
        });

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

    private async Task SetAsHeadAsync(Guid orgUnitId, Guid employeeId, Guid actorUserId)
    {
        var unit = await _orgUnitRepository.GetByIdAsync(orgUnitId)
            ?? throw new InvalidOperationException("Org unit not found.");
        var previousHead = unit.HeadEmployeeId;
        unit.HeadEmployeeId = employeeId;
        unit.UpdatedAt = DateTime.UtcNow;

        var employee = await _employeeRepository.GetByIdAsync(employeeId);
        if (employee != null)
        {
            employee.OrgUnitId = orgUnitId;
            if (employee.JobTitle is not (JobTitle.Head or JobTitle.SubAdmin))
            {
                employee.JobTitle = JobTitle.Head;
            }
        }

        await _unitOfWork.SaveChangesAsync();
        await _orgScopeService.AddAuditAsync(actorUserId, "OrgUnit.ChangeHead", "OrgUnit", orgUnitId,
            new { HeadEmployeeId = previousHead },
            new { HeadEmployeeId = employeeId });
    }

    private async Task ValidateOrgLinksAsync(Guid? orgUnitId, Guid? reportsToEmployeeId, Guid? selfId)
    {
        if (orgUnitId.HasValue)
        {
            var unit = await _orgUnitRepository.GetByIdAsync(orgUnitId.Value);
            if (unit == null) throw new InvalidOperationException("Org unit not found.");
        }

        if (reportsToEmployeeId.HasValue)
        {
            if (selfId.HasValue && reportsToEmployeeId == selfId)
            {
                throw new InvalidOperationException("Employee cannot report to themselves.");
            }

            var boss = await _employeeRepository.GetByIdAsync(reportsToEmployeeId.Value);
            if (boss == null) throw new InvalidOperationException("Reports-to employee not found.");

            if (orgUnitId.HasValue && boss.OrgUnitId.HasValue && boss.OrgUnitId != orgUnitId)
            {
                throw new InvalidOperationException("Reports-to employee must be in the same org unit.");
            }
        }
    }

    private static JobTitle ParseJobTitle(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return JobTitle.Employee;
        if (Enum.TryParse<JobTitle>(value, true, out var parsed)) return parsed;
        throw new InvalidOperationException($"Invalid job title '{value}'.");
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
            OrgUnitId = employee.OrgUnitId,
            OrgUnitName = employee.OrgUnit?.Name,
            OrgUnitCode = employee.OrgUnit?.Code,
            ReportsToEmployeeId = employee.ReportsToEmployeeId,
            ReportsToName = employee.ReportsToEmployee?.User?.FullName,
            JobTitle = employee.JobTitle.ToString(),
            IsActive = employee.IsActive,
            JoinedAt = employee.JoinedAt,
            CreatedAt = employee.CreatedAt
        };
}
