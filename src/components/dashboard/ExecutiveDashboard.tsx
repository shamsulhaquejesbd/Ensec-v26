import React from 'react';
import {
  TrendingUp,
  Package,
  BatteryCharging,
  DollarSign,
  Users,
  ShieldCheck,
  AlertCircle,
  Truck,
  ArrowUpRight,
  ChevronRight,
  Clock,
  Sparkles,
  BarChart3,
  Factory,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';

export interface ExecutiveDashboardProps {
  onNavigate?: (module: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ onNavigate }) => {
  const {
    products,
    warehouses,
    fieldForceReps,
    salesOrders,
    requisitions,
    warrantyTickets,
    productionOrders,
    auditLogs,
    distributors,
    currentUser,
  } = useERP();

  const totalStockUnits = warehouses.reduce((acc, w) => acc + (w.currentStockUnits || 0), 0);
  const totalSalesBDT = salesOrders.reduce((acc, so) => acc + (so.netAmountBDT || so.subTotalBDT || 0), 0);
  const pendingOrdersCount = salesOrders.filter((s) => s.status === 'Booked' || s.status === 'Pending').length;
  const pendingRequisitions = requisitions.filter((r) => r.status === 'Pending' || r.status === 'Submitted').length;
  const activeWarranties = warrantyTickets.filter((w) => w.status !== 'Delivered' && w.status !== 'Closed').length;
  const activeRepsCount = fieldForceReps.filter((r) => r.status === 'Active').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        
      </div>

      {/* Top Level KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Gross Sales (YTD)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              ৳ {totalSalesBDT.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% from last quarter</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Live Stock Units
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalStockUnits.toLocaleString()} <span className="text-xs font-normal text-slate-500">Units</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Across {warehouses.length} active factory & depot hubs
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Field Force
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {activeRepsCount} <span className="text-xs font-normal text-slate-500">Reps Deployed</span>
            </div>
            <div className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
              <span>GPS Tracking Active</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Warranty In-Process
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BatteryCharging className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {activeWarranties} <span className="text-xs font-normal text-slate-500">Tickets Active</span>
            </div>
            <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <span>Factory Repair & QC SLA 48h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Modules & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Operational Command Center</span>
              </h2>
              <span className="text-xs text-slate-400">Click to launch module</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'basic-data-products', title: 'Finished Products', count: `${products.length} Models`, icon: Package, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60' },
                { id: 'procurement', title: 'Import SCM', count: 'Consignments', icon: Factory, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' },
                { id: 'manufacturing', title: 'Manufacturing & BOM', count: `${productionOrders.length} Orders`, icon: BatteryCharging, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' },
                { id: 'stock', title: 'Stock & Ledger', count: `${warehouses.length} Hubs`, icon: Truck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' },
                { id: 'field-tracker', title: 'Field Force & GPS', count: `${fieldForceReps.length} Agents`, icon: Users, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' },
                { id: 'warranty', title: 'Warranty & QC', count: `${warrantyTickets.length} Claims`, icon: ShieldCheck, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
              ].map((mod) => {
                const IconComponent = mod.icon;
                return (
                  <button
                    key={mod.id}
                    onClick={() => onNavigate?.(mod.id)}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`w-8 h-8 rounded-lg ${mod.color} flex items-center justify-center`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
                    </div>
                    <div className="mt-3">
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-100">{mod.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{mod.count}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lithium Battery Portfolio</h3>
                <p className="text-xs text-slate-500">Key manufacturing SKUs and channel distribution pricing</p>
              </div>
              <button
                onClick={() => onNavigate?.('basic-data-products')}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View All ({products.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                    <th className="py-2.5 font-semibold">Model / SKU</th>
                    <th className="py-2.5 font-semibold">Category</th>
                    <th className="py-2.5 font-semibold text-right">MRP (BDT)</th>
                    <th className="py-2.5 font-semibold text-right">Distributor (BDT)</th>
                    <th className="py-2.5 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {products.slice(0, 5).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        <div>{p.name}</div>
                        <span className="text-[10px] text-slate-400">{p.code}</span>
                      </td>
                      <td className="py-3 text-slate-500">{p.category}</td>
                      <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                        ৳{p.mrpBDT?.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                        ৳{p.distributorPriceBDT?.toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                          {p.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Pending Clearance</span>
            </h3>

            <div className="space-y-3">
              <div
                onClick={() => onNavigate?.('sales-orders')}
                className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between cursor-pointer hover:bg-amber-50 transition"
              >
                <div>
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    {pendingOrdersCount} Sales Orders Pending
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-400">Awaiting commercial credit check</div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-600" />
              </div>

              <div
                onClick={() => onNavigate?.('requisition')}
                className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition"
              >
                <div>
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    {pendingRequisitions} Requisitions Submitted
                  </div>
                  <div className="text-[11px] text-blue-700 dark:text-blue-400">Warehouse stock issue approval</div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-600" />
              </div>

              <div
                onClick={() => onNavigate?.('warranty')}
                className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-between cursor-pointer hover:bg-purple-50 transition"
              >
                <div>
                  <div className="text-xs font-bold text-purple-900 dark:text-purple-200">
                    {activeWarranties} Warranty Claims in Factory
                  </div>
                  <div className="text-[11px] text-purple-700 dark:text-purple-400">QC & technician job cards</div>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Recent System Activity</span>
              </h3>
              <button
                onClick={() => onNavigate?.('reports')}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                View logs
              </button>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="text-xs border-l-2 border-blue-500 pl-3 py-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {log.details}
                  </p>
                  <div className="text-[10px] text-slate-400 font-medium">By {log.userName}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
