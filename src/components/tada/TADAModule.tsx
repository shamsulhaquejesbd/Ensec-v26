import React, { useState, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  Calendar,
  Building2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Save,
  Car,
  ShieldCheck,
  Filter,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  MapPin,
  Sliders,
  Send,
  Upload,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { TADAEntry, TADAStatus, FieldForceRep } from '../../types/erp.ts';

export const TADAModule: React.FC = () => {
  const {
    tadaList,
    addTADA,
    updateTADA,
    approveTADA,
    batchApproveTADA,
    rejectTADA,
    deleteTADA,
    fieldForceReps,
    users,
    distributors,
    currentUser,
  } = useERP();

  // Search & Filter state matching screenshot
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedRepFilter, setSelectedRepFilter] = useState<string>('All');
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showBatchApproveModal, setShowBatchApproveModal] = useState<boolean>(false);
  const [viewClaimModal, setViewClaimModal] = useState<TADAEntry | null>(null);
  const [rejectClaimModal, setRejectClaimModal] = useState<TADAEntry | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Create Form State
  const [formTranDate, setFormTranDate] = useState<string>('2026-10-11');
  const [formDistributorName, setFormDistributorName] = useState<string>('ACI Logistics Ltd');
  const [formRouteName, setFormRouteName] = useState<string>('Shwapno');
  const [formFromAddress, setFormFromAddress] = useState<string>('Mirpur 1');
  const [formToAddress, setFormToAddress] = useState<string>('Mirpur 10 Shawpno');
  const [formMode, setFormMode] = useState<string>('Bus');
  const [formDistance, setFormDistance] = useState<number>(6);
  const [formFareAmount, setFormFareAmount] = useState<number>(20);
  const [formDailyAllowance, setFormDailyAllowance] = useState<number>(0);
  const [formHotelAllowance, setFormHotelAllowance] = useState<number>(0);
  const [formMiscAllowance, setFormMiscAllowance] = useState<number>(0);
  const [formAmount, setFormAmount] = useState<number>(20);
  const [formReceiptFileName, setFormReceiptFileName] = useState<string>('');
  const [formRemarks, setFormRemarks] = useState<string>('visit');
  const [formError, setFormError] = useState<string>('');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string>('');

  // Rate policy defaults
  const RATE_PER_KM: { [mode: string]: number } = {
    Bus: 3.5,
    Rickshaw: 7.0,
    'Own DA': 25.0,
    Motorcycle: 5.5,
    CNG: 8.0,
    Train: 2.5,
  };

  // Active user / rep for submitting claims
  const activeRep = useMemo(() => {
    return (
      fieldForceReps.find(
        (r) =>
          r.name.toLowerCase() === currentUser.name?.toLowerCase() ||
          r.code === currentUser.id ||
          (currentUser.phone && r.phone === currentUser.phone)
      ) ||
      fieldForceReps.find((r) => r.code === 'MEL00445') ||
      fieldForceReps[0] ||
      null
    );
  }, [currentUser, fieldForceReps]);

  // Recalculate estimated amount when mode or distance changes
  const handleModeOrDistanceChange = (newMode: string, newDist: number) => {
    setFormMode(newMode);
    setFormDistance(newDist);
    let calculatedFare = 20;
    if (newMode === 'Own DA') {
      calculatedFare = 150;
    } else {
      const rate = RATE_PER_KM[newMode] || 5;
      calculatedFare = Math.max(10, Math.round(newDist * rate));
    }
    setFormFareAmount(calculatedFare);
    setFormAmount(calculatedFare + formDailyAllowance + formHotelAllowance + formMiscAllowance);
  };

  const handleBreakdownChange = (
    fare: number,
    da: number,
    hotel: number,
    misc: number
  ) => {
    setFormFareAmount(fare);
    setFormDailyAllowance(da);
    setFormHotelAllowance(hotel);
    setFormMiscAllowance(misc);
    setFormAmount(fare + da + hotel + misc);
  };

  // Filtered claims matching search and status
  const filteredClaims = useMemo(() => {
    return tadaList.filter((claim) => {
      // Status filter
      if (statusFilter !== 'All' && claim.status !== statusFilter) {
        return false;
      }
      // Rep filter
      if (selectedRepFilter !== 'All' && claim.ffCode !== selectedRepFilter && claim.ffName !== selectedRepFilter) {
        return false;
      }
      // Search filter: Code, Parent market name, Distributor, Route, Addresses
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = claim.ffCode.toLowerCase().includes(q);
        const matchName = claim.ffName.toLowerCase().includes(q);
        const matchDist = claim.distributorName.toLowerCase().includes(q);
        const matchRoute = claim.routeName.toLowerCase().includes(q);
        const matchFrom = claim.fromAddress.toLowerCase().includes(q);
        const matchTo = claim.toAddress.toLowerCase().includes(q);
        const matchApprover = claim.approverName ? claim.approverName.toLowerCase().includes(q) : false;
        if (!matchCode && !matchName && !matchDist && !matchRoute && !matchFrom && !matchTo && !matchApprover) {
          return false;
        }
      }
      return true;
    });
  }, [tadaList, statusFilter, selectedRepFilter, searchTerm]);

  // Stats for KPI Cards
  const totalClaimsCount = tadaList.length;
  const totalClaimedBDT = tadaList.reduce((sum, c) => sum + c.amount, 0);
  const pendingClaimsList = tadaList.filter((c) => c.status === 'Pending_HOS_Approval');
  const pendingClaimsCount = pendingClaimsList.length;
  const pendingAmountBDT = pendingClaimsList.reduce((sum, c) => sum + c.amount, 0);
  const approvedClaimsList = tadaList.filter((c) => c.status === 'Approved');
  const approvedClaimsCount = approvedClaimsList.length;
  const approvedAmountBDT = approvedClaimsList.reduce((sum, c) => sum + c.amount, 0);
  const rejectedClaimsCount = tadaList.filter((c) => c.status === 'Rejected').length;

  // Pagination
  const totalItems = filteredClaims.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedClaims = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClaims.slice(start, start + itemsPerPage);
  }, [filteredClaims, currentPage]);

  // Handle Quick Approve single claim
  const handleQuickApproveClaim = (claim: TADAEntry) => {
    approveTADA(claim.id, currentUser.name || claim.approverName || 'Super Admin');
    setFormSuccessMessage(`Approved TADA claim for ${claim.ffName} (৳ ${claim.amount})`);
    setTimeout(() => setFormSuccessMessage(''), 2000);
  };

  // Handle Confirm Reject single claim
  const handleConfirmRejectClaim = () => {
    if (!rejectClaimModal) return;
    rejectTADA(rejectClaimModal.id, rejectReason.trim() || 'Disallowed expense per company travel policy');
    setFormSuccessMessage(`Rejected TADA claim for ${rejectClaimModal.ffName}`);
    setRejectClaimModal(null);
    setRejectReason('');
    setTimeout(() => setFormSuccessMessage(''), 2000);
  };

  // Handle Create TADA
  const handleSaveTada = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formFromAddress || !formToAddress) {
      setFormError('Please enter both origin and destination addresses.');
      return;
    }

    if (formAmount <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    const rep = activeRep;
    const ffCode = rep ? rep.code : 'MEL00445';
    const ffName = rep ? rep.name : 'Fazleh Rabbi (Dhaka)';

    // Check if field force rep has an approver tagged by Super Admin
    const approverName = rep?.tadaApproverName || 'Tanvir Hossain (Sales Head)';
    const approverId = rep?.tadaApproverId || 'u-2';

    addTADA({
      ffCode,
      ffName,
      ffId: rep?.id,
      tranDate: formTranDate,
      distributorName: formDistributorName,
      routeName: formRouteName,
      fromAddress: formFromAddress,
      toAddress: formToAddress,
      mode: formMode,
      distance: Number(formDistance),
      amount: Number(formAmount),
      status: 'Pending_HOS_Approval',
      approverId,
      approverName,
      remarks: formRemarks || 'visit',
    });

    setFormSuccessMessage(`TADA claim of ৳ ${formAmount} submitted successfully. Assigned to Approver: ${approverName}.`);
    setTimeout(() => {
      setFormSuccessMessage('');
      setShowCreateModal(false);
      // Reset form
      setFormFromAddress('');
      setFormToAddress('');
      setFormRemarks('visit');
      setFormReceiptFileName('');
    }, 1200);
  };

  // Select all pending claims for batch approval
  const handleSelectAllPending = () => {
    const pendingIds = paginatedClaims.filter((c) => c.status === 'Pending_HOS_Approval').map((c) => c.id);
    if (selectedClaims.length === pendingIds.length && pendingIds.length > 0) {
      setSelectedClaims([]);
    } else {
      setSelectedClaims(pendingIds);
    }
  };

  // Toggle individual claim selection
  const handleToggleSelectClaim = (id: string) => {
    setSelectedClaims((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Batch approve
  const handleConfirmBatchApprove = () => {
    const approver = currentUser.name || 'Raju Ahammad (HO)';
    const idsToApprove = selectedClaims.length > 0 ? selectedClaims : tadaList.filter((c) => c.status === 'Pending_HOS_Approval').map((c) => c.id);
    batchApproveTADA(idsToApprove, approver);
    setSelectedClaims([]);
    setShowBatchApproveModal(false);
    setFormSuccessMessage(`Approved ${idsToApprove.length} TADA claims.`);
    setTimeout(() => setFormSuccessMessage(''), 2000);
  };

  // Export to CSV/Excel
  const handleExportXLS = () => {
    const headers = [
      'FF CODE',
      'FF NAME',
      'TRAN DATE',
      'DISTRIBUTOR NAME',
      'ROUTE NAME',
      'FROM ADDRESS',
      'TO ADDRESS',
      'MODE',
      'DISTANCE',
      'AMOUNT',
      'STATUS',
      'APPROVER NAME',
      'REMARKS',
      'LAST MODIFIED',
    ];

    const rows = filteredClaims.map((c) => [
      `"${c.ffCode}"`,
      `"${c.ffName}"`,
      `"${c.tranDate}"`,
      `"${c.distributorName}"`,
      `"${c.routeName}"`,
      `"${c.fromAddress}"`,
      `"${c.toAddress}"`,
      `"${c.mode}"`,
      c.distance,
      c.amount,
      `"${c.status}"`,
      `"${c.approverName || ''}"`,
      `"${c.remarks || ''}"`,
      `"${c.lastModified || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tada_list_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* SUCCESS BANNER */}
      {formSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{formSuccessMessage}</span>
        </div>
      )}

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Total TADA Claims</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            ৳ {totalClaimedBDT.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {totalClaimsCount} total claims filed
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Approval</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            ৳ {pendingAmountBDT.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 font-medium">
            {pendingClaimsCount} claims awaiting tagged approver
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Amount</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            ৳ {approvedAmountBDT.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 font-medium">
            {approvedClaimsCount} claims sanctioned
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Disallowed / Rejected</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {rejectedClaimsCount} Claims
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium">
            Audit disallowed expense
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER MATCHING SCREENSHOT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-sky-700 dark:text-sky-400">TADA List</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Field Force Travel Allowance & Daily Allowance Claims, Transport Routes & Approvals
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Create TADA</span>
            </button>

            {/* Approve Button matching Screenshot at top right */}
            <button
              onClick={() => setShowBatchApproveModal(true)}
              className="px-4 py-1.5 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 font-semibold text-xs transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve</span>
            </button>
          </div>
        </div>

        {/* Filter Bar matching Screenshot */}
        <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
            {/* Search input: "Enter Code, Parent market name" */}
            <div className="md:col-span-7 flex items-center gap-2">
              <span className="font-semibold text-sky-700 dark:text-sky-400 shrink-0 w-14">Search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Enter Code, Parent market name"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Status Dropdown */}
            <div className="md:col-span-3 flex items-center gap-2">
              <span className="font-semibold text-sky-700 dark:text-sky-400 shrink-0 w-12">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">All</option>
                <option value="Pending_HOS_Approval">Pending_HOS_Approval</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Action Buttons: XLS, Preview */}
            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <button
                onClick={handleExportXLS}
                title="Export to XLS / CSV"
                className="p-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>XLS</span>
              </button>

              <button
                onClick={() => setCurrentPage(1)}
                className="p-1 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Area (Exact Columns from Screenshot) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-sky-50/70 dark:bg-slate-800 text-sky-800 dark:text-sky-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <th className="p-3 font-mono whitespace-nowrap">FF CODE</th>
                <th className="p-3 whitespace-nowrap">FF NAME</th>
                <th className="p-3 whitespace-nowrap">TRAN DATE</th>
                <th className="p-3 whitespace-nowrap">DISTRIBUTOR NAME</th>
                <th className="p-3 whitespace-nowrap">ROUTE NAME</th>
                <th className="p-3 whitespace-nowrap">FROM ADDRESS</th>
                <th className="p-3 whitespace-nowrap">TO ADDRESS</th>
                <th className="p-3 whitespace-nowrap">MODE</th>
                <th className="p-3 text-right whitespace-nowrap">DISTANCE</th>
                <th className="p-3 text-right whitespace-nowrap">AMOUNT</th>
                <th className="p-3 whitespace-nowrap">STATUS</th>
                <th className="p-3 whitespace-nowrap">APPROVER NAME</th>
                <th className="p-3 whitespace-nowrap">REMARKS</th>
                <th className="p-3 whitespace-nowrap">LAST MODIFIED</th>
                <th className="p-3 text-center whitespace-nowrap">EDIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium whitespace-nowrap">
              {paginatedClaims.length === 0 ? (
                <tr>
                  <td colSpan={15} className="p-8 text-center text-slate-400 whitespace-nowrap">
                    No TADA records found matching the query.
                  </td>
                </tr>
              ) : (
                paginatedClaims.map((claim) => {
                  const isPending = claim.status === 'Pending_HOS_Approval';
                  const isApproved = claim.status === 'Approved';
                  const isRejected = claim.status === 'Rejected';

                  return (
                    <tr
                      key={claim.id}
                      className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors whitespace-nowrap"
                    >
                      {/* FF CODE */}
                      <td className="p-2.5 font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {claim.ffCode}
                      </td>

                      {/* FF NAME */}
                      <td className="p-2.5 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {claim.ffName}
                      </td>

                      {/* TRAN DATE */}
                      <td className="p-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {claim.tranDate}
                      </td>

                      {/* DISTRIBUTOR NAME */}
                      <td className="p-2.5 text-slate-800 dark:text-slate-200 whitespace-nowrap font-medium">
                        {claim.distributorName}
                      </td>

                      {/* ROUTE NAME */}
                      <td className="p-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {claim.routeName}
                      </td>

                      {/* FROM ADDRESS */}
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {claim.fromAddress}
                      </td>

                      {/* TO ADDRESS */}
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {claim.toAddress}
                      </td>

                      {/* MODE */}
                      <td className="p-2.5 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {claim.mode}
                        </span>
                      </td>

                      {/* DISTANCE */}
                      <td className="p-2.5 font-mono text-right text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {claim.distance}
                      </td>

                      {/* AMOUNT */}
                      <td className="p-2.5 font-mono text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {claim.amount}
                      </td>

                      {/* STATUS */}
                      <td className="p-2.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {claim.status}
                        </span>
                      </td>

                      {/* APPROVER NAME */}
                      <td className="p-2.5 whitespace-nowrap text-[11px] text-slate-700 dark:text-slate-300">
                        {claim.approverName ? (
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-medium text-slate-900 dark:text-white whitespace-nowrap">{claim.approverName}</span>
                            {claim.approvedAt && (
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">({claim.approvedAt})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic whitespace-nowrap">Not Tagged</span>
                        )}
                      </td>

                      {/* REMARKS */}
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {claim.remarks || '-'}
                      </td>

                      {/* LAST MODIFIED */}
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap text-[11px]">
                        {claim.lastModified || '-'}
                      </td>

                      {/* ACTIONS */}
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleQuickApproveClaim(claim)}
                                title="Quick Approve Claim"
                                className="w-6 h-6 rounded inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setRejectClaimModal(claim);
                                  setRejectReason('');
                                }}
                                title="Reject Claim"
                                className="w-6 h-6 rounded inline-flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setViewClaimModal(claim)}
                            title="View Voucher Details"
                            className="w-6 h-6 rounded inline-flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white shadow-2xs transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Bar: Total count & Pagination */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Total: <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> claims
          </div>

          {/* Pagination Controls matching Screenshot: < 1 2 3 4 5 > */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg)}
                className={`w-7 h-7 rounded text-xs font-semibold ${
                  currentPage === pg
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                {pg}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE TADA CLAIM                                                 */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-sky-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300">
                <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-base">Submit Field TADA Claim</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTada} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}



              {/* Transaction Date & Distributor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Date*
                  </label>
                  <input
                    type="date"
                    required
                    value={formTranDate}
                    onChange={(e) => setFormTranDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Distributor / Customer / Shop
                  </label>
                  <input
                    type="text"
                    required
                    value={formDistributorName}
                    onChange={(e) => setFormDistributorName(e.target.value)}
                    placeholder="e.g. ACI Logistics Ltd"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Route Name */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tour Route / Beat Name*
                </label>
                <input
                  type="text"
                  required
                  value={formRouteName}
                  onChange={(e) => setFormRouteName(e.target.value)}
                  placeholder="e.g. Shwapno Mirpur Route / Wholesale Market"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* From Address & To Address */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Origin Address (From)*
                  </label>
                  <input
                    type="text"
                    required
                    value={formFromAddress}
                    onChange={(e) => setFormFromAddress(e.target.value)}
                    placeholder="e.g. Mirpur 1 Base"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <div className="flex gap-1 mt-1">
                    {['Head Office', 'Mirpur Hub', 'Uttara Depot'].map((hub) => (
                      <button
                        key={hub}
                        type="button"
                        onClick={() => setFormFromAddress(hub)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      >
                        {hub}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destination Address (To)*
                  </label>
                  <input
                    type="text"
                    required
                    value={formToAddress}
                    onChange={(e) => setFormToAddress(e.target.value)}
                    placeholder="e.g. Mirpur 10 Shawpno"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <div className="flex gap-1 mt-1">
                    {['Mirpur 10', 'Agrabad Branch', 'Savar Market'].map((dest) => (
                      <button
                        key={dest}
                        type="button"
                        onClick={() => setFormToAddress(dest)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      >
                        {dest}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Travel Mode & Distance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transport Mode
                  </label>
                  <select
                    value={formMode}
                    onChange={(e) => handleModeOrDistanceChange(e.target.value, formDistance)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="Bus">Bus</option>
                    <option value="Rickshaw">Rickshaw</option>
                    <option value="Own DA">Own DA</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="CNG">CNG Auto</option>
                    <option value="Train">Train</option>
                    <option value="Car">Car / Taxi</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Distance (Km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formDistance}
                    onChange={(e) => handleModeOrDistanceChange(formMode, Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Itemized Allowance Breakdown */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
                  Itemized Allowance Breakdown (BDT)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Conveyance / Fare</label>
                    <input
                      type="number"
                      min="0"
                      value={formFareAmount}
                      onChange={(e) => handleBreakdownChange(Number(e.target.value), formDailyAllowance, formHotelAllowance, formMiscAllowance)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Daily Allowance (DA)</label>
                    <input
                      type="number"
                      min="0"
                      value={formDailyAllowance}
                      onChange={(e) => handleBreakdownChange(formFareAmount, Number(e.target.value), formHotelAllowance, formMiscAllowance)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Hotel / Lodging</label>
                    <input
                      type="number"
                      min="0"
                      value={formHotelAllowance}
                      onChange={(e) => handleBreakdownChange(formFareAmount, formDailyAllowance, Number(e.target.value), formMiscAllowance)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Misc / Parking</label>
                    <input
                      type="number"
                      min="0"
                      value={formMiscAllowance}
                      onChange={(e) => handleBreakdownChange(formFareAmount, formDailyAllowance, formHotelAllowance, Number(e.target.value))}
                      className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-semibold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Total Claim Amount (BDT)*</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-base font-black text-blue-600 dark:text-blue-400">
                      ৳ {formAmount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tour Purpose / Remarks
                </label>
                <input
                  type="text"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="e.g. visit / client meeting / market survey / payment collection"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Supporting Voucher / Bill Upload simulation */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supporting Voucher / Bill Receipt (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-300 text-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formReceiptFileName || 'Upload Receipt / Bus Ticket / Fuel Slip (PNG, JPG, PDF)'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormReceiptFileName(file.name);
                      }}
                    />
                  </label>
                  {formReceiptFileName && (
                    <button
                      type="button"
                      onClick={() => setFormReceiptFileName('')}
                      className="p-2 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 text-xs"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Submit Claim</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BATCH APPROVE MODAL                                               */}
      {/* ========================================================================= */}
      {showBatchApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-blue-50 dark:bg-blue-950/50">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-base">Approve TADA Claims</h3>
              </div>
              <button onClick={() => setShowBatchApproveModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                You are approving pending TADA claims as <b>{currentUser.name || 'Raju Ahammad (HO)'}</b>.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block">Pending Claims:</span>
                  <span className="font-bold text-sm text-amber-600">
                    {tadaList.filter((c) => c.status === 'Pending_HOS_Approval').length} Requests
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Total Claim Amount:</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                    ৳ {tadaList.filter((c) => c.status === 'Pending_HOS_Approval').reduce((s, c) => s + c.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Once approved, records will reflect your approver signature & timestamp in the TADA audit schedule.
              </p>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/40">
              <button
                onClick={() => setShowBatchApproveModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBatchApprove}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm All Approvals</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW & EDIT CLAIM MODAL                                          */}
      {/* ========================================================================= */}
      {viewClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-sky-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  TADA Claim Voucher Details
                </h3>
              </div>
              <button onClick={() => setViewClaimModal(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">FF OFFICER</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {viewClaimModal.ffName} ({viewClaimModal.ffCode})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">STATUS</span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      viewClaimModal.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : viewClaimModal.status === 'Rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {viewClaimModal.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block">Transaction Date:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewClaimModal.tranDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Distributor:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewClaimModal.distributorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Route Name:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewClaimModal.routeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Transport Mode:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewClaimModal.mode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">From Address:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewClaimModal.fromAddress}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">To Address:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewClaimModal.toAddress}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Distance Traveled:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{viewClaimModal.distance} Km</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Claim Amount:</span>
                  <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
                    ৳ {viewClaimModal.amount}
                  </span>
                </div>
              </div>

              {/* Tagged Approver Info */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                  TAGGED APPROVER SIGNATURE
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {viewClaimModal.approverName || 'Raju Ahammad (HO)'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {viewClaimModal.approvedAt || 'Awaiting Review'}
                  </span>
                </div>
              </div>

              {viewClaimModal.remarks && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Remarks:</span>
                  <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {viewClaimModal.remarks}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/40">
              <button
                onClick={() => {
                  deleteTADA(viewClaimModal.id);
                  setViewClaimModal(null);
                }}
                className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                {viewClaimModal.status === 'Pending_HOS_Approval' && (
                  <>
                    <button
                      onClick={() => {
                        rejectTADA(viewClaimModal.id, 'Disallowed travel expense');
                        setViewClaimModal(null);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        approveTADA(viewClaimModal.id, currentUser.name || 'Raju Ahammad (HO)');
                        setViewClaimModal(null);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Claim</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setViewClaimModal(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: REJECT CLAIM MODAL */}
      {rejectClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-rose-50/70 dark:bg-rose-950/40">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-sm">Disallow / Reject TADA Claim</h3>
              </div>
              <button onClick={() => setRejectClaimModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                You are rejecting the claim of <b>৳ {rejectClaimModal.amount}</b> submitted by <b>{rejectClaimModal.ffName}</b> ({rejectClaimModal.ffCode}).
              </p>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Rejection*
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="State reason for disallowance (e.g. Ineligible transport mode, route outside assigned market, duplicate claim)..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>

              {/* Quick Reason Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'Ineligible route for beat',
                  'Exceeds standard mileage rate',
                  'Missing supporting bus voucher',
                  'Duplicate date submission',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectReason(reason)}
                    className="px-2 py-1 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    + {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/30">
              <button
                type="button"
                onClick={() => setRejectClaimModal(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectClaim}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
