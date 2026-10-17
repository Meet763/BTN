using System;
using System.Collections.Generic;
using BTN.Core.Enums;

namespace BTN.Data.Entities
{
    public class Role
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<User> Users { get; set; } = new List<User>();
    }

    public class User
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public Guid RoleId { get; set; }
        public Role? Role { get; set; }
        public UserStatus Status { get; set; } = UserStatus.Active;
        public DateTime? LastLoginAt { get; set; }
        public Guid? CreatedBy { get; set; }
        public User? CreatedByUser { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Employee? Employee { get; set; }
        public Customer? Customer { get; set; }
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public ICollection<Lead> VerifiedLeads { get; set; } = new List<Lead>();
        public ICollection<LeadVerification> LeadVerifications { get; set; } = new List<LeadVerification>();
        public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    }

    public class OrgUnit
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public Guid? ParentOrgUnitId { get; set; }
        public OrgUnit? ParentOrgUnit { get; set; }
        public Guid? HeadEmployeeId { get; set; }
        public Employee? HeadEmployee { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<OrgUnit> Children { get; set; } = new List<OrgUnit>();
        public ICollection<Employee> Members { get; set; } = new List<Employee>();
        public ICollection<Lead> Leads { get; set; } = new List<Lead>();
    }

    public class Employee
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public string? EmployeeCode { get; set; }
        public string? Department { get; set; }
        public Guid? OrgUnitId { get; set; }
        public OrgUnit? OrgUnit { get; set; }
        public Guid? ReportsToEmployeeId { get; set; }
        public Employee? ReportsToEmployee { get; set; }
        public JobTitle JobTitle { get; set; } = JobTitle.Employee;
        public DateTime? JoinedAt { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<LeadAssignment> LeadAssignments { get; set; } = new List<LeadAssignment>();
        public ICollection<Lead> AssignedLeads { get; set; } = new List<Lead>();
        public ICollection<Employee> DirectReports { get; set; } = new List<Employee>();
        public ICollection<OrgUnit> HeadedOrgUnits { get; set; } = new List<OrgUnit>();
    }

    public class Customer
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public string? CompanyName { get; set; }
        public string? Gstin { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Wallet? Wallet { get; set; }
        public ICollection<Purchase> Purchases { get; set; } = new List<Purchase>();
        public ICollection<BillingOrganization> BillingOrganizations { get; set; } = new List<BillingOrganization>();
    }

    public class Lead
    {
        public Guid Id { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }
        public LeadSource Source { get; set; }
        public string? ProductInterest { get; set; }
        public string? RawData { get; set; }
        public LeadStatus VerificationStatus { get; set; } = LeadStatus.Pending;
        public LeadWorkflowStatus WorkflowStatus { get; set; } = LeadWorkflowStatus.Created;
        public SaleStatus SaleStatus { get; set; } = SaleStatus.NotForSale;
        public Guid? VerifiedBy { get; set; }
        public User? VerifiedByUser { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public bool IsDuplicate { get; set; }
        public Guid? DuplicateOfLeadId { get; set; }
        public Lead? DuplicateOfLead { get; set; }
        public Guid? AssignedEmployeeId { get; set; }
        public Employee? AssignedEmployee { get; set; }
        public Guid? OrgUnitId { get; set; }
        public OrgUnit? OrgUnit { get; set; }
        public Guid? AssignedHeadEmployeeId { get; set; }
        public Employee? AssignedHeadEmployee { get; set; }
        public string? InquiryType { get; set; }
        public string? InquiryDetails { get; set; }
        public string? CustomerRequirements { get; set; }
        public decimal? BudgetAmount { get; set; }
        public string? BudgetCurrency { get; set; } = "INR";
        public string? Timeline { get; set; }
        public string? ContactOutcome { get; set; }
        public DateTime? FollowUpAt { get; set; }
        public string? Remarks { get; set; }
        public string? InternalNotes { get; set; }
        public decimal? ListPrice { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<LeadVerification> Verifications { get; set; } = new List<LeadVerification>();
        public ICollection<LeadAssignment> Assignments { get; set; } = new List<LeadAssignment>();
        public ICollection<LeadStatusHistory> StatusHistory { get; set; } = new List<LeadStatusHistory>();
        public Purchase? Purchase { get; set; }
    }

    public class VerificationMethod
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }
    }

    public class LeadVerification
    {
        public Guid Id { get; set; }
        public Guid LeadId { get; set; }
        public Lead? Lead { get; set; }
        public Guid EmployeeId { get; set; }
        public Employee? Employee { get; set; }
        public Guid VerifiedBy { get; set; }
        public User? VerifiedByUser { get; set; }
        public Guid VerificationMethodId { get; set; }
        public VerificationMethod? VerificationMethod { get; set; }
        public bool IsPhoneValid { get; set; }
        public bool IsRequirementReal { get; set; }
        public string IntentLevel { get; set; } = string.Empty;
        public bool IsLocationServiceable { get; set; }
        public bool CallAttempted { get; set; }
        public bool CallConnected { get; set; }
        public int? CallDurationSeconds { get; set; }
        public string? CallNotes { get; set; }
        public string? InquiryType { get; set; }
        public string? ProductOrService { get; set; }
        public string? InquiryDetails { get; set; }
        public string? CustomerRequirements { get; set; }
        public decimal? BudgetAmount { get; set; }
        public string? Timeline { get; set; }
        public string? ContactOutcome { get; set; }
        public DateTime? FollowUpAt { get; set; }
        public string? Remarks { get; set; }
        public string? AdditionalNotes { get; set; }
        public string? FormSnapshotJson { get; set; }
        public VerificationResult Result { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class LeadAssignment
    {
        public Guid Id { get; set; }
        public Guid LeadId { get; set; }
        public Lead? Lead { get; set; }
        public Guid EmployeeId { get; set; }
        public Employee? Employee { get; set; }
        public Guid AssignedByUserId { get; set; }
        public User? AssignedByUser { get; set; }
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UnassignedAt { get; set; }
        public string? Reason { get; set; }
    }

    public class LeadStatusHistory
    {
        public Guid Id { get; set; }
        public Guid LeadId { get; set; }
        public Lead? Lead { get; set; }
        public string FromStatus { get; set; } = string.Empty;
        public string ToStatus { get; set; } = string.Empty;
        public Guid ChangedBy { get; set; }
        public User? ChangedByUser { get; set; }
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
        public string? Note { get; set; }
    }

    public class Wallet
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public long BalanceMinor { get; set; }
        public string Currency { get; set; } = "INR";
        public byte[] RowVersion { get; set; } = Array.Empty<byte>();
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
    }

    public class WalletTransaction
    {
        public Guid Id { get; set; }
        public Guid WalletId { get; set; }
        public Wallet? Wallet { get; set; }
        public WalletTransactionType Type { get; set; }
        public long AmountMinor { get; set; }
        public long BalanceAfter { get; set; }
        public string? ReferenceType { get; set; }
        public Guid? ReferenceId { get; set; }
        public string? Description { get; set; }
        public string? IdempotencyKey { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class PaymentOrder
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public long AmountMinor { get; set; }
        public string Currency { get; set; } = "INR";
        public PaymentOrderStatus Status { get; set; } = PaymentOrderStatus.Created;
        public string Provider { get; set; } = "Razorpay";
        public string? ProviderOrderId { get; set; }
        public string? ProviderPayloadJson { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PaidAt { get; set; }
    }

    public class Purchase
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public Guid LeadId { get; set; }
        public Lead? Lead { get; set; }
        public long PriceMinor { get; set; }
        public Guid? WalletTransactionId { get; set; }
        public WalletTransaction? WalletTransaction { get; set; }
        public DateTime PurchasedAt { get; set; } = DateTime.UtcNow;
    }

    public class BillingOrganization
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public string LegalName { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? LogoUrl { get; set; }
        public string InvoicePrefix { get; set; } = "INV";
        public int NextInvoiceNumber { get; set; } = 1;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class BillingCustomer
    {
        public Guid Id { get; set; }
        public Guid BillingOrganizationId { get; set; }
        public BillingOrganization? BillingOrganization { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class BillingProduct
    {
        public Guid Id { get; set; }
        public Guid BillingOrganizationId { get; set; }
        public BillingOrganization? BillingOrganization { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal UnitPrice { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class BillingQuotation
    {
        public Guid Id { get; set; }
        public Guid BillingOrganizationId { get; set; }
        public BillingOrganization? BillingOrganization { get; set; }
        public Guid BillingCustomerId { get; set; }
        public BillingCustomer? BillingCustomer { get; set; }
        public string QuotationNumber { get; set; } = string.Empty;
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ValidUntil { get; set; }
        public decimal TotalAmount { get; set; }
        public ICollection<BillingQuotationLine> Lines { get; set; } = new List<BillingQuotationLine>();
    }

    public class BillingQuotationLine
    {
        public Guid Id { get; set; }
        public Guid BillingQuotationId { get; set; }
        public BillingQuotation? BillingQuotation { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class BillingInvoice
    {
        public Guid Id { get; set; }
        public Guid BillingOrganizationId { get; set; }
        public BillingOrganization? BillingOrganization { get; set; }
        public Guid BillingCustomerId { get; set; }
        public BillingCustomer? BillingCustomer { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DueAt { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal AmountPaid { get; set; }
        public ICollection<BillingInvoiceLine> Lines { get; set; } = new List<BillingInvoiceLine>();
        public ICollection<BillingPayment> Payments { get; set; } = new List<BillingPayment>();
    }

    public class BillingInvoiceLine
    {
        public Guid Id { get; set; }
        public Guid BillingInvoiceId { get; set; }
        public BillingInvoice? BillingInvoice { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class BillingPayment
    {
        public Guid Id { get; set; }
        public Guid BillingInvoiceId { get; set; }
        public BillingInvoice? BillingInvoice { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaidAt { get; set; } = DateTime.UtcNow;
        public string? Method { get; set; }
        public string? Reference { get; set; }
    }

    public class RefreshToken
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public bool IsRevoked { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive => !IsRevoked && ExpiresAt > DateTime.UtcNow;
    }

    public class AuditLog
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public User? User { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? EntityType { get; set; }
        public Guid? EntityId { get; set; }
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public string? IpAddress { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CampaignSubmission
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Pincode { get; set; } = string.Empty;
        public string? ProductInterest { get; set; }
        public string? JobInterest { get; set; }
        public string? JobRole { get; set; }
        public string Platform { get; set; } = "other";
        public string Campaign { get; set; } = "BTN Gift Campaign";
        public GiftStatus GiftStatus { get; set; } = GiftStatus.Processing;
        public DateTime? StatusUpdatedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CampaignFormAppearance
    {
        public Guid Id { get; set; }
        public string ThemeKey { get; set; } = "forest-gold";
        public string BackgroundColor { get; set; } = "#0f1c17";
        public string AccentColor { get; set; } = "#e8c572";
        public string CtaColor { get; set; } = "#d4a853";
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ManagedForm
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string IntroTitle { get; set; } = "Tell us a little about you";
        public string IntroBody { get; set; } = "One question at a time. You can go back and change an answer.";
        public string SubmitLabel { get; set; } = "Submit";
        public bool IsPublished { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<ManagedFormField> Fields { get; set; } = new List<ManagedFormField>();
        public ICollection<ManagedFormSubmission> Submissions { get; set; } = new List<ManagedFormSubmission>();
    }

    public class ManagedFormField
    {
        public Guid Id { get; set; }
        public Guid FormId { get; set; }
        public ManagedForm? Form { get; set; }
        public string FieldKey { get; set; } = string.Empty;
        public string FieldType { get; set; } = "shortText";
        public string Label { get; set; } = string.Empty;
        public string? Hint { get; set; }
        public string? Placeholder { get; set; }
        public bool IsRequired { get; set; }
        public int SortOrder { get; set; }
        public string? OptionsJson { get; set; }
        public string? ValidationJson { get; set; }
        public string? SettingsJson { get; set; }
    }

    public class ManagedFormSubmission
    {
        public Guid Id { get; set; }
        public Guid FormId { get; set; }
        public ManagedForm? Form { get; set; }
        public string AnswersJson { get; set; } = "{}";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
