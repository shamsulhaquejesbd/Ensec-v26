import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Users,
  Download,
  Calendar,
  Building,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';

export const PayrollModule: React.FC = () => {
  const { payrollRecords, generateMonthlyPayroll } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('October 2026');

  const totalNet = payrollRecords.reduce((acc, p) => acc + (p.netPayableBDT || 0), 0);

  const filtered = payrollRecords.filter(
    (p) =>
      p.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.designation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Factory & Field Force Payroll Disbursement
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated salary calculations, sales target incentive multipliers, and bank salary advice sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => generateMonthlyPayroll(selectedMonth)}
            className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition"
          >
            <Clock className="w-4 h-4" />
            <span>Process {selectedMonth} Payroll</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400">Total Employees on Payroll</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {payrollRecords.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Factory + Field Force + Mgt</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400">Net Monthly Salary Outlay</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ৳{totalNet.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Ready for Eastern Bank EFT</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400">Disbursement Status</div>
          <div className="text-2xl font-black text-blue-600 mt-1">Approved</div>
          <div className="text-[11px] text-slate-400 mt-1">Managing Director Signed Off</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee name or designation..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-3">Employee Name</th>
                <th className="py-3 px-3">Designation</th>
                <th className="py-3 px-3 text-right">Basic Salary</th>
                <th className="py-3 px-3 text-right">Allowances</th>
                <th className="py-3 px-3 text-right">Incentive</th>
                <th className="py-3 px-3 text-right">Net Payable</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((pr) => (
                <tr key={pr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                    <div>{pr.employeeName}</div>
                    <span className="text-[10px] text-slate-400 font-mono">{pr.monthYear}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{pr.designation}</td>
                  <td className="py-3 px-3 text-right font-mono">৳{pr.basicSalaryBDT?.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono">
                    ৳{((pr.houseRentBDT || 0) + (pr.medicalAllowanceBDT || 0)).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600 font-bold">
                    {pr.salesIncentiveBDT ? `৳${pr.salesIncentiveBDT.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ৳{pr.netPayableBDT?.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                      {pr.status || 'Processed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
