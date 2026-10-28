import React, { useState, useEffect } from 'react';
import { ERPProvider, useERP } from './context/ERPContext.tsx';
import { Sidebar } from './components/common/Sidebar.tsx';
import { ArchitectureBlueprintModal } from './components/architecture/ArchitectureBlueprintModal.tsx';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard.tsx';
import { ProcurementModule } from './components/procurement/ProcurementModule.tsx';
import { ManufacturingModule } from './components/manufacturing/ManufacturingModule.tsx';
import { WarehouseModule } from './components/inventory/WarehouseModule.tsx';
import { DistributorModule } from './components/distribution/DistributorModule.tsx';
import { CustomerCRMModule } from './components/crm/CustomerCRMModule.tsx';
import { CRMAgreementsPage } from './components/crm/CRMAgreementsPage.tsx';
import { FieldForceTrackerModule } from './components/fieldforce/FieldForceTrackerModule.tsx';
import { MobileSalesPortal } from './components/fieldforce/MobileSalesPortal.tsx';
import { SalesOrdersModule } from './components/sales/SalesOrdersModule.tsx';
import { SalesOrdersRegistryModule } from './components/sales/SalesOrdersRegistryModule.tsx';
import { RequisitionModule } from './components/requisition/RequisitionModule.tsx';
import { PaymentModule } from './components/payment/PaymentModule.tsx';
import { TADAModule } from './components/tada/TADAModule.tsx';
import { OffersPromotionModule } from './components/offers/OffersPromotionModule.tsx';
import { FinanceCashBookModule } from './components/finance/FinanceCashBookModule.tsx';
import { PayrollModule } from './components/payroll/PayrollModule.tsx';
import { ReportsModule } from './components/reports/ReportsModule.tsx';
import { OrgHierarchyAndRoles } from './components/settings/OrgHierarchyAndRoles.tsx';
import { UserManagementModule } from './components/users/UserManagementModule.tsx';
import {
  FinishedProductsPage,
  ProductCategoriesPage,
  ProductBrandsPage,
  RawMaterialsPage,
  RawMaterialsCategoryPage,
  RawMaterialsClassificationPage,
  WarehousePage,
  CustomerDirectoryPage,
  FieldForcePage,
  DepartmentPage,
  BankListPage,
  UnitOfMeasurementPage,
  ChannelPricingPage,
} from './components/basicdata/BasicDataHub.tsx';
import { StockModule } from './components/stock/StockModule.tsx';
import { InventoryStockPage } from './components/stock/InventoryStockPage.tsx';
import { WarrantyManagementModule } from './components/warranty/WarrantyManagementModule.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { ShieldAlert, ArrowLeft, Menu } from 'lucide-react';

function MainApp() {
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const { currentUser, currentUserHasPermission, isAuthenticated } = useERP();

  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        setActiveModule(e.detail);
      }
    };
    window.addEventListener('ensec-navigate', handleNavigate);
    return () => window.removeEventListener('ensec-navigate', handleNavigate);
  }, []);

  // If not authenticated, render Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const isModulePermitted =
    activeModule === 'dashboard' ||
    activeModule === 'basic-data' ||
    activeModule.startsWith('basic-data-') ||
    activeModule.startsWith('payment') ||
    activeModule.startsWith('requisition') ||
    activeModule === 'stock' ||
    activeModule.startsWith('stock-') ||
    activeModule === 'inventory-stock' ||
    activeModule.startsWith('inventory-stock') ||
    activeModule.startsWith('warranty') ||
    activeModule === 'tada' ||
    currentUserHasPermission(activeModule);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Mobile-only header (hidden on desktop lg) */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-12 px-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 text-xs font-semibold"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
        <span className="font-extrabold text-xs tracking-tight text-blue-600 dark:text-blue-400">ENSEC ERP</span>
        <div className="w-8"></div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeModule={activeModule}
          onSelectModule={(mod) => setActiveModule(mod)}
        />

        {/* Main Content Area - Comfortable padding on right side of nav bar */}
        <main className="flex-1 lg:pl-[18.75rem] px-4 sm:px-6 py-4 w-full overflow-y-auto">
          {!isModulePermitted ? (
            <div className="p-8 max-w-md mx-auto mt-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Access Clearance Restricted
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your account (<b>{currentUser.name}</b> • {currentUser.role}) does not have security permission to access the <b>{activeModule}</b> module.
              </p>
              <p className="text-[11px] text-slate-400">
                Please contact the Super Admin to request permission elevation.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={() => setActiveModule('dashboard')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Dashboard</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeModule === 'dashboard' && (
                <ExecutiveDashboard onNavigate={(mod) => setActiveModule(mod)} />
              )}
              {(activeModule === 'basic-data' || activeModule === 'basic-data-products') && (
                <FinishedProductsPage />
              )}
              {activeModule === 'basic-data-categories' && (
                <ProductCategoriesPage />
              )}
              {activeModule === 'basic-data-brands' && (
                <ProductBrandsPage />
              )}
              {activeModule === 'basic-data-raw-materials' && (
                <RawMaterialsPage onNavigate={(mod) => setActiveModule(mod)} />
              )}
              {activeModule === 'basic-data-raw-categories' && (
                <RawMaterialsCategoryPage onNavigate={(mod) => setActiveModule(mod)} />
              )}
              {activeModule === 'basic-data-raw-classifications' && (
                <RawMaterialsClassificationPage onNavigate={(mod) => setActiveModule(mod)} />
              )}
              {activeModule === 'basic-data-warehouses' && (
                <WarehousePage />
              )}
              {(activeModule === 'basic-data-distributors' || activeModule === 'distributors') && (
                <DistributorModule onNavigate={(mod) => setActiveModule(mod)} />
              )}
              {activeModule === 'basic-data-customers' && (
                <CustomerDirectoryPage
                  onNavigateToPricingMatrix={() => setActiveModule('basic-data-pricing-matrix')}
                />
              )}
              {activeModule === 'basic-data-pricing-matrix' && (
                <ChannelPricingPage
                  onNavigateToProducts={() => setActiveModule('basic-data-products')}
                  onNavigateToCustomers={() => setActiveModule('basic-data-customers')}
                  onNavigateToDistributors={() => setActiveModule('basic-data-distributors')}
                />
              )}
              {activeModule === 'customers-crm' && (
                <CustomerCRMModule initialTab="pricing" />
              )}
              {(activeModule === 'basic-data-org-hierarchy' || activeModule === 'org-hierarchy') && (
                <OrgHierarchyAndRoles onNavigate={(mod) => setActiveModule(mod)} />
              )}
              {activeModule === 'basic-data-field-force' && (
                <FieldForcePage />
              )}
              {activeModule === 'basic-data-departments' && (
                <DepartmentPage />
              )}
              {activeModule === 'basic-data-banks' && (
                <BankListPage />
              )}
              {(activeModule === 'basic-data-uom' || activeModule === 'uom') && (
                <UnitOfMeasurementPage />
              )}
              {(activeModule === 'basic-data-offers' || activeModule === 'offers') && (
                <OffersPromotionModule />
              )}
              {activeModule === 'procurement' && <ProcurementModule />}
              {activeModule === 'manufacturing' && <ManufacturingModule />}
              {activeModule === 'warehouse' && <WarehouseModule />}
              {(activeModule === 'stock' || activeModule.startsWith('stock-')) && (
                <StockModule
                  activeSubTab={activeModule}
                  onNavigate={(mod) => setActiveModule(mod)}
                />
              )}
              {(activeModule === 'inventory-stock' || activeModule.startsWith('inventory-stock')) && (
                <InventoryStockPage onNavigate={(mod) => setActiveModule(mod)} />
              )}
              {activeModule === 'field-tracker' && <FieldForceTrackerModule />}
              {activeModule === 'mobile-field' && <MobileSalesPortal />}
              {activeModule === 'sales-orders' && (
                <SalesOrdersModule onNavigateToRegistry={() => setActiveModule('sales-orders-registry')} />
              )}
              {activeModule === 'sales-orders-registry' && (
                <SalesOrdersRegistryModule onNavigateToCreateOrder={() => setActiveModule('sales-orders')} />
              )}
              {activeModule === 'requisition' && <RequisitionModule initialTab="list" />}
              {activeModule === 'requisition-create' && <RequisitionModule initialTab="create" />}
              {activeModule === 'requisition-list' && <RequisitionModule initialTab="list" />}
              {activeModule === 'requisition-approve' && <RequisitionModule initialTab="approve" />}
              {activeModule === 'requisition-issue' && <RequisitionModule initialTab="issue" />}
              {activeModule === 'requisition-issued' && <RequisitionModule initialTab="issued" />}
              {activeModule === 'requisition-received' && <RequisitionModule initialTab="received" />}
              {activeModule === 'payment' && <PaymentModule initialTab="list" />}
              {activeModule === 'payment-list' && <PaymentModule initialTab="list" />}
              {activeModule === 'payment-create' && <PaymentModule initialTab="create" />}
              {activeModule === 'payment-aging' && <PaymentModule initialTab="aging" />}
              {activeModule === 'crm-agreements' && <CRMAgreementsPage />}
              {activeModule === 'tada' && <TADAModule />}
              {activeModule === 'finance-cashbook' && <FinanceCashBookModule />}
              {activeModule === 'payroll' && <PayrollModule />}
              {activeModule === 'reports' && <ReportsModule />}
              {activeModule === 'users-permissions' && <UserManagementModule />}
              {(activeModule === 'warranty' || activeModule.startsWith('warranty-')) && (
                <WarrantyManagementModule
                  key={activeModule}
                  initialSubTab={activeModule === 'warranty' ? 'warranty-dashboard' : activeModule}
                  onNavigate={(mod) => setActiveModule(mod)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Interactive System Blueprint & ERD Modal */}
      <ArchitectureBlueprintModal />
    </div>
  );
}

export default function App() {
  return (
    <ERPProvider>
      <MainApp />
    </ERPProvider>
  );
}
