import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGuard } from './components/RoleGuard';
import { AppLayout } from './components/Layout/AppLayout';
import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { UserListPage } from './pages/Users/UserListPage';
import { EmployeeListPage } from './pages/Employees/EmployeeListPage';
import { EmployeeWorkPage } from './pages/Employees/EmployeeWorkPage';
import { VerificationListPage } from './pages/Verification/VerificationListPage';
import { VerificationDetailPage } from './pages/Verification/VerificationDetailPage';
import { MarketplacePage } from './pages/Customer/MarketplacePage';
import { WalletPage } from './pages/Customer/WalletPage';
import { PurchasesPage } from './pages/Customer/PurchasesPage';
import { CustomerLeadDetailPage } from './pages/Customer/CustomerLeadDetailPage';
import { BillingHubPage } from './pages/Billing/BillingHubPage';
import { InvoicePrintPage } from './pages/Billing/InvoicePrintPage';
import { InvoiceCreatePage } from './pages/Billing/InvoiceCreatePage';
import { QuotationCreatePage } from './pages/Billing/QuotationCreatePage';
import { QuotationPrintPage } from './pages/Billing/QuotationPrintPage';
import { CustomerListPage } from './pages/Customers/CustomerListPage';
import { LeadSalesPage } from './pages/Leads/LeadSalesPage';
import { AdvertiseLeadFormPage } from './pages/Leads/AdvertiseLeadFormPage';
import { CampaignSubmissionsPage } from './pages/Campaign/CampaignSubmissionsPage';
import { GiftCampaignPage } from './pages/Public/GiftCampaignPage';
import { PublicFormPage } from './pages/Public/PublicFormPage';
import { FormListPage } from './pages/Forms/FormListPage';
import { FormEditorPage } from './pages/Forms/FormEditorPage';
import { OrgUnitListPage } from './pages/Org/OrgUnitListPage';
import { OrgUnitDetailPage } from './pages/Org/OrgUnitDetailPage';
import { HierarchyExplorerPage } from './pages/Org/HierarchyExplorerPage';
import { MyTeamPage } from './pages/Org/MyTeamPage';
import { HomeRedirect } from './components/HomeRedirect';
import { AccessDeniedPage } from './pages/Public/AccessDeniedPage';
import { FeedbackProvider } from './context/FeedbackContext';
import './styles/global.css';

const withLayout = (node: React.ReactNode) => <AppLayout>{node}</AppLayout>;

const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <FeedbackProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/gift" element={<GiftCampaignPage />} />
            <Route path="/gift/:platform" element={<GiftCampaignPage />} />
            <Route path="/f/:slug" element={<PublicFormPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={withLayout(<DashboardPage />)} />
              <Route path="/users" element={withLayout(<RoleGuard allowedRoles={['PlatformOwner']}><UserListPage /></RoleGuard>)} />
              <Route path="/employees" element={withLayout(<RoleGuard allowedRoles={['PlatformOwner']}><EmployeeListPage /></RoleGuard>)} />
              <Route path="/admin/org-units" element={withLayout(<RoleGuard allowedRoles={['PlatformOwner']}><OrgUnitListPage /></RoleGuard>)} />
              <Route path="/admin/org-units/:id" element={withLayout(<RoleGuard allowedRoles={['PlatformOwner']}><OrgUnitDetailPage /></RoleGuard>)} />
              <Route path="/admin/hierarchy" element={withLayout(<RoleGuard allowedRoles={['PlatformOwner']}><HierarchyExplorerPage /></RoleGuard>)} />
              <Route path="/my-team" element={withLayout(<RoleGuard allowedRoles={['PlatformOwner', 'Employee', 'VerificationAgent']}><MyTeamPage /></RoleGuard>)} />
              <Route path="/customers" element={withLayout(<RoleGuard allowedRoles={['PlatformOwner', 'Employee', 'VerificationAgent']}><CustomerListPage /></RoleGuard>)} />
              <Route path="/leads/sales" element={withLayout(<RoleGuard allowedRoles={['PlatformOwner']}><LeadSalesPage /></RoleGuard>)} />
              <Route path="/leads/advertise" element={withLayout(<RoleGuard allowedRoles={['PlatformOwner']}><AdvertiseLeadFormPage /></RoleGuard>)} />
              <Route path="/campaign/submissions" element={withLayout(<RoleGuard allowedRoles={['PlatformOwner']}><CampaignSubmissionsPage /></RoleGuard>)} />
              <Route path="/forms" element={withLayout(<RoleGuard allowedRoles={['PlatformOwner']}><FormListPage /></RoleGuard>)} />
              <Route path="/forms/:id" element={withLayout(<RoleGuard allowedRoles={['PlatformOwner']}><FormEditorPage /></RoleGuard>)} />
              <Route path="/verification" element={withLayout(<RoleGuard allowedRoles={['PlatformOwner', 'Employee', 'VerificationAgent']}><VerificationListPage /></RoleGuard>)} />
              <Route path="/verification/:id" element={withLayout(<RoleGuard allowedRoles={['PlatformOwner', 'Employee', 'VerificationAgent']}><VerificationDetailPage /></RoleGuard>)} />
              <Route path="/my-work" element={withLayout(<RoleGuard allowedRoles={['Employee', 'VerificationAgent']}><EmployeeWorkPage /></RoleGuard>)} />
              <Route path="/customer/marketplace" element={withLayout(<RoleGuard allowedRoles={['Customer']}><MarketplacePage /></RoleGuard>)} />
              <Route path="/customer/wallet" element={withLayout(<RoleGuard allowedRoles={['Customer']}><WalletPage /></RoleGuard>)} />
              <Route path="/customer/purchases" element={withLayout(<RoleGuard allowedRoles={['Customer']}><PurchasesPage /></RoleGuard>)} />
              <Route path="/customer/leads/:id" element={withLayout(<RoleGuard allowedRoles={['Customer']}><CustomerLeadDetailPage /></RoleGuard>)} />
              <Route path="/customer/billing" element={withLayout(<RoleGuard allowedRoles={['Customer']}><BillingHubPage /></RoleGuard>)} />
              <Route path="/customer/billing/invoices/new" element={withLayout(<RoleGuard allowedRoles={['Customer']}><InvoiceCreatePage /></RoleGuard>)} />
              <Route path="/customer/billing/invoices/:id/print" element={withLayout(<RoleGuard allowedRoles={['Customer']}><InvoicePrintPage /></RoleGuard>)} />
              <Route path="/customer/billing/quotations/new" element={withLayout(<RoleGuard allowedRoles={['Customer']}><QuotationCreatePage /></RoleGuard>)} />
              <Route path="/customer/billing/quotations/:id/print" element={withLayout(<RoleGuard allowedRoles={['Customer']}><QuotationPrintPage /></RoleGuard>)} />
            </Route>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<AccessDeniedPage />} />
          </Routes>
        </BrowserRouter>
      </FeedbackProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
