import React, { useState } from 'react';
import {
  FileText,
  BarChart2,
  Download,
  Printer,
  Calendar,
  Filter,
  TrendingUp,
  Package,
  Layers,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';

export const ReportsModule: React.FC = () => {
  const { salesOrders, products, warehouses, distributors, warrantyTickets, auditLogs } = useERP();
  const [activeReport, setActiveReport] = useState<'sales' | 'inventory' | 'warranty' | 'audit'>('sales');

  const exportCSV = (filename: string, rows: (string | number)[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    if (activeReport === 'sales') {
      const rows = [
        ['Order Number', 'Date', 'Distributor / Customer', 'Status', 'Total (BDT)'],
        ...salesOrders.map((s) => [
          s.orderNumber,
          s.date,
          `"${s.distributorName || s.customerName}"`,
          s.status,
          s.netAmountBDT || s.subTotalBDT || 0,
        ]),
      ];
      exportCSV('ensec_sales_report', rows);
    } else if (activeReport === 'inventory') {
      const rows = [
        ['Warehouse', 'Code', 'Location', 'Capacity', 'Current Stock Units'],
        ...warehouses.map((w) => [
          `"${w.name}"`,
          w.code,
          `"${w.location}"`,
          w.capacityUnits || 0,
          w.currentStockUnits || 0,
        ]),
      ];
      exportCSV('ensec_inventory_report', rows);
    } else if (activeReport === 'warranty') {
      const rows = [
        ['Ticket #', 'Customer', 'Battery Brand', 'Serial #', 'Status', 'Cost BDT'],
        ...warrantyTickets.map((w) => [
          w.ticketNumber,
          `"${w.customerName || ''}"`,
          `"${w.batteryBrand || ''}"`,
          w.serialNumber || '',
          w.status,
          w.estimatedCostBDT || 0,
        ]),
      ];
      exportCSV('ensec_warranty_report', rows);
    } else {
      const rows = [
        ['Timestamp', 'User', 'Action', 'Module', 'Details'],
        ...auditLogs.map((a) => [
          a.timestamp,
          `"${a.userName}"`,
          `"${a.action}"`,
          `"${a.module}"`,
          `"${a.details.replace(/"/g, '""')}"`,
        ]),
      ];
      exportCSV('ensec_audit_log_report', rows);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Executive Analytics & Audit Reports
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time exportable MIS reports, sales reconciliation, factory batch ledgers, and ISO compliance logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV / Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-2 shadow-xs transition hover:bg-slate-50"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Category Switcher */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-md">
        <button
          onClick={() => setActiveReport('sales')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeReport === 'sales'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Sales & Revenue
        </button>
        <button
          onClick={() => setActiveReport('inventory')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeReport === 'inventory'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Depot Inventory
        </button>
        <button
          onClick={() => setActiveReport('warranty')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeReport === 'warranty'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Warranty Claims
        </button>
        <button
          onClick={() => setActiveReport('audit')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeReport === 'audit'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* Render Active Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="overflow-x-auto">
          {activeReport === 'sales' ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Distributor / Customer</th>
                  <th className="py-3 px-3 text-right">Order Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {salesOrders.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-mono font-semibold">{s.orderNumber}</td>
                    <td className="py-3 px-3 text-slate-500">{s.date}</td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                      {s.distributorName || s.customerName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ৳{(s.netAmountBDT || s.subTotalBDT || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeReport === 'inventory' ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Hub Name</th>
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">District</th>
                  <th className="py-3 px-3 text-right">Capacity (Units)</th>
                  <th className="py-3 px-3 text-right">Current Stock</th>
                  <th className="py-3 px-3 text-center">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {warehouses.map((w) => {
                  const pct = Math.round(((w.currentStockUnits || 0) / (w.capacityUnits || 1)) * 100);
                  return (
                    <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{w.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{w.code}</td>
                      <td className="py-3 px-3 text-slate-500">{w.district}</td>
                      <td className="py-3 px-3 text-right font-mono">{w.capacityUnits?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                        {w.currentStockUnits?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : activeReport === 'warranty' ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Ticket #</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Model</th>
                  <th className="py-3 px-3">Serial #</th>
                  <th className="py-3 px-3 text-center">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {warrantyTickets.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-mono font-semibold">{w.ticketNumber}</td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">{w.customerName}</td>
                    <td className="py-3 px-3 text-slate-500">{w.modelName}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{w.serialNumber}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Module</th>
                  <th className="py-3 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">{log.userName}</td>
                    <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400">{log.action}</td>
                    <td className="py-3 px-3 text-slate-500">{log.module}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
