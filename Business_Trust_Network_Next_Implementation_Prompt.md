# Business Trust Network - Next Implementation Plan

Analyze my existing `implementation_plan.md` file. The Lead Verification
module has already been planned and partially implemented. I now want to
design and plan the next phase of the project.

Do **not** redesign the existing implementation unnecessarily. Instead,
review it, identify gaps, and extend it using enterprise-level
architecture and best practices.

------------------------------------------------------------------------

# Current Architecture

The backend follows a layered architecture with the following projects:

``` text
BTN.API      → ASP.NET Core Web API (Controllers only)
BTN.Business → Business Logic
BTN.Data     → EF Core, DbContext, Repositories, Database Models
BTN.Core     → DTOs, Enums, Constants, Attributes, Shared Models, Common Interfaces, Utilities
```

Application flow:

``` text
BTN.API
    ↓
BTN.Business
    ↓
BTN.Data
```

`BTN.Core` contains only shared components that can be used by all
projects.

------------------------------------------------------------------------

# Business Layer Structure

I want the `BTN.Business` project to be organized by feature.

Each feature folder should contain only:

-   Interface (`I...Manager`)
-   Manager (`...Manager`)

Example:

``` text
BTN.Business
│
├── DependencyInjection.cs
│
├── Authentication
│   ├── IAuthenticationManager.cs
│   └── AuthenticationManager.cs
│
├── Lead
│   ├── ILeadManager.cs
│   └── LeadManager.cs
│
├── LeadVerification
│   ├── ILeadVerificationManager.cs
│   └── LeadVerificationManager.cs
│
├── Employee
│   ├── IEmployeeManager.cs
│   └── EmployeeManager.cs
│
├── Customer
│   ├── ICustomerManager.cs
│   └── CustomerManager.cs
│
└── Dashboard
    ├── IDashboardManager.cs
    └── DashboardManager.cs
```

The Business project should contain only business logic.

It should not contain:

-   DTOs
-   Entity Models
-   EF Core Models
-   Request/Response Models
-   Validation
-   Repository Implementations
-   Database Logic

------------------------------------------------------------------------

# Business Dependency Injection

Use a single `DependencyInjection.cs` file inside `BTN.Business`.

Use automatic Assembly Scanning (Scrutor) so every `I...Manager` and
`...Manager` pair is automatically registered.

`Program.cs` should contain only:

``` csharp
builder.Services.AddBusinessServices();
builder.Services.AddDataServices();
```

I should never need to manually register a new Manager.

------------------------------------------------------------------------

# Data Layer Structure

I want `BTN.Data` to follow the same feature-based organization.

Each feature folder should contain only:

-   Repository Interface (`I...Repository`)
-   Repository (`...Repository`)

Example:

``` text
BTN.Data
│
├── DependencyInjection.cs
│
├── Authentication
│   ├── IAuthenticationRepository.cs
│   └── AuthenticationRepository.cs
│
├── Lead
│   ├── ILeadRepository.cs
│   └── LeadRepository.cs
│
├── LeadVerification
│   ├── ILeadVerificationRepository.cs
│   └── LeadVerificationRepository.cs
│
├── Employee
│   ├── IEmployeeRepository.cs
│   └── EmployeeRepository.cs
│
├── Customer
│   ├── ICustomerRepository.cs
│   └── CustomerRepository.cs
│
├── Context
│   └── BtnDbContext.cs
│
├── Entities
├── Configurations
└── Migrations
```

The Data project should contain only:

-   DbContext
-   Entity Models
-   Entity Configurations
-   Repositories
-   Database Access Logic
-   Migrations

It should not contain business logic.

------------------------------------------------------------------------

# Data Dependency Injection

Use one `DependencyInjection.cs` inside `BTN.Data`.

Use automatic Assembly Scanning (Scrutor) so every repository is
automatically registered.

Example:

``` text
Supplier
├── ISupplierRepository.cs
└── SupplierRepository.cs
```

Adding a new repository should require no manual DI registration.

`Program.cs` should remain:

``` csharp
builder.Services.AddBusinessServices();
builder.Services.AddDataServices();
```

------------------------------------------------------------------------

# Next Features to Implement

## 1. Lead Verification Form

Design a flexible verification form that includes:

-   Inquiry Type
-   Product/Service
-   Inquiry Details
-   Customer Requirements
-   Budget
-   Timeline
-   Verification Result
-   Lead Status
-   Contact Outcome
-   Follow-up Date
-   Remarks
-   Additional Notes

Also recommend additional enterprise CRM fields.

------------------------------------------------------------------------

## 2. Multiple Verification Methods

Support:

-   Phone Call
-   Manual Entry
-   WhatsApp
-   Email
-   Meeting
-   Future methods

Design for easy extensibility.

------------------------------------------------------------------------

## 3. Employee Management

Admin should:

-   Create/Edit Employees
-   Activate/Deactivate Employees
-   Assign/Reassign Leads
-   Track Employee Performance

Employees should:

-   Login
-   View Assigned Leads
-   Verify Leads
-   Update Lead Details
-   View Work History

------------------------------------------------------------------------

## 4. Customer Management

Employees can create customer accounts.

Customers can:

-   Login
-   View Purchased Leads
-   Search Leads
-   Filter Leads
-   View Lead Details

Future:

-   Purchase History
-   Downloads
-   Saved Leads

------------------------------------------------------------------------

## 5. Lead Assignment Workflow

``` text
Lead Created
      ↓
Admin Receives Lead
      ↓
Admin Assigns Lead
      ↓
Employee Verifies Lead
      ↓
Lead Becomes Verified
      ↓
Lead Available For Sale
      ↓
Customer Purchases Lead
```

Track:

-   Assignment History
-   Reassignment History
-   Verification History
-   Status History
-   Audit Logs
-   Employee Activity

------------------------------------------------------------------------

## 6. Database Design

Recommend complete normalized schema including:

-   User
-   Role
-   Employee
-   Customer
-   Lead
-   LeadAssignment
-   LeadVerification
-   VerificationMethod
-   VerificationForm
-   Purchase
-   AuditLog

------------------------------------------------------------------------

## 7. API Design

Design REST APIs for:

### Admin

-   Employee Management
-   Lead Assignment
-   Dashboard

### Employee

-   Assigned Leads
-   Verify Lead
-   Update Verification

### Customer

-   Login
-   Purchased Leads
-   Lead Details

------------------------------------------------------------------------

## 8. Folder Structure

Recommend the complete feature-based folder structure for:

-   BTN.API
-   BTN.Business
-   BTN.Data
-   BTN.Core

------------------------------------------------------------------------

## 9. Future Scalability

Design for:

-   AI Lead Scoring
-   Automatic Lead Assignment
-   WhatsApp Integration
-   Email Verification
-   Call Recording
-   CRM Integration
-   Bulk Lead Import
-   Notifications
-   Role-Based Permissions
-   Analytics
-   Reporting
-   Workflow Automation

------------------------------------------------------------------------

# Expected Output

After reviewing `implementation_plan.md`, provide:

1.  Gaps in the current plan.
2.  Architecture improvements.
3.  Updated implementation roadmap.
4.  Database schema.
5.  REST API design.
6.  Folder structure.
7.  Dependency Injection architecture using Scrutor assembly scanning.
8.  Recommended implementation order with priorities.
9.  Enterprise best practices for scalability, maintainability, and
    long-term growth.

The following additional requirements must be incorporated into the
implementation plan.

# Additional Requirements

## 10. Customer Wallet & Payment System

Customers should not purchase leads directly.

Instead, every customer should have an **eWallet**.

Workflow:

``` text
Customer
    ↓
Add Money to Wallet
    ↓
Wallet Balance Updated
    ↓
Purchase Verified Leads
    ↓
Amount Deducted from Wallet
```

Requirements:

-   Customer wallet
-   Wallet transactions
-   Wallet balance
-   Credit/Debit history
-   Refund support (future)
-   Transaction audit
-   Purchase history

Use a payment gateway that supports **free testing/sandbox**, such as:

-   Razorpay (Test Mode)
-   Stripe (Test Mode)

Recommend the best option considering development, testing, and future
production deployment.

------------------------------------------------------------------------

## 11. Billing / Invoice Management

I also want to build a Billing Management System inside this platform.

Customers should be able to:

-   Create invoices
-   Manage customers
-   Manage products/services
-   Generate quotations
-   Generate invoices
-   Record payments
-   Download or print invoices
-   Track invoice status
-   Manage taxes (future)
-   View billing reports

Branding features:

-   Upload company logo
-   Company name
-   Company address
-   GST/VAT information (future)
-   Invoice templates
-   Invoice numbering

Please design this module so it can later become a standalone SaaS
product if needed.

------------------------------------------------------------------------

## 12. Mobile Responsive Design

The entire platform must be fully mobile responsive.

This includes:

-   Admin Portal
-   Employee Portal
-   Customer Portal
-   Billing System

Every screen should provide a good experience on:

-   Desktop
-   Tablet
-   Mobile

Recommend the best frontend architecture and UI practices for responsive
enterprise applications.

------------------------------------------------------------------------

## 13. Progressive Web App (PWA)

I also want the website to behave like a mobile application.

The goal is that users can install it on Android, iPhone, Windows, and
macOS directly from the browser without developing separate native apps
initially.

Please design the application as a **Progressive Web App (PWA)** with
support for:

-   Installable application
-   App icon
-   Splash screen
-   Offline caching where appropriate
-   Push notifications (future)
-   Background synchronization (future)
-   Responsive layouts
-   Fast loading

I plan to build native mobile apps later, but the PWA should serve as
the first mobile experience.

------------------------------------------------------------------------

# Updated Expected Output

Also include:

10. Wallet architecture and database design.
11. Payment gateway integration strategy.
12. Billing Management architecture.
13. Mobile responsive architecture.
14. Progressive Web App (PWA) architecture.
15. Future migration strategy from PWA to native mobile applications.    
