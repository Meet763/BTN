# 🏢 Business Trust Network (BTN) — System & Architecture Specification

Welcome to the **Business Trust Network (BTN)** repository. This document details the technical architecture, project layout, database management conventions, and developer guidelines for building and extending the BTN platform.

**Feature plan:** [Google Product Taxonomy → lead department routing](docs/GOOGLE_TAXONOMY_ROUTING_PLAN.md) (local data import, SQL, auto-assign by `ProductInterest`).

---

## 📐 System Architecture Overview

BTN is built following **Enterprise N-Tier Clean Architecture** principles. The system enforces strict separation of concerns, ensuring that database implementation details never leak into public API contracts or business logic.

```
                               ┌─────────────────────────┐
                               │   React Frontend (Vite) │
                               └────────────┬────────────┘
                                            │ HTTP / REST (JSON)
                               ┌────────────▼────────────┐
                               │     1. BTN.API Layer    │
                               └────────────┬────────────┘
                                            │ DTOs & Interfaces
                               ┌────────────▼────────────┐
                               │   2. BTN.Services Layer │
                               └────────────┬────────────┘
                                            │ DTOs ↔ DB Models
                               ┌────────────▼────────────┐
                               │3. BTN.Infrastructure Layer│
                               └────────────┬────────────┘
                                            │ PostgreSQL TCP
                               ┌────────────▼────────────┐
                               │  PostgreSQL Database    │
                               └─────────────────────────┘
                                            ▲
                                            │ References Contracts
                               ┌────────────┴────────────┐
                               │     4. BTN.Core Layer   │
                               └─────────────────────────┘
```

---

## 📦 Layer Breakdown & Responsibilities

### 1. `BTN.Core` (Contracts & Shared Domain)
- **Role**: Contains all public contract definitions, DTOs, interfaces, and application constants. Has zero dependencies on EF Core or infrastructure.
- **Contents**:
  - `DTOs/`: Request and Response data models (e.g. `CreateUserRequest`, `LeadResponse`).
  - `Interfaces/`: Repository interfaces (`IUserRepository`, `ILeadRepository`) and Service interfaces (`IUserService`, `ILeadService`).
  - `Enums/`: System enumeration definitions (`UserRole`, `LeadStatus`, `LeadSource`).
  - `Constants/`: Application-wide constants.

### 2. `BTN.Infrastructure` (Data, DB Models & Repositories)
- **Role**: Handles data persistence, database connections, Entity Framework Core mappings, auto-increment identity generation, and migrations.
- **Contents**:
  - `Models/`: Internal Database Entity models (`UserModel`, `LeadModel`, `RoleModel`, etc.).
  - `Data/BtnDbContext.cs`: EF Core DbContext configuring table mappings and `snake_case` column naming.
  - `Repositories/`: Concrete repository implementations (`Repository<T>`, `UserRepository`, `LeadRepository`).
  - `Migrations/`: All EF Core migrations for PostgreSQL schema evolution.
  - `DependencyInjection.cs`: Modular registration of `DbContext` and Repositories for `Program.cs`.

### 3. `BTN.Services` (Business Logic Layer)
- **Role**: Implements application workflows, business rules, validation logic, and security assertions.
- **Key Principle**: Interacts **only** with Repositories (never calls `DbContext` directly) and maps DB Models to DTOs.
- **Contents**:
  - `Services/`: `AuthService`, `UserService`, `LeadService`, `TokenService`.
  - `DependencyInjection.cs`: Modular registration of Application Services for `Program.cs`.

### 4. `BTN.API` (Web API Layer)
- **Role**: Entry point for HTTP requests. Handles routing, authentication middleware, rate-limiting, CORS, and global exception handling.
- **Key Principle**: Controllers are "thin" and only delegate work to Services using DTOs.
- **Contents**:
  - `Controllers/`: `AuthController`, `UsersController`, `LeadsController`.
  - `Middleware/`: `ErrorHandlingMiddleware`, `AuditLogMiddleware`.
  - `Program.cs`: Clean 2-line dependency injection startup.

---

## 🗄️ Database Architecture & Management

### Technology Stack
- **Database Engine**: PostgreSQL
- **ORM**: Entity Framework Core 10 (`Npgsql.EntityFrameworkCore.PostgreSQL`)
- **Primary Key Strategy**: `int` Identity (Auto-increment: `1, 2, 3, 4...`)

### Database Management Rules
1. **Infrastructure Isolation**: All DB Models (`UserModel`, `LeadModel`, etc.), `BtnDbContext`, and Migrations live **exclusively** inside `BTN.Infrastructure`.
2. **No Direct Entity Leaks**: API Controllers and Frontend code consume DTOs from `BTN.Core`, **never** raw database models.
3. **Auto-Migrations on Startup**: When the API starts, `DataSeeder.SeedAsync()` executes `context.Database.MigrateAsync()` to automatically apply pending migrations.

---

## 🛠️ Folder Structure

```
d:\btn\backend\
├── src\
│   ├── BTN.Core\                           ← CONTRACTS LAYER
│   │   ├── DTOs\
│   │   │   ├── Auth\                       ← LoginRequest, LoginResponse, RefreshTokenRequest
│   │   │   ├── Leads\                      ← CreateLeadRequest, LeadResponse, VerifyLeadRequest
│   │   │   └── Users\                      ← CreateUserRequest, UserResponse, UpdateUserRequest
│   │   ├── Interfaces\                     ← IUserService, ILeadService, IUserRepository
│   │   ├── Enums\                          ← UserRole, UserStatus, LeadStatus, LeadSource
│   │   └── Constants\                      ← System Constants
│   │
│   ├── BTN.Infrastructure\                 ← DATA & REPOSITORY LAYER
│   │   ├── Models\                         ← UserModel, LeadModel, RoleModel, LeadVerificationModel
│   │   ├── Data\
│   │   │   ├── BtnDbContext.cs             ← EF Core Context & snake_case Mappings
│   │   │   └── Seed\DataSeeder.cs          ← Database Seeding & Migration Trigger
│   │   ├── Repositories\                   ← Generic & Custom Repositories
│   │   ├── Migrations\                     ← EF Core Database Migrations
│   │   └── DependencyInjection.cs          ← AddInfrastructureServices()
│   │
│   ├── BTN.Services\                       ← BUSINESS LOGIC LAYER
│   │   ├── Services\                       ← AuthService, UserService, LeadService, TokenService
│   │   └── DependencyInjection.cs          ← AddApplicationServices()
│   │
│   └── BTN.API\                            ← WEB API LAYER
│       ├── Controllers\                    ├── AuthController, UsersController, LeadsController
│       ├── Middleware\                     ├── ErrorHandlingMiddleware, AuditLogMiddleware
│       ├── Program.cs                      ├── Clean Startup Entry Point
│       └── appsettings.json               ├── Database Connection Strings & JwtSettings
```

---

## 🔌 Clean Dependency Injection (`Program.cs`)

Because Dependency Injection is modularized into `DependencyInjection.cs` files in `Infrastructure` and `Services`, `Program.cs` stays extremely clean:

```csharp
var builder = WebApplication.CreateBuilder(args);

// 1. Register Infrastructure Services (DbContext, Repositories)
builder.Services.AddInfrastructureServices(builder.Configuration);

// 2. Register Business Services (Auth, User, Lead services)
builder.Services.AddApplicationServices();

// 3. Register Security & API
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

var app = builder.Build();
// ... Middlewares & Pipelines
app.Run();
```

---

## 🚀 Developer Workflow: Adding a New Feature / Table

When adding a new table (for example, `Company`):

1. **Step 1 — Create DTOs in `BTN.Core`**:
   - `CreateCompanyRequest.cs`
   - `CompanyResponse.cs`

2. **Step 2 — Create DB Model in `BTN.Infrastructure/Models`**:
   - `CompanyModel.cs` with `public int Id { get; set; }`

3. **Step 3 — Register in `BtnDbContext.cs`**:
   - `public DbSet<CompanyModel> Companies { get; set; } = null!;`

4. **Step 4 — Create Migration**:
   ```powershell
   cd d:\btn\backend
   dotnet ef migrations add AddCompanyTable --project src\BTN.Infrastructure --startup-project src\BTN.API
   ```

5. **Step 5 — Create Repository & Service**:
   - Add `ICompanyRepository` & `CompanyRepository` in `BTN.Infrastructure`.
   - Add `ICompanyService` & `CompanyService` in `BTN.Services`.

6. **Step 6 — Create Controller in `BTN.API`**:
   - Add `CompaniesController.cs` returning DTOs.

7. **Step 7 — Run & Verify**:
   ```powershell
   dotnet run --project src\BTN.API\BTN.API.csproj
   ```
   *Migrations apply automatically on startup!*

---

## 🔑 Database Command Cheat Sheet

| Task | Command (run from `d:\btn\backend`) |
|------|------------------------------------|
| **Add New Migration** | `dotnet ef migrations add <Name> --project src\BTN.Infrastructure --startup-project src\BTN.API` |
| **Apply Migrations** | `dotnet ef database update --project src\BTN.Infrastructure --startup-project src\BTN.API` |
| **Export Pure SQL Script** | `dotnet ef migrations script --project src\BTN.Infrastructure --startup-project src\BTN.API --output schema.sql` |
| **Drop Local Database** | `dotnet ef database drop --project src\BTN.Infrastructure --startup-project src\BTN.API --force` |

---

## 💻 Tech Stack Summary

- **Backend**: .NET 10 Web API (C#)
- **Database**: PostgreSQL with Entity Framework Core 10 (Code-First)
- **Frontend**: React 19 + TypeScript + Vite + Ant Design
- **Authentication**: JWT Bearer Tokens with Refresh Token rotation & BCrypt hashing
