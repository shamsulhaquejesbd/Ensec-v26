import React, { useState, useMemo } from 'react';
import {
  Search,
  Edit,
  RotateCcw,
  Save,
  FileSpreadsheet,
  FileText,
  Printer,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { Bank } from '../../types/erp.ts';

export const BankListPage: React.FC = () => {
  const { banks, addBank, updateBank, deleteBank } = useERP();

  // View state: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');

  // Filter states
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'All' | 'Inactive'>('Active');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected bank for editing
  const [editingBank, setEditingBank] = useState<Bank | null>(null);

  // Form states matching screenshot 2
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formNativeName, setFormNativeName] = useState('');
  const [formAccountNo, setFormAccountNo] = useState('');
  const [formBranchName, setFormBranchName] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Calculate Last Code from existing banks
  const lastCode = useMemo(() => {
    if (banks.length === 0) return 'Bank-0';
    // Look for Bank-X format
    const numbers = banks
      .map((b) => {
        const match = b.code.match(/Bank-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    if (numbers.length === 0) return banks[0].code;
    const maxNum = Math.max(...numbers);
    return `Bank-${maxNum}`;
  }, [banks]);

  // Compute Next Suggested Code
  const getNextSuggestedCode = () => {
    const numbers = banks
      .map((b) => {
        const match = b.code.match(/Bank-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 13;
    return `Bank-${maxNum + 1}`;
  };

  // Open Create View
  const handleOpenCreate = () => {
    setEditingBank(null);
    setFormCode(getNextSuggestedCode());
    setFormName('');
    setFormNativeName('');
    setFormAccountNo('');
    setFormBranchName('');
    setFormIsActive(true);
    setFormError('');
    setViewMode('create');
  };

  // Open Edit View
  const handleOpenEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormCode(bank.code);
    setFormName(bank.name);
    setFormNativeName(bank.nativeName || '');
    setFormAccountNo(bank.accountNo);
    setFormBranchName(bank.branchName);
    setFormIsActive(bank.isActive);
    setFormError('');
    setViewMode('edit');
  };

  // Reset form
  const handleResetForm = () => {
    if (editingBank) {
      setFormCode(editingBank.code);
      setFormName(editingBank.name);
      setFormNativeName(editingBank.nativeName || '');
      setFormAccountNo(editingBank.accountNo);
      setFormBranchName(editingBank.branchName);
      setFormIsActive(editingBank.isActive);
    } else {
      setFormCode(getNextSuggestedCode());
      setFormName('');
      setFormNativeName('');
      setFormAccountNo('');
      setFormBranchName('');
      setFormIsActive(true);
    }
    setFormError('');
  };

  // Save Form (Create or Edit)
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formCode.trim()) {
      setFormError('Code is required');
      return;
    }
    if (!formName.trim()) {
      setFormError('Name is required');
      return;
    }
    if (!formAccountNo.trim()) {
      setFormError('Account No is required');
      return;
    }
    if (!formBranchName.trim()) {
      setFormError('Branch Name is required');
      return;
    }

    if (editingBank) {
      updateBank(editingBank.id, {
        code: formCode.trim(),
        name: formName.trim(),
        nativeName: formNativeName.trim(),
        accountNo: formAccountNo.trim(),
        branchName: formBranchName.trim(),
        isActive: formIsActive,
      });
      setNotification(`Bank account ${formCode} updated successfully.`);
    } else {
      addBank({
        code: formCode.trim(),
        name: formName.trim(),
        nativeName: formNativeName.trim(),
        accountNo: formAccountNo.trim(),
        branchName: formBranchName.trim(),
        isActive: formIsActive,
        createdAt: new Date().toISOString().split('T')[0],
      });
      setNotification(`Bank account ${formCode} created successfully.`);
    }

    setTimeout(() => setNotification(null), 3000);
    setViewMode('list');
  };

  // Filtered Banks
  const filteredBanks = useMemo(() => {
    return banks.filter((bank) => {
      const q = searchName.toLowerCase().trim();
      const matchesName =
        !q ||
        bank.name.toLowerCase().includes(q) ||
        bank.code.toLowerCase().includes(q) ||
        bank.accountNo.toLowerCase().includes(q) ||
        bank.branchName.toLowerCase().includes(q) ||
        (bank.nativeName && bank.nativeName.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Active'
          ? bank.isActive
          : !bank.isActive;

      return matchesName && matchesStatus;
    });
  }, [banks, searchName, statusFilter]);

  // Paginated banks
  const totalPages = Math.ceil(filteredBanks.length / pageSize) || 1;
  const paginatedBanks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBanks.slice(start, start + pageSize);
  }, [filteredBanks, currentPage, pageSize]);

  // Export to CSV/Excel
  const handleExportExcel = () => {
    const headers = ['CODE', 'BANKNAME', 'ACCOUNT NO', 'BRANCHNAME', 'ACTIVE', 'NATIVE NAME'];
    const rows = filteredBanks.map((b) => [
      `"${b.code}"`,
      `"${b.name}"`,
      `"${b.accountNo}"`,
      `"${b.branchName}"`,
      b.isActive ? 'Yes' : 'No',
      `"${b.nativeName || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bank_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF / Print
  const handlePrintOrPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: BANK LIST (Screenshot 1)                                            */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Top Bar: Bank List Title and Create New Bank Button */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <h1 className="text-xl sm:text-2xl font-normal text-[#0284c7] dark:text-sky-400">
              Bank List
            </h1>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 border border-[#0284c7] text-[#0284c7] hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg text-sm font-normal transition-colors cursor-pointer"
            >
              Create New Bank
            </button>
          </div>

          {/* Filter Bar: Bank Name, Status, XLS, PDF, Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6">
                {/* Bank Name Input */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-[#0284c7] dark:text-sky-400 whitespace-nowrap">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Name"
                    value={searchName}
                    onChange={(e) => {
                      setSearchName(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-1.5 text-sm w-64 md:w-96 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                  />
                </div>

                {/* Status Dropdown */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-[#0284c7] dark:text-sky-400 whitespace-nowrap">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md px-3 py-1.5 text-sm min-w-[110px] focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                  >
                    <option value="Active">Active</option>
                    <option value="All">All</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Right Export Buttons & Preview */}
              <div className="flex items-center gap-2.5 self-end lg:self-center">
                {/* XLS Icon */}
                <button
                  onClick={handleExportExcel}
                  title="Export to Excel"
                  className="p-1 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="w-8 h-8 rounded border border-emerald-600 bg-emerald-50 dark:bg-emerald-950 flex flex-col items-center justify-center text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                    <span className="leading-tight">XLS</span>
                  </div>
                </button>

                {/* PDF Icon */}
                <button
                  onClick={handlePrintOrPdf}
                  title="Export / Print PDF"
                  className="p-1 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="w-8 h-8 rounded border border-rose-600 bg-rose-50 dark:bg-rose-950 flex flex-col items-center justify-center text-[9px] font-bold text-rose-700 dark:text-rose-300">
                    <span className="leading-tight">PDF</span>
                  </div>
                </button>

                {/* Preview Button */}
                <button
                  onClick={() => setShowPreviewModal(true)}
                  className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-4 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-normal shadow-xs transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#dce9f5] dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold text-[#0284c7] dark:text-sky-300">CODE</th>
                    <th className="py-2.5 px-4 font-semibold text-[#0284c7] dark:text-sky-300">BANKNAME</th>
                    <th className="py-2.5 px-4 font-semibold text-[#0284c7] dark:text-sky-300">ACCOUNT NO</th>
                    <th className="py-2.5 px-4 font-semibold text-[#0284c7] dark:text-sky-300">BRANCHNAME</th>
                    <th className="py-2.5 px-4 font-semibold text-[#0284c7] dark:text-sky-300">ACTIVE</th>
                    <th className="py-2.5 px-4 font-semibold text-[#0284c7] dark:text-sky-300 text-center w-20">EDIT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedBanks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No bank accounts found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedBanks.map((bank) => (
                      <tr
                        key={bank.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-slate-700 dark:text-slate-300"
                      >
                        <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {bank.code}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {bank.name}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {bank.accountNo}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                          {bank.branchName}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                          {bank.isActive ? 'Yes' : 'No'}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => handleOpenEdit(bank)}
                            className="w-7 h-7 inline-flex items-center justify-center rounded bg-[#00a8e8] hover:bg-[#0094cc] text-white shadow-xs transition-colors cursor-pointer"
                            title="Edit Bank"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer: Total Count & Pagination */}
            <div className="p-3 px-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <div>Total: {filteredBanks.length}</div>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-6 h-6 rounded flex items-center justify-center font-medium ${
                      currentPage === idx + 1
                        ? 'bg-[#0284c7] text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: CREATE / EDIT BANK (Screenshot 2)                                   */}
      {/* ========================================================================= */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="space-y-4">
          {/* Top Bar: Title */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <h1 className="text-xl sm:text-2xl font-normal text-[#0284c7] dark:text-sky-400">
              {viewMode === 'create' ? 'Create Bank' : 'Edit Bank'}
            </h1>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {/* ----------------- LEFT COLUMN ----------------- */}
                <div className="space-y-6">
                  {/* Code */}
                  <div>
                    <label className="block text-sm font-medium text-[#0284c7] dark:text-sky-400 mb-1">
                      Code<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Code"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                    />
                    <div className="text-[11px] text-slate-400 mt-1">
                      Last Code: {lastCode}
                    </div>
                  </div>

                  {/* Native Name */}
                  <div>
                    <label className="block text-sm font-medium text-[#0284c7] dark:text-sky-400 mb-1">
                      Native Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Please provide title"
                      value={formNativeName}
                      onChange={(e) => setFormNativeName(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                    />
                  </div>

                  {/* Branch Name */}
                  <div>
                    <label className="block text-sm font-medium text-[#0284c7] dark:text-sky-400 mb-1">
                      Branch Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Please provide title"
                      value={formBranchName}
                      onChange={(e) => setFormBranchName(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                    />
                  </div>
                </div>

                {/* ----------------- RIGHT COLUMN ----------------- */}
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-[#0284c7] dark:text-sky-400 mb-1">
                      Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Please provide title"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                    />
                  </div>

                  {/* Account No */}
                  <div>
                    <label className="block text-sm font-medium text-[#0284c7] dark:text-sky-400 mb-1">
                      Account No<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Please provide title"
                      value={formAccountNo}
                      onChange={(e) => setFormAccountNo(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                    />
                  </div>

                  {/* Is Active Checkbox */}
                  <div className="pt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="rounded border-slate-300 text-[#0284c7] focus:ring-[#0284c7] w-4 h-4 cursor-pointer"
                      />
                      <span className="text-slate-800 dark:text-slate-200">Is Active</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Back to List, Reset, Save */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-4 py-2 border border-[#0284c7] text-[#0284c7] hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg text-sm font-normal transition-colors cursor-pointer"
                >
                  Back to List
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 border border-[#0284c7] text-[#0284c7] hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg text-sm font-normal transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREVIEW MODAL (When clicking Preview in Filter bar)                        */}
      {/* ========================================================================= */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-[#0284c7]">
                  Bank Accounts Print &amp; Report Preview
                </h3>
                <span className="text-xs bg-sky-100 text-[#0284c7] px-2 py-0.5 rounded">
                  {filteredBanks.length} Record(s)
                </span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">ENSEC OPTIMUM ENERGY LIMITED</h2>
                <p className="text-xs text-slate-500">Corporate Banking &amp; Disbursement Account Registry</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Filter: Status = {statusFilter} | Generated: {new Date().toLocaleDateString()}</p>
              </div>

              <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-700">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b">
                    <th className="p-2 border-r">Code</th>
                    <th className="p-2 border-r">Bank Name</th>
                    <th className="p-2 border-r">Account No</th>
                    <th className="p-2 border-r">Branch Name</th>
                    <th className="p-2 border-r">Native Name</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredBanks.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2 border-r font-mono font-medium">{b.code}</td>
                      <td className="p-2 border-r font-semibold">{b.name}</td>
                      <td className="p-2 border-r font-mono">{b.accountNo}</td>
                      <td className="p-2 border-r">{b.branchName}</td>
                      <td className="p-2 border-r text-slate-500">{b.nativeName || '-'}</td>
                      <td className="p-2">{b.isActive ? 'Active' : 'Inactive'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={handlePrintOrPdf}
                className="px-4 py-2 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
