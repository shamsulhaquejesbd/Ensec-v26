import React, { useState } from 'react';
import {
  Layers,
  Database,
  Network,
  GitBranch,
  ShieldCheck,
  Package,
  TrendingUp,
  DollarSign,
  Smartphone,
  CheckCircle2,
  X,
  Workflow,
  Cpu,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';

export interface ArchitectureBlueprintViewProps {
  isEmbedded?: boolean;
  onClose?: () => void;
}

export const ArchitectureBlueprintView: React.FC<ArchitectureBlueprintViewProps> = ({
  isEmbedded = false,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'flow' | 'modules' | 'hierarchy' | 'schema' | 'roles' | 'inventory' | 'mfg' | 'sales' | 'finance' | 'tech'
  >('flow');

  return (
    <div
      className={`relative w-full ${
        isEmbedded
          ? 'rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs'
          : 'max-w-6xl max-h-[92vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl'
      } flex flex-col bg-white dark:bg-slate-900 overflow-hidden transition-colors`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Ensec ERP System Architecture & Database Blueprint
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Phases 1–10 Approved
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              End-to-End Enterprise Architecture for Lithium Battery Manufacturing & Nationwide Distribution in Bangladesh
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm">
          {[
            { id: 'flow', label: '1. Business Process', icon: GitBranch },
            { id: 'modules', label: '2. Modules Matrix', icon: Layers },
            { id: 'hierarchy', label: '3. Org Hierarchy', icon: Network },
            { id: 'schema', label: '4. Database ERD Schema', icon: Database },
            { id: 'roles', label: '5. Roles & RBAC', icon: ShieldCheck },
            { id: 'inventory', label: '6. Multi-Warehouse Flow', icon: Package },
            { id: 'mfg', label: '7. Kushtia BOM & Mfg', icon: Cpu },
            { id: 'sales', label: '8. Distribution & Offers', icon: TrendingUp },
            { id: 'finance', label: '9. Cash Book & Accounts', icon: DollarSign },
            { id: 'tech', label: '10. Mobile GPS & Tech Stack', icon: Smartphone },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className={`${isEmbedded ? 'p-6 space-y-6' : 'flex-1 overflow-y-auto p-6 space-y-6'} text-slate-700 dark:text-slate-200`}>
          {activeTab === 'flow' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 text-base mb-2">
                  Stage 1 to Stage 6: The Full Business Lifecycle
                </h3>
                <p className="text-sm text-blue-800/90 dark:text-blue-300">
                  Ensec distributes lithium batteries across Bangladesh. Raw materials are imported from China, assembled in the Kushtia factory, dispatched to dual Dhaka warehouses, and sold via direct corporate contracts and authorized distributors.
                </p>
              </div>

              {/* Visual Flow diagram */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center mb-2">
                    1
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">China SCM Import</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    CATL / Daly / EVE suppliers. Sea freight, port clearance, landed cost calculated.
                  </p>
                  <div className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded">
                    50% Ensec : 50% Optimum
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center mb-2">
                    2
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Kushtia Factory</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Optimum executes cell balancing, laser busbar welding, smart BMS wiring, casing assembly.
                  </p>
                  <div className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded">
                    BOM + Conversion Cost
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center mb-2">
                    3
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Dhaka Warehouses</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kushtia → Dhaka Hub 1 (Tejgaon) & Hub 2 (Uttara). In-transit tracking, stock transfers.
                  </p>
                  <div className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded">
                    Multi-Hub Inventory
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center mb-2">
                    4
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Field Sales & Offers</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Field reps with live GPS, order booking, automated volume tiered offers and promotions.
                  </p>
                  <div className="mt-2 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-1 rounded">
                    Mobile Field Portal
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center mb-2">
                    5
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Finance & Ledger</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dual Cash & Bank Books, Financial Statement reconciliation, Payroll, and automated aging.
                  </p>
                  <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded">
                    Unified Ledgers
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-800/30">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">
                  Two Sales Channels Implemented:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Channel A: Distributor Sales
                    </span>
                    <p className="text-sm font-medium mt-1">
                      Ensec Dhaka Hubs → Regional Distributors (DB Points) → Retailers / Workshop Dealers → End Customers
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Includes credit limits, DB statements, aging buckets, and territory assignment.
                    </p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Channel B: Direct Sales
                    </span>
                    <p className="text-sm font-medium mt-1">
                      Ensec Dhaka Hubs → Direct Corporate (Telecom Tower Companies, BREB Projects, Solar Mega Farms)
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Includes contract agreements, pipeline tracking, SLA warranties, and direct B2B invoicing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Comprehensive 16-Module Enterprise Matrix
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: '1. Executive Dashboard', desc: 'Real-time KPIs, sales targets, inventory valuation, cash balances, and alerts.' },
                  { name: '2. Raw Material Procurement', desc: 'China import POs, LC/BL tracking, container details, landed cost, 50:50 joint ratio.' },
                  { name: '3. Kushtia Manufacturing & BOM', desc: 'Configurable BOM for battery models, production batching, conversion costs, scrap & QA.' },
                  { name: '4. Offer & Promo Engine', desc: 'Promotional rules, discount engine, multi-tier volume slabs and free product benefits.' },
                  { name: '5. Multi-Warehouse Hubs', desc: 'Kushtia Factory, Dhaka 1 & 2 hubs, stock transfers with in-transit stages, damage logs.' },
                  { name: '6. Distributor Management', desc: 'Distributor master, DB points, credit limits, distributor ledger, aging buckets.' },
                  { name: '7. Customer Management & CRM', desc: 'Direct vs dealer customers, salesman agreement pipeline, interaction notes history.' },
                  { name: '8. Field Force & Live GPS Tracker', desc: 'Hierarchy mapping, live GPS simulated route, speed, battery, daily visit schedule.' },
                  { name: '9. Mobile Field Force Portal', desc: 'Touch-optimized mobile UI for field reps: product catalog, stock view, order taking.' },
                  { name: '10. Sales Order & Invoicing', desc: 'Multi-stage order lifecycle, warehouse allocation, tax/VAT 5-15%, dispatch challan.' },
                  { name: '11. Promotional Offer Engine', desc: 'Volume slabs, Buy X Get Y Free, auto-applied during sales order calculation.' },
                  { name: '12. Finance & Cash Book', desc: 'Head Office Cash, Warehouse Cash, Factory Cash, City Bank, Eastern Bank, vouchers.' },
                  { name: '13. Accounts Receivable & Payable', desc: 'Customer & Distributor aging analysis (Current, 1-30, 31-60, 61-90, 90+ days).' },
                  { name: '14. Automated Payroll & HR', desc: 'Basic salary, allowances, sales performance incentive formula, tax deductions, payslips.' },
                  { name: '15. Org Hierarchy & Administration', desc: 'Full tree editor from Company down to Territories, user roles, permission matrix.' },
                  { name: '16. Audit Trail & Reports', desc: 'Immutable audit log for every mutation (credit limit, stock, invoice) & management reports.' },
                ].map((mod, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                  >
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">{mod.name}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{mod.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'hierarchy' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Configurable Organizational & Sales Force Hierarchy
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                The organizational hierarchy is dynamic and supports non-hardcoded depth from Executive Leadership down to regional territories and retail counters.
              </p>
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                <pre>{`Ensec Bangladesh Ltd. (Company Level)
└── Lithium Battery Business Unit
    ├── Kushtia Manufacturing Plant (Assembly Facility)
    │   └── Production Assembly, QA & Cell Grading Cell
    │
    └── National Sales & Distribution Division (Tanvir Hossain)
        ├── Dhaka Region (Sabbir Ahmed - RM)
        │   ├── Dhaka North Area (Fahim Morshed - ASM)
        │   │   ├── Mirpur & Pallabi Territory (Zubair Ahmed - TSO)
        │   │   │   ├── Distributor: Meghna Solar & Power (DB-NAWABPUR)
        │   │   │   │   └── Retailers / Workshop Customers
        │   │   │   └── Direct Corporate Customers (edotco, etc.)
        │   │   │
        │   │   └── Uttara & Gazipur Territory (Mahmudul Hasan - TSO)
        │   │       └── Distributor: Padma Green Energy (DB-UTTARA)
        │   │
        │   └── Dhaka South Area (Nazmul Haque - ASM)
        │       └── Motijheel & Old Dhaka Territory (Imran Kabir - TSO)
        │
        ├── Chittagong Region (Jamal Uddin - RM)
        │   └── Agrabad Commercial Territory (Shakil Anwar - TSO)
        │       └── Distributor: Karnafuli Power Dynamics (DB-AGRABAD)
        │
        └── Khulna & Kushtia Region (Rezaul Karim - RM)
            └── Kushtia Sadar Territory (Asif Iqbal - TSO)`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Relational Database ERD Schema (PostgreSQL / Relational Data Model)
                </h3>
                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-1 rounded">
                  35+ Normalized Tables
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Normalized entities with primary keys, foreign key constraints, indexes on transaction dates and warehouse IDs, and soft-delete/audit compliance.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-blue-600 dark:text-blue-400 mb-2">// 1. Procurement & SCM Tables</div>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                    <li><b className="text-slate-900 dark:text-white">suppliers</b> (id PK, code, name, country, rating, balance_bdt)</li>
                    <li><b className="text-slate-900 dark:text-white">raw_materials</b> (id PK, code, name, category, unit, stock_kushtia, last_unit_cost)</li>
                    <li><b className="text-slate-900 dark:text-white">import_orders</b> (id PK, po_number, supplier_id FK, status, exchange_rate, lc_number, bl_number, container_no, landed_cost, ensec_share_pct, optimum_share_pct)</li>
                    <li><b className="text-slate-900 dark:text-white">import_order_items</b> (id PK, order_id FK, material_id FK, qty, unit_usd, total_usd)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">// 2. Manufacturing & Inventory Tables</div>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                    <li><b className="text-slate-900 dark:text-white">products</b> (id PK, code, name, category, model, voltage, capacity_ah, warranty_months, dist_price, cust_price)</li>
                    <li><b className="text-slate-900 dark:text-white">bill_of_materials</b> (id PK, product_id FK, material_id FK, required_qty, unit)</li>
                    <li><b className="text-slate-900 dark:text-white">production_orders</b> (id PK, order_no, product_id FK, planned_qty, completed_qty, batch_no, labor_cost, conversion_cost, wastage_pct, status)</li>
                    <li><b className="text-slate-900 dark:text-white">optimum_statement</b> (id PK, date, reference, type, debit_bdt, credit_bdt, running_balance_bdt, status)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-amber-600 dark:text-amber-400 mb-2">// 3. Multi-Warehouse & Stock Ledger</div>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                    <li><b className="text-slate-900 dark:text-white">warehouses</b> (id PK, code, name, type, location, capacity_units, current_stock_units)</li>
                    <li><b className="text-slate-900 dark:text-white">stock_transfers</b> (id PK, transfer_no, from_wh FK, to_wh FK, product_id FK, batch_no, qty, status, truck_no)</li>
                    <li><b className="text-slate-900 dark:text-white">stock_ledger</b> (id PK, date, warehouse_id FK, product_id FK, batch_no, type [Opening, Receive, TransIn, TransOut, Sales, Damage], qty_in, qty_out, balance_qty)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">// 4. Sales, Finance & HR Tables</div>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                    <li><b className="text-slate-900 dark:text-white">distributors</b> (id PK, code, name, credit_limit, opening_bal, current_outstanding, territory_id)</li>
                    <li><b className="text-slate-900 dark:text-white">customers</b> (id PK, code, name, channel, customer_type, pricing_tier, custom_product_prices_json, credit_limit, outstanding_bal)</li>
                    <li><b className="text-slate-900 dark:text-white">channel_pricing_matrix</b> (id PK, product_id FK, dist_price, dealer_price, corporate_price, project_price, retail_mrp)</li>
                    <li><b className="text-slate-900 dark:text-white">sales_orders</b> (id PK, order_no, channel, customer_id FK, dist_id FK, subtotal, tax_vat, net_amount, paid_amount, due_amount, status)</li>
                    <li><b className="text-slate-900 dark:text-white">cash_book</b> (id PK, date, voucher_no, account_type, category, cash_in, cash_out, running_balance)</li>
                    <li><b className="text-slate-900 dark:text-white">payroll</b> (id PK, month_year, employee_id FK, basic, allowances, incentive, tax, pf, net_payable)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Role-Based Access Control (RBAC) Permissions Matrix
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Role</th>
                      <th className="p-3">Scope</th>
                      <th className="p-3">Procurement</th>
                      <th className="p-3">Manufacturing</th>
                      <th className="p-3">Warehouses</th>
                      <th className="p-3">Sales / Orders</th>
                      <th className="p-3">Finance / Cash Book</th>
                      <th className="p-3">Payroll</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">Super Admin / MD</td>
                      <td className="p-3">Full Company</td>
                      <td className="p-3 text-emerald-600 font-medium">Full Access</td>
                      <td className="p-3 text-emerald-600 font-medium">Full Access</td>
                      <td className="p-3 text-emerald-600 font-medium">Full Access</td>
                      <td className="p-3 text-emerald-600 font-medium">Full Access</td>
                      <td className="p-3 text-emerald-600 font-medium">Full Access</td>
                      <td className="p-3 text-emerald-600 font-medium">Full Access</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">Sales Head</td>
                      <td className="p-3">National Sales</td>
                      <td className="p-3 text-slate-400">View Only</td>
                      <td className="p-3 text-slate-400">View Only</td>
                      <td className="p-3 text-blue-600">Request Transfer</td>
                      <td className="p-3 text-emerald-600 font-medium">Approve Orders</td>
                      <td className="p-3 text-slate-400">View Ledger</td>
                      <td className="p-3 text-blue-600">View Incentive</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">Factory Manager</td>
                      <td className="p-3">Kushtia Plant</td>
                      <td className="p-3 text-blue-600">Receive R/M</td>
                      <td className="p-3 text-emerald-600 font-medium">Create Batches</td>
                      <td className="p-3 text-blue-600">Dispatch FG</td>
                      <td className="p-3 text-slate-400">No Access</td>
                      <td className="p-3 text-slate-400">Optimum JV View</td>
                      <td className="p-3 text-slate-400">Plant Staff</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">Warehouse Manager</td>
                      <td className="p-3">Dhaka Hub 1 & 2</td>
                      <td className="p-3 text-slate-400">No Access</td>
                      <td className="p-3 text-slate-400">Receive Kushtia</td>
                      <td className="p-3 text-emerald-600 font-medium">Transfer & Dispatch</td>
                      <td className="p-3 text-blue-600">Dispatch Invoices</td>
                      <td className="p-3 text-slate-400">Warehouse Cash</td>
                      <td className="p-3 text-slate-400">No Access</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">Field Force (TSO/Rep)</td>
                      <td className="p-3">Territory Mobile</td>
                      <td className="p-3 text-slate-400">No Access</td>
                      <td className="p-3 text-slate-400">No Access</td>
                      <td className="p-3 text-blue-600">Check Live Stock</td>
                      <td className="p-3 text-emerald-600 font-medium">Create Orders</td>
                      <td className="p-3 text-slate-400">Log Cash Rct</td>
                      <td className="p-3 text-blue-600">View My Pay</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">Finance & Accounts</td>
                      <td className="p-3">Head Office</td>
                      <td className="p-3 text-blue-600">Landed Cost Audit</td>
                      <td className="p-3 text-blue-600">Cost Accounting</td>
                      <td className="p-3 text-blue-600">Stock Valuation</td>
                      <td className="p-3 text-blue-600">Invoice Audit</td>
                      <td className="p-3 text-emerald-600 font-medium">Post Vouchers</td>
                      <td className="p-3 text-emerald-600 font-medium">Process Payroll</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Multi-Warehouse Inventory & Costing Logic
              </h3>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Stock Equation Enforced Across All Hubs:
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200">
                  Closing Stock = Opening Stock + Goods Receive + Transfer In - Sales Invoices - Transfer Out + Sales Returns - Damages ± Physical Adjustments
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h4 className="font-semibold text-sm mb-1 text-slate-900 dark:text-white">1. FIFO & Weighted Average</h4>
                  <p className="text-xs text-slate-500">
                    Tracks landed cost lots for raw materials and batch manufacturing costs for finished goods.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h4 className="font-semibold text-sm mb-1 text-slate-900 dark:text-white">2. In-Transit Transfer State</h4>
                  <p className="text-xs text-slate-500">
                    Transfers between Kushtia and Dhaka prevent stock double-counting with dedicated "In-Transit" custody and truck details.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h4 className="font-semibold text-sm mb-1 text-slate-900 dark:text-white">3. Batch & Serial Traceability</h4>
                  <p className="text-xs text-slate-500">
                    Every battery links to its production batch number and warranty validity (36–60 months) down to invoice delivery.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mfg' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Kushtia Manufacturing & Bill of Materials (BOM) Architecture
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                When a production batch is completed in Kushtia, raw materials are atomically deducted per BOM multipliers, scrap and wastage percentage are recorded, and finished batteries enter the Kushtia store.
              </p>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">
                  Sample BOM: Ensec Telecom PowerRack 48V 100Ah (ET-48100-PRO)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block">Cells:</span>
                    <b>16x 3.2V 105Ah Cells</b>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block">BMS:</span>
                    <b>1x Smart 16S 100A CAN/RS485</b>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block">Casing:</span>
                    <b>1x 19-inch 3U Steel Rack</b>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block">Busbars & Terminals:</span>
                    <b>Pure Copper Laser Busbar Kit</b>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Sales, Distribution & Dynamic Offer Engine
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Orders can be placed via the Desktop ERP back-office or through the Field Force Mobile interface. The offer engine runs client-side rules to calculate volume discounts or free product incentives automatically.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h4 className="font-semibold text-sm mb-2 text-blue-600 dark:text-blue-400">Offer Engine Rules</h4>
                  <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                    <li>• <b>Volume Slabs:</b> Orders &ge; 10 units of Telecom batteries receive 5.0% instant rebate.</li>
                    <li>• <b>Buy X Get Y Free:</b> Orders &ge; 15 units of SolarPro 12.8V batteries award 1 Free Smart BMS unit.</li>
                    <li>• <b>Campaign Discounts:</b> Monsoon campaign flat BDT 2,000 off per EV rickshaw lithium battery pack.</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h4 className="font-semibold text-sm mb-2 text-emerald-600 dark:text-emerald-400">Credit Control & Limits</h4>
                  <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                    <li>• Real-time credit validation against distributor credit limits.</li>
                    <li>• Prevents invoice dispatch if outstanding exceeds allowed ceiling or aging &gt; 60 days.</li>
                    <li>• Instant customer / distributor ledger update on invoice posting.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Cash Book, Multi-Account Banking & Aging Engine
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h4 className="font-semibold text-sm mb-2 text-slate-900 dark:text-white">Multi-Account Cash Book</h4>
                  <p className="text-xs text-slate-500 mb-2">
                    Maintains real-time ledger records for multiple physical cash drawers and banking institutions:
                  </p>
                  <ul className="text-xs space-y-1 text-slate-700 dark:text-slate-300 font-mono">
                    <li>- Head Office Cash (Nawabpur / Tejgaon)</li>
                    <li>- Warehouse Cash (Tejgaon & Uttara)</li>
                    <li>- Kushtia Factory Cash</li>
                    <li>- City Bank PLC (Corporate A/C)</li>
                    <li>- Eastern Bank PLC (Import L/C A/C)</li>
                    <li>- Islami Bank Bangladesh Ltd.</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h4 className="font-semibold text-sm mb-2 text-slate-900 dark:text-white">Banking & Financial Reconciliation</h4>
                  <p className="text-xs text-slate-500 mb-2">
                    Integrated accounting ledger tracking collections, deposits, vendor remittances and operating expenses:
                  </p>
                  <ul className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                    <li>• <b>Debit / Inflow:</b> Distributor invoice collections, cash advances, and customer payments.</li>
                    <li>• <b>Credit / Outflow:</b> Direct supplier remittances, LC import charges, factory operational fees.</li>
                    <li>• <b>Balance:</b> Real-time reconciled ledger across all bank accounts and cash registers.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tech' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Technology Stack, Mobile Optimization & GPS Tracking
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white mb-2">Native Web Architecture</div>
                  <p className="text-xs text-slate-500">
                    Pure semantic HTML5, modern responsive Tailwind CSS, clean modular TypeScript. Zero heavy third-party UI bloat ensures instantaneous 60fps responsiveness on mobile devices and 4G connections.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white mb-2">Live GPS Simulation & Route Map</div>
                  <p className="text-xs text-slate-500">
                    Interactive SVG-based GPS tracking engine rendering field representatives, breadcrumb route trails, vehicle speeds, battery telemetry, and visit checkpoints in Dhaka, Chittagong, and Kushtia.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white mb-2">Dark / Light Accessibility</div>
                  <p className="text-xs text-slate-500">
                    High-contrast dark mode tailored for factory floor lighting and bright light mode for outdoor field sales in sunlight.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Ensec ERP & Distribution Architecture Documentation • Version 2.4.0
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              Close Blueprint
            </button>
          )}
        </div>
      </div>
  );
};

export const ArchitectureBlueprintModal: React.FC = () => {
  const { showArchitectureModal, setShowArchitectureModal } = useERP();
  if (!showArchitectureModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <ArchitectureBlueprintView onClose={() => setShowArchitectureModal(false)} />
    </div>
  );
};
