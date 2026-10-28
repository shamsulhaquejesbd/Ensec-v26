import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';

export const FinanceCashBookModule: React.FC = () => {
  const { cashBook, addCashBookEntry } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [voucherNo, setVoucherNo] = useState(`VOUCH-${Date.now().toString().slice(-4)}`);
  const [accountType, setAccountType] = useState('Eastern Bank PLC (Current A/C)');
  const [transactionCategory, setTransactionCategory] = useState('Dealer Collection');
  const [description, setDescription] = useState('');
  const [cashInBDT, setCashInBDT] = useState<number>(0);
  const [cashOutBDT, setCashOutBDT] = useState<number>(0);

  const totalIn = cashBook.reduce((acc, c) => acc + (c.cashInBDT || 0), 0);
  const totalOut = cashBook.reduce((acc, c) => acc + (c.cashOutBDT || 0), 0);
  const netBalance = totalIn - totalOut;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addCashBookEntry({
      date: new Date().toISOString().slice(0, 10),
      voucherNo,
      accountType,
      transactionCategory,
      description,
      reference: voucherNo,
      cashInBDT,
      cashOutBDT,
    });
    setShowModal(false);
  };

  const filtered = cashBook.filter(
    (c) =>
      c.voucherNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.accountType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Finance & Daily Cash Book Ledger
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Eastern Bank PLC, City Bank operating accounts, factory petty cash receipts, and disbursements.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Post Ledger Voucher</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400">Total Cash Inflows</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ৳{totalIn.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Dealer Collections & Sales</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400">Total Disbursements</div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            ৳{totalOut.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">SCM LC, Factory Bills & Payroll</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400">Net Operating Position</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ৳{netBalance.toLocaleString()}
          </div>
          <div className="text-[11px] text-teal-600 font-medium mt-1">Reconciled with Eastern Bank</div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search voucher, description, or account..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-3">Date & Voucher #</th>
                <th className="py-3 px-3">Account / Head</th>
                <th className="py-3 px-3">Category & Details</th>
                <th className="py-3 px-3 text-right">Cash In (Credit)</th>
                <th className="py-3 px-3 text-right">Cash Out (Debit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white font-mono">
                    <div>{entry.voucherNo}</div>
                    <span className="text-[10px] text-slate-400">{entry.date}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                    {entry.accountType}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{entry.transactionCategory}</div>
                    <div className="text-[11px] text-slate-400">{entry.description}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {entry.cashInBDT ? `৳${entry.cashInBDT.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                    {entry.cashOutBDT ? `৳${entry.cashOutBDT.toLocaleString()}` : '-'}
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
