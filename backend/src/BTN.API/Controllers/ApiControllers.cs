using System.Security.Claims;
using BTN.Business.Authentication;
using BTN.Business.Billing;
using BTN.Business.Customer;
using BTN.Business.Dashboard;
using BTN.Business.Employee;
using BTN.Business.Lead;
using BTN.Business.LeadAssignment;
using BTN.Business.LeadVerification;
using BTN.Business.Purchase;
using BTN.Business.User;
using BTN.Business.Wallet;
using BTN.Core.DTOs.Auth;
using BTN.Core.DTOs.Billing;
using BTN.Core.DTOs.Customer;
using BTN.Core.DTOs.Employee;
using BTN.Core.DTOs.LeadAssignment;
using BTN.Core.DTOs.Leads;
using BTN.Core.DTOs.Purchase;
using BTN.Core.DTOs.Wallet;
using BTN.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BTN.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthenticationManager _authenticationManager;

    public AuthController(IAuthenticationManager authenticationManager)
    {
        _authenticationManager = authenticationManager;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var response = await _authenticationManager.LoginAsync(request, ipAddress);
        if (response == null)
        {
            return Unauthorized(new { success = false, error = "Invalid email or password" });
        }

        return Ok(new { success = true, data = response });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        var response = await _authenticationManager.RefreshAsync(request.RefreshToken);
        if (response == null)
        {
            return Unauthorized(new { success = false, error = "Invalid or expired refresh token" });
        }

        return Ok(new { success = true, data = response });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
    {
        var userId = GetUserId();
        var result = await _authenticationManager.LogoutAsync(request.RefreshToken, userId);
        if (!result)
        {
            return BadRequest(new { success = false, error = "Failed to log out, token invalid" });
        }

        return Ok(new { success = true, message = "Logged out successfully" });
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException();
        }

        return userId;
    }
}

[Authorize(Roles = "PlatformOwner")]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserManager _userManager;

    public UsersController(IUserManager userManager)
    {
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? role = null, [FromQuery] string? status = null)
    {
        var result = await _userManager.GetUsersAsync(page, pageSize, search, role, status);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _userManager.GetRolesAsync();
        return Ok(new { success = true, data = roles });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUserById(Guid id)
    {
        var user = await _userManager.GetUserByIdAsync(id);
        return user == null ? NotFound(new { success = false, error = "User not found" }) : Ok(new { success = true, data = user });
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] BTN.Core.DTOs.Users.CreateUserRequest request)
    {
        var response = await _userManager.CreateUserAsync(request, GetUserId());
        return CreatedAtAction(nameof(GetUserById), new { id = response.Id }, new { success = true, data = response, message = "User created successfully" });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] BTN.Core.DTOs.Users.UpdateUserRequest request)
    {
        var response = await _userManager.UpdateUserAsync(id, request, GetUserId());
        return response == null ? NotFound() : Ok(new { success = true, data = response });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeactivateUser(Guid id)
    {
        var result = await _userManager.DeactivateUserAsync(id, GetUserId());
        return result ? Ok(new { success = true, message = "User deactivated successfully" }) : NotFound();
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LeadsController : ControllerBase
{
    private readonly ILeadManager _leadManager;
    private readonly ILeadVerificationManager _leadVerificationManager;
    private readonly ILeadAssignmentManager _leadAssignmentManager;
    private readonly IEmployeeManager _employeeManager;

    public LeadsController(
        ILeadManager leadManager,
        ILeadVerificationManager leadVerificationManager,
        ILeadAssignmentManager leadAssignmentManager,
        IEmployeeManager employeeManager)
    {
        _leadManager = leadManager;
        _leadVerificationManager = leadVerificationManager;
        _leadAssignmentManager = leadAssignmentManager;
        _employeeManager = employeeManager;
    }

    [Authorize(Roles = "PlatformOwner")]
    [HttpPost]
    public async Task<IActionResult> CreateLead([FromBody] CreateLeadRequest request)
    {
        var response = await _leadManager.CreateLeadAsync(request);
        return CreatedAtAction(nameof(GetLeadById), new { id = response.Id }, new { success = true, data = response });
    }

    [Authorize(Roles = "PlatformOwner,VerificationAgent,Employee")]
    [HttpGet]
    public async Task<IActionResult> GetLeads(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? status = null,
        [FromQuery] string? source = null, [FromQuery] string? search = null,
        [FromQuery] DateTime? dateFrom = null, [FromQuery] DateTime? dateTo = null, [FromQuery] bool? isDuplicate = null,
        [FromQuery] bool mineOnly = false)
    {
        Guid? employeeId = null;
        if (mineOnly)
        {
            var employee = await _employeeManager.GetByUserIdAsync(GetUserId());
            employeeId = employee?.Id;
        }

        var result = await _leadManager.GetLeadsAsync(page, pageSize, status, source, search, dateFrom, dateTo, isDuplicate, employeeId);
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "PlatformOwner,VerificationAgent,Employee")]
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        return Ok(new { success = true, data = await _leadManager.GetStatsAsync() });
    }

    [Authorize(Roles = "Customer")]
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailableLeads([FromServices] ICustomerManager customerManager, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? city = null)
    {
        var customer = await customerManager.GetByUserIdAsync(GetUserId());
        if (customer == null) return Forbid();
        var result = await customerManager.GetAvailableLeadsAsync(page, pageSize, search, city);
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "PlatformOwner,VerificationAgent,Employee,Customer")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetLeadById(Guid id, [FromServices] ICustomerManager customerManager, [FromServices] IPurchaseManager purchaseManager)
    {
        var mask = false;
        if (User.IsInRole("Customer"))
        {
            var customer = await customerManager.GetByUserIdAsync(GetUserId());
            if (customer == null) return Forbid();
            var purchases = await purchaseManager.GetPurchasesAsync(customer.Id, 1, 1000);
            mask = purchases.Items.All(p => p.LeadId != id);
        }

        var lead = await _leadManager.GetLeadByIdAsync(id, mask);
        return lead == null ? NotFound() : Ok(new { success = true, data = lead });
    }

    [Authorize(Roles = "PlatformOwner,VerificationAgent,Employee")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateLead(Guid id, [FromBody] UpdateLeadRequest request)
    {
        var lead = await _leadManager.UpdateLeadAsync(id, request, GetUserId());
        return lead == null ? NotFound() : Ok(new { success = true, data = lead });
    }

    [Authorize(Roles = "PlatformOwner,VerificationAgent,Employee")]
    [HttpPost("{id}/verify")]
    public async Task<IActionResult> VerifyLeadLegacy(Guid id, [FromBody] VerifyLeadRequest request)
    {
        var mapped = new CreateVerificationRequest
        {
            VerificationMethodCode = "PhoneCall",
            IsPhoneValid = request.IsPhoneValid,
            IsRequirementReal = request.IsRequirementReal,
            IntentLevel = request.IntentLevel,
            IsLocationServiceable = request.IsLocationServiceable,
            CallAttempted = request.CallAttempted,
            CallConnected = request.CallConnected,
            CallDurationSeconds = request.CallDurationSeconds,
            CallNotes = request.CallNotes,
            Result = request.Result,
            RejectionReason = request.RejectionReason
        };
        return await VerifyLead(id, mapped);
    }

    [Authorize(Roles = "PlatformOwner,VerificationAgent,Employee")]
    [HttpPost("{id}/verifications")]
    public async Task<IActionResult> VerifyLead(Guid id, [FromBody] CreateVerificationRequest request)
    {
        try
        {
            var response = await _leadVerificationManager.VerifyLeadAsync(id, request, GetUserId());
            return response == null ? NotFound() : Ok(new { success = true, data = response });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    [HttpGet("{id}/verifications")]
    public async Task<IActionResult> GetVerifications(Guid id)
    {
        var history = await _leadVerificationManager.GetHistoryAsync(id);
        return Ok(new { success = true, data = history });
    }

    [HttpGet("verification-methods")]
    public async Task<IActionResult> GetVerificationMethods()
    {
        return Ok(new { success = true, data = await _leadVerificationManager.GetMethodsAsync() });
    }

    [Authorize(Roles = "PlatformOwner")]
    [HttpPost("{id}/assign")]
    public async Task<IActionResult> Assign(Guid id, [FromBody] AssignLeadRequest request)
    {
        var result = await _leadAssignmentManager.AssignAsync(id, request, GetUserId());
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "PlatformOwner")]
    [HttpPost("{id}/reassign")]
    public async Task<IActionResult> Reassign(Guid id, [FromBody] AssignLeadRequest request)
    {
        var result = await _leadAssignmentManager.ReassignAsync(id, request, GetUserId());
        return Ok(new { success = true, data = result });
    }

    [HttpGet("{id}/assignment-history")]
    public async Task<IActionResult> AssignmentHistory(Guid id)
    {
        return Ok(new { success = true, data = await _leadAssignmentManager.GetHistoryAsync(id) });
    }

    [HttpGet("{id}/status-history")]
    public async Task<IActionResult> StatusHistory(Guid id)
    {
        return Ok(new { success = true, data = await _leadAssignmentManager.GetStatusHistoryAsync(id) });
    }

    [Authorize(Roles = "PlatformOwner")]
    [HttpPatch("{id}/price")]
    public async Task<IActionResult> SetPrice(Guid id, [FromBody] decimal price)
    {
        var lead = await _leadManager.SetListPriceAsync(id, price, GetUserId());
        return lead == null ? NotFound() : Ok(new { success = true, data = lead });
    }

    [Authorize(Roles = "PlatformOwner")]
    [HttpPatch("{id}/sale-status")]
    public async Task<IActionResult> SetSaleStatus(Guid id, [FromBody] SaleStatus saleStatus)
    {
        var lead = await _leadManager.SetSaleStatusAsync(id, saleStatus, GetUserId());
        return lead == null ? NotFound() : Ok(new { success = true, data = lead });
    }

    [Authorize(Roles = "PlatformOwner")]
    [HttpPost("bulk")]
    public async Task<IActionResult> BulkImport([FromBody] BulkImportLeadsRequest request)
    {
        var response = await _leadManager.BulkImportLeadsAsync(request);
        return Ok(new { success = true, data = response });
    }

    [Authorize(Roles = "PlatformOwner")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLead(Guid id)
    {
        try
        {
            var ok = await _leadManager.DeleteLeadAsync(id);
            return ok ? Ok(new { success = true, message = "Lead deleted." }) : NotFound(new { success = false, error = "Lead not found." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    [HttpGet("{id}/verification")]
    public async Task<IActionResult> GetLeadVerification(Guid id)
    {
        var verification = await _leadVerificationManager.GetLatestVerificationAsync(id);
        return verification == null ? NotFound() : Ok(new { success = true, data = verification });
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}

[Authorize(Roles = "PlatformOwner")]
[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeManager _employeeManager;

    public EmployeesController(IEmployeeManager employeeManager) => _employeeManager = employeeManager;

    [HttpGet]
    public async Task<IActionResult> GetEmployees([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null)
        => Ok(new { success = true, data = await _employeeManager.GetEmployeesAsync(page, pageSize, search) });

    [HttpGet("{id}")]
    public async Task<IActionResult> GetEmployee(Guid id)
    {
        var employee = await _employeeManager.GetByIdAsync(id);
        return employee == null ? NotFound() : Ok(new { success = true, data = employee });
    }

    [HttpPost]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeRequest request)
    {
        try
        {
            return Ok(new { success = true, data = await _employeeManager.CreateAsync(request, GetUserId()) });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeRequest request)
    {
        var employee = await _employeeManager.UpdateAsync(id, request);
        return employee == null ? NotFound() : Ok(new { success = true, data = employee });
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] bool isActive)
        => Ok(new { success = await _employeeManager.SetStatusAsync(id, isActive) });

    [HttpGet("{id}/performance")]
    public async Task<IActionResult> Performance(Guid id)
    {
        var perf = await _employeeManager.GetPerformanceAsync(id);
        return perf == null ? NotFound() : Ok(new { success = true, data = perf });
    }

    [HttpGet("{id}/work-history")]
    public async Task<IActionResult> WorkHistory(Guid id)
    {
        var employee = await _employeeManager.GetByIdAsync(id);
        if (employee == null) return NotFound();
        return Ok(new { success = true, data = await _employeeManager.GetWorkHistoryAsync(id) });
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}

[Authorize(Roles = "PlatformOwner,Employee,VerificationAgent")]
[ApiController]
[Route("api/employees/me")]
public class EmployeeMeController : ControllerBase
{
    private readonly IEmployeeManager _employeeManager;
    private readonly ILeadManager _leadManager;

    public EmployeeMeController(IEmployeeManager employeeManager, ILeadManager leadManager)
    {
        _employeeManager = employeeManager;
        _leadManager = leadManager;
    }

    [HttpGet("leads")]
    public async Task<IActionResult> MyLeads([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var employee = await _employeeManager.GetByUserIdAsync(GetUserId());
        if (employee == null) return Ok(new { success = true, data = new { items = Array.Empty<object>(), totalCount = 0 } });
        var result = await _leadManager.GetLeadsAsync(page, pageSize, null, null, null, null, null, null, employee.Id);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("work-history")]
    public async Task<IActionResult> MyWorkHistory()
    {
        var employee = await _employeeManager.GetByUserIdAsync(GetUserId());
        if (employee == null) return Ok(new { success = true, data = Array.Empty<object>() });
        return Ok(new { success = true, data = await _employeeManager.GetWorkHistoryAsync(employee.Id) });
    }

    [HttpGet("performance")]
    public async Task<IActionResult> MyPerformance()
    {
        var employee = await _employeeManager.GetByUserIdAsync(GetUserId());
        if (employee == null) return NotFound();
        return Ok(new { success = true, data = await _employeeManager.GetPerformanceAsync(employee.Id) });
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}

[Authorize(Roles = "PlatformOwner,Employee,VerificationAgent")]
[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerManager _customerManager;

    public CustomersController(ICustomerManager customerManager) => _customerManager = customerManager;

    [HttpGet]
    public async Task<IActionResult> GetCustomers([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        => Ok(new { success = true, data = await _customerManager.GetCustomersAsync(page, pageSize) });

    [HttpPost]
    public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerRequest request)
    {
        try
        {
            return Ok(new { success = true, data = await _customerManager.CreateAsync(request, GetUserId()) });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
        catch (DbUpdateException ex)
        {
            return BadRequest(new { success = false, error = ex.InnerException?.Message ?? ex.Message });
        }
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}

[Authorize(Roles = "Customer")]
[ApiController]
[Route("api/[controller]")]
public class WalletController : ControllerBase
{
    private readonly IWalletManager _walletManager;
    private readonly ICustomerManager _customerManager;

    public WalletController(IWalletManager walletManager, ICustomerManager customerManager)
    {
        _walletManager = walletManager;
        _customerManager = customerManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetWallet()
    {
        var customer = await GetCustomer();
        var wallet = await _walletManager.GetWalletAsync(customer.Id);
        return Ok(new { success = true, data = wallet });
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var customer = await GetCustomer();
        return Ok(new { success = true, data = await _walletManager.GetTransactionsAsync(customer.Id, page, pageSize) });
    }

    [HttpPost("top-up")]
    public async Task<IActionResult> TopUp([FromBody] TopUpRequest request)
    {
        var customer = await GetCustomer();
        return Ok(new { success = true, data = await _walletManager.CreateTopUpAsync(customer.Id, request) });
    }

    [HttpPost("confirm-top-up")]
    public async Task<IActionResult> ConfirmTopUp([FromBody] ConfirmTopUpRequest request)
    {
        var customer = await GetCustomer();
        var ok = await _walletManager.ConfirmTopUpAsync(customer.Id, request);
        return ok ? Ok(new { success = true }) : BadRequest(new { success = false });
    }

    private async Task<CustomerResponse> GetCustomer()
    {
        var customer = await _customerManager.GetByUserIdAsync(GetUserId());
        return customer ?? throw new UnauthorizedAccessException();
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}

[Authorize(Roles = "Customer")]
[ApiController]
[Route("api/[controller]")]
public class PurchasesController : ControllerBase
{
    private readonly IPurchaseManager _purchaseManager;
    private readonly ICustomerManager _customerManager;

    public PurchasesController(IPurchaseManager purchaseManager, ICustomerManager customerManager)
    {
        _purchaseManager = purchaseManager;
        _customerManager = customerManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetPurchases([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var customer = await _customerManager.GetByUserIdAsync(GetUserId());
        if (customer == null) return Forbid();
        return Ok(new { success = true, data = await _purchaseManager.GetPurchasesAsync(customer.Id, page, pageSize) });
    }

    [HttpPost]
    public async Task<IActionResult> Purchase([FromBody] PurchaseLeadRequest request)
    {
        var customer = await _customerManager.GetByUserIdAsync(GetUserId());
        if (customer == null) return Forbid();
        try
        {
            return Ok(new { success = true, data = await _purchaseManager.PurchaseLeadAsync(customer.Id, request) });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPurchase(Guid id)
    {
        var customer = await _customerManager.GetByUserIdAsync(GetUserId());
        if (customer == null) return Forbid();
        var purchase = await _purchaseManager.GetPurchaseAsync(customer.Id, id);
        return purchase == null ? NotFound() : Ok(new { success = true, data = purchase });
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}

[Authorize(Roles = "PlatformOwner")]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardManager _dashboardManager;

    public DashboardController(IDashboardManager dashboardManager) => _dashboardManager = dashboardManager;

    [HttpGet("admin")]
    public async Task<IActionResult> Admin() => Ok(new { success = true, data = await _dashboardManager.GetAdminDashboardAsync() });
}

[Authorize(Roles = "Customer")]
[ApiController]
[Route("api/billing")]
public class BillingController : ControllerBase
{
    private readonly IBillingManager _billingManager;
    private readonly ICustomerManager _customerManager;

    public BillingController(IBillingManager billingManager, ICustomerManager customerManager)
    {
        _billingManager = billingManager;
        _customerManager = customerManager;
    }

    [HttpGet("organization")]
    public async Task<IActionResult> GetOrganization()
    {
        var customer = await GetCustomer();
        return Ok(new { success = true, data = await _billingManager.GetOrganizationAsync(customer.Id) });
    }

    [HttpPut("organization")]
    public async Task<IActionResult> UpsertOrganization([FromBody] UpsertBillingOrganizationRequest request)
    {
        var customer = await GetCustomer();
        return Ok(new { success = true, data = await _billingManager.UpsertOrganizationAsync(customer.Id, request) });
    }

    [HttpGet("customers")]
    public async Task<IActionResult> GetBillingCustomers()
    {
        var customer = await GetCustomer();
        return Ok(new { success = true, data = await _billingManager.GetBillingCustomersAsync(customer.Id) });
    }

    [HttpPost("customers")]
    public async Task<IActionResult> CreateBillingCustomer([FromBody] CreateBillingCustomerRequest request)
    {
        var customer = await GetCustomer();
        return Ok(new { success = true, data = await _billingManager.CreateBillingCustomerAsync(customer.Id, request) });
    }

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts()
    {
        var customer = await GetCustomer();
        return Ok(new { success = true, data = await _billingManager.GetProductsAsync(customer.Id) });
    }

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateBillingProductRequest request)
    {
        var customer = await GetCustomer();
        return Ok(new { success = true, data = await _billingManager.CreateProductAsync(customer.Id, request) });
    }

    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices()
    {
        var customer = await GetCustomer();
        return Ok(new { success = true, data = await _billingManager.GetInvoicesAsync(customer.Id) });
    }

    [HttpPost("invoices")]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceRequest request)
    {
        var customer = await GetCustomer();
        return Ok(new { success = true, data = await _billingManager.CreateInvoiceAsync(customer.Id, request) });
    }

    [HttpGet("invoices/{id}")]
    public async Task<IActionResult> GetInvoice(Guid id)
    {
        var customer = await GetCustomer();
        var invoice = await _billingManager.GetInvoiceAsync(customer.Id, id);
        return invoice == null ? NotFound() : Ok(new { success = true, data = invoice });
    }

    [HttpPost("invoices/{id}/payments")]
    public async Task<IActionResult> RecordPayment(Guid id, [FromBody] RecordInvoicePaymentRequest request)
    {
        try
        {
            var customer = await GetCustomer();
            var invoice = await _billingManager.RecordPaymentAsync(customer.Id, id, request);
            return invoice == null ? NotFound() : Ok(new { success = true, data = invoice });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    [HttpGet("quotations")]
    public async Task<IActionResult> GetQuotations()
    {
        var customer = await GetCustomer();
        return Ok(new { success = true, data = await _billingManager.GetQuotationsAsync(customer.Id) });
    }

    [HttpPost("quotations")]
    public async Task<IActionResult> CreateQuotation([FromBody] CreateQuotationRequest request)
    {
        var customer = await GetCustomer();
        return Ok(new { success = true, data = await _billingManager.CreateQuotationAsync(customer.Id, request) });
    }

    [HttpGet("quotations/{id}")]
    public async Task<IActionResult> GetQuotation(Guid id)
    {
        var customer = await GetCustomer();
        var quotation = await _billingManager.GetQuotationAsync(customer.Id, id);
        return quotation == null ? NotFound() : Ok(new { success = true, data = quotation });
    }

    [HttpPost("quotations/{id}/convert")]
    public async Task<IActionResult> ConvertQuotation(Guid id)
    {
        var customer = await GetCustomer();
        var invoice = await _billingManager.ConvertQuotationToInvoiceAsync(customer.Id, id);
        return invoice == null ? NotFound() : Ok(new { success = true, data = invoice });
    }

    private async Task<CustomerResponse> GetCustomer()
    {
        var customer = await _customerManager.GetByUserIdAsync(GetUserId());
        return customer ?? throw new UnauthorizedAccessException();
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}

[ApiController]
[Route("api/webhooks")]
public class WebhooksController : ControllerBase
{
    private readonly IWalletManager _walletManager;

    public WebhooksController(IWalletManager walletManager) => _walletManager = walletManager;

    [HttpPost("razorpay")]
    public async Task<IActionResult> Razorpay([FromBody] Dictionary<string, string> payload)
    {
        if (!payload.TryGetValue("order_id", out var orderId))
        {
            return BadRequest();
        }

        await _walletManager.ProcessWebhookAsync(orderId, orderId);
        return Ok();
    }
}
