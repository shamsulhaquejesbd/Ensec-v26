import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  PlusCircle,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  Calendar,
  Building2,
  Landmark,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Save,
  Upload,
  FileText,
  Printer,
  ChevronDown,
  Trash2,
  TrendingDown,
  Info,
  ShieldCheck,
  Filter,
  BarChart3,
  Receipt,
  Image as ImageIcon,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { Payment, SalesOrder, Distributor, Bank, Department, CashBookEntry } from '../../types/erp.ts';

export interface PaymentModuleProps {
  initialTab?: 'list' | 'create' | 'aging';
}

export const PaymentModule: React.FC<PaymentModuleProps> = ({ initialTab = 'list' }) => {
  const {
    payments,
    addPayment,
    updatePayment,
    approvePayment,
    rejectPayment,
    deletePayment,
    salesOrders,
    distributors,
    departments,
    banks,
    currentUser,
    currentUserHasFeature,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'aging'>(initialTab);

  // Synchronize if initialTab changes from parent
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // ==========================================
  // FILTERS STATE (Matching Image 1)
  // ==========================================
  const [filterStartDate, setFilterStartDate] = useState<string>('2026-10-11');
  const [filterEndDate, setFilterEndDate] = useState<string>('2026-10-11');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterDistributor, setFilterDistributor] = useState<string>('');
  const [filterBank, setFilterBank] = useState<string>('');
  const [filterSearchTerm, setFilterSearchTerm] = useState<string>('');

  // ==========================================
  // CREATE PAYMENT FORM STATE (Matching Image 2)
  // ==========================================
  const [formDepartment, setFormDepartment] = useState<string>('');
  const [formPaymentMode, setFormPaymentMode] = useState<string>('Bank Deposit');
  const [formChequeNoReceiptNo, setFormChequeNoReceiptNo] = useState<string>('');
  const [formBankId, setFormBankId] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');

  const [formDistributorId, setFormDistributorId] = useState<string>('');
  const [formPaymentDate, setFormPaymentDate] = useState<string>('2026-10-11');
  const [formInvoiceNo, setFormInvoiceNo] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDocumentImage, setFormDocumentImage] = useState<string>('');
  const [formDocumentImageName, setFormDocumentImageName] = useState<string>('');
  const [formAutoApprove, setFormAutoApprove] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // MODALS STATE
  // ==========================================
  const [viewPaymentModal, setViewPaymentModal] = useState<Payment | null>(null);
  const [approveModalPayment, setApproveModalPayment] = useState<Payment | null>(null);
  const [approveModalAmount, setApproveModalAmount] = useState<string>('');
  const [approveModalNotes, setApproveModalNotes] = useState<string>('');

  const [rejectModalPayment, setRejectModalPayment] = useState<Payment | null>(null);
  const [rejectModalReason, setRejectModalReason] = useState<string>('');

  // ==========================================
  // AGING CALCULATION HELPERS
  // ==========================================
  const calculateAging = (invoiceDateStr: string, asOfDateStr: string = '2026-10-11') => {
    try {
      const invDate = new Date(invoiceDateStr);
      const asOf = new Date(asOfDateStr);
      const diffTime = asOf.getTime() - invDate.getTime();
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      let bucket: 'Current (0–30 Days)' | '31–60 Days' | '61–90 Days' | '90+ Days (Overdue)' = 'Current (0–30 Days)';
      let color = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

      if (diffDays <= 30) {
        bucket = 'Current (0–30 Days)';
        color = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      } else if (diffDays <= 60) {
        bucket = '31–60 Days';
        color = 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      } else if (diffDays <= 90) {
        bucket = '61–90 Days';
        color = 'text-orange-700 bg-orange-50 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      } else {
        bucket = '90+ Days (Overdue)';
        color = 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      }

      return { diffDays, bucket, color };
    } catch {
      return {
        diffDays: 0,
        bucket: 'Current (0–30 Days)' as const,
        color: 'text-slate-600 bg-slate-100',
      };
    }
  };

  // Due Invoices List across the system
  const dueInvoices = useMemo(() => {
    return salesOrders
      .filter((so) => so.dueAmountBDT > 0 || so.status === 'Invoiced' || so.status === 'Dispatched')
      .map((so) => {
        const invNo = so.invoiceNo || so.orderNumber;
        const aging = calculateAging(so.date, formPaymentDate || '2026-10-11');
        return {
          ...so,
          invoiceNumber: invNo,
          agingDays: aging.diffDays,
          agingBucket: aging.bucket,
          agingColor: aging.color,
        };
      })
      .sort((a, b) => b.agingDays - a.agingDays); // Show oldest due first for FIFO settlement!
  }, [salesOrders, formPaymentDate]);

  // Due Invoices filtered by selected distributor
  const availableInvoicesForSelectedDistributor = useMemo(() => {
    if (!formDistributorId) {
      return dueInvoices;
    }
    const dist = distributors.find((d) => d.id === formDistributorId || d.name === formDistributorId);
    return dueInvoices.filter((inv) => {
      if (inv.distributorId && inv.distributorId === formDistributorId) return true;
      if (dist && inv.distributorName && inv.distributorName.toLowerCase() === dist.name.toLowerCase()) return true;
      if (dist && inv.customerName && inv.customerName.toLowerCase() === dist.name.toLowerCase()) return true;
      return false;
    });
  }, [dueInvoices, formDistributorId, distributors]);

  // Currently selected invoice detail
  const selectedInvoiceDetail = useMemo(() => {
    if (!formInvoiceNo) return null;
    return dueInvoices.find(
      (inv) => inv.invoiceNumber === formInvoiceNo || inv.orderNumber === formInvoiceNo || inv.id === formInvoiceNo
    );
  }, [dueInvoices, formInvoiceNo]);

  // Handle Distributor Change in Form
  const handleDistributorChange = (distId: string) => {
    setFormDistributorId(distId);
    const dist = distributors.find((d) => d.id === distId);

    // Auto set department if tagged to distributor
    if (dist && dist.departments && dist.departments.length > 0) {
      const firstDept = dist.departments[0];
      const match = departments.find(
        (dept) => firstDept.includes(dept.name) || firstDept.includes(dept.code) || dept.name.includes(firstDept)
      );
      if (match) {
        setFormDepartment(match.name);
      } else {
        setFormDepartment(firstDept.replace(/^DEP-\d+\s*-\s*/, ''));
      }
    }

    // Reset invoice selection if previous invoice doesn't match new distributor
    if (formInvoiceNo) {
      const matchInv = dueInvoices.find(
        (inv) =>
          (inv.invoiceNumber === formInvoiceNo || inv.orderNumber === formInvoiceNo) &&
          (inv.distributorId === distId || (dist && inv.distributorName === dist.name))
      );
      if (!matchInv) {
        setFormInvoiceNo('');
        setFormAmount('');
      }
    }
  };

  // Handle Invoice Selection in Form
  const handleInvoiceSelect = (invNo: string) => {
    setFormInvoiceNo(invNo);

    if (!invNo) {
      // User selected On Account / Advance
      return;
    }

    const matched = dueInvoices.find((i) => i.invoiceNumber === invNo || i.orderNumber === invNo || i.id === invNo);
    if (matched) {
      // 1. Auto populate the exact due amount
      setFormAmount(matched.dueAmountBDT.toString());

      // 2. If distributor is not selected yet, auto-select it!
      if (!formDistributorId && (matched.distributorId || matched.distributorName)) {
        const foundDist = distributors.find(
          (d) =>
            d.id === matched.distributorId ||
            (matched.distributorName && d.name.toLowerCase() === matched.distributorName.toLowerCase())
        );
        if (foundDist) {
          setFormDistributorId(foundDist.id);
          if (foundDist.departments && foundDist.departments.length > 0) {
            setFormDepartment(foundDist.departments[0].replace(/^DEP-\d+\s*-\s*/, ''));
          }
        }
      }
    }
  };

  // Handle Document Image Upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert('File size exceeds 1MB limit. Please upload an image smaller than 1MB.');
      return;
    }

    setFormDocumentImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormDocumentImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick Action from Aging tab to Pay Invoice
  const handlePayInvoiceFromAging = (invoice: typeof dueInvoices[0]) => {
    setActiveTab('create');
    setFormInvoiceNo(invoice.invoiceNumber);
    setFormAmount(invoice.dueAmountBDT.toString());

    if (invoice.distributorId) {
      setFormDistributorId(invoice.distributorId);
    } else {
      const dist = distributors.find(
        (d) => d.name.toLowerCase() === (invoice.distributorName || invoice.customerName).toLowerCase()
      );
      if (dist) setFormDistributorId(dist.id);
    }

    // Default Bank
    if (!formBankId && banks.length > 0) {
      setFormBankId(banks[0].id);
    }
  };

  // Handle Form Submission (Save Button)
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const amt = parseFloat(formAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid positive payment amount.');
      return;
    }

    if (!formBankId) {
      setFormError('Please select a Bank account for this payment.');
      return;
    }

    if (!formPaymentDate) {
      setFormError('Please choose a valid payment date.');
      return;
    }

    const selectedBank = banks.find((b) => b.id === formBankId);
    const bankName = selectedBank ? selectedBank.name : 'Central Hand Cash';

    const selectedDist = distributors.find((d) => d.id === formDistributorId);
    const outAccountName = selectedDist
      ? selectedDist.name
      : selectedInvoiceDetail
      ? selectedInvoiceDetail.distributorName || selectedInvoiceDetail.customerName
      : 'Cash / Walk-in Customer';

    // Format display transaction date
    const dateObj = new Date(formPaymentDate);
    const tranDateStr = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newPaymentId = addPayment({
      tranDate: tranDateStr,
      outAccountName,
      distributorId: formDistributorId || selectedDist?.id || undefined,
      requestedBy: currentUser.name || 'Field Officer',
      requestedById: currentUser.id,
      paymentAmount: amt,
      department: formDepartment || 'MOUSUMI NETWORK LTD',
      paymentMode: formPaymentMode,
      chequeNoReceiptNo: formChequeNoReceiptNo || undefined,
      invoiceNo: formInvoiceNo || undefined,
      bankId: formBankId,
      bankName,
      description: formDescription || undefined,
      documentImage: formDocumentImage || undefined,
    });

    // If auto-approved by super admin or finance
    if (formAutoApprove) {
      approvePayment(newPaymentId, amt, 'Instant auto-approval upon creation');
    }

    setFormSuccessMessage(`Payment transaction registered successfully (TRN recorded for ৳ ${amt.toLocaleString()}).`);
    setTimeout(() => {
      setFormSuccessMessage('');
      // Reset form
      setFormAmount('');
      setFormInvoiceNo('');
      setFormChequeNoReceiptNo('');
      setFormDescription('');
      setFormDocumentImage('');
      setFormDocumentImageName('');
      setActiveTab('list');
    }, 1200);
  };

  // Filtered Payments for Table (Matching Image 1)
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (filterStatus && p.status !== filterStatus) return false;
      if (filterDepartment && p.department !== filterDepartment) return false;
      if (filterDistributor) {
        const dist = distributors.find((d) => d.id === filterDistributor);
        if (p.distributorId !== filterDistributor && (!dist || p.outAccountName !== dist.name)) {
          return false;
        }
      }
      if (filterBank && p.bankId !== filterBank && p.bankName !== filterBank) {
        return false;
      }
      if (filterSearchTerm) {
        const term = filterSearchTerm.toLowerCase();
        const matchTrn = p.tranNo.toLowerCase().includes(term);
        const matchAcc = p.outAccountName.toLowerCase().includes(term);
        const matchReq = p.requestedBy.toLowerCase().includes(term);
        const matchInv = p.invoiceNo ? p.invoiceNo.toLowerCase().includes(term) : false;
        if (!matchTrn && !matchAcc && !matchReq && !matchInv) return false;
      }
      return true;
    });
  }, [payments, filterStatus, filterDepartment, filterDistributor, filterBank, filterSearchTerm, distributors]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCollected = payments.reduce((sum, p) => sum + p.paymentAmount, 0);
    const totalApproved = payments.reduce((sum, p) => sum + (p.status === 'Approved' ? p.approvedAmount || p.paymentAmount : 0), 0);
    const totalPending = payments.filter((p) => p.status === 'Created').reduce((sum, p) => sum + p.paymentAmount, 0);
    const countCreated = payments.filter((p) => p.status === 'Created').length;
    const countApproved = payments.filter((p) => p.status === 'Approved').length;

    return { totalCollected, totalApproved, totalPending, countCreated, countApproved };
  }, [payments]);

  // Aging Buckets Totals across all due invoices
  const agingBuckets = useMemo(() => {
    let current = 0;
    let b31_60 = 0;
    let b61_90 = 0;
    let b90_plus = 0;

    let cCount = 0;
    let b31_60Count = 0;
    let b61_90Count = 0;
    let b90_plusCount = 0;

    dueInvoices.forEach((inv) => {
      if (inv.agingDays <= 30) {
        current += inv.dueAmountBDT;
        cCount++;
      } else if (inv.agingDays <= 60) {
        b31_60 += inv.dueAmountBDT;
        b31_60Count++;
      } else if (inv.agingDays <= 90) {
        b61_90 += inv.dueAmountBDT;
        b61_90Count++;
      } else {
        b90_plus += inv.dueAmountBDT;
        b90_plusCount++;
      }
    });

    return {
      current,
      b31_60,
      b61_90,
      b90_plus,
      cCount,
      b31_60Count,
      b61_90Count,
      b90_plusCount,
      totalDue: current + b31_60 + b61_90 + b90_plus,
    };
  }, [dueInvoices]);

  // Export to Excel / CSV
  const handleExportXLS = () => {
    const headers = [
      'TRANNO',
      'CREATIONDATE',
      'TRANDATE',
      'OUTACCOUNTNAME',
      'REQUESTED BY',
      'PAYMENT AMOUNT',
      'APPROVED AMOUNT',
      'APPROVED BY',
      'APPROVEDDATE',
      'STATUS',
      'DEPARTMENT',
      'BANK NAME',
      'INVOICE NO',
    ];

    const rows = filteredPayments.map((p) => [
      p.tranNo,
      `"${p.creationDate}"`,
      `"${p.tranDate}"`,
      `"${p.outAccountName}"`,
      `"${p.requestedBy}"`,
      p.paymentAmount,
      p.approvedAmount || 0,
      `"${p.approvedBy || ''}"`,
      `"${p.approvedDate || ''}"`,
      p.status,
      `"${p.department}"`,
      `"${p.bankName}"`,
      `"${p.invoiceNo || 'N/A'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ensec_payments_${filterStartDate}_to_${filterEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Navigation Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sky-800 dark:text-sky-300">
              Payment & Collections Management
            </h1>
            
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'list'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Payment List
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Payment</span>
          </button>
          <button
            onClick={() => setActiveTab('aging')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'aging'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Due Invoices & Aging</span>
          </button>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {formSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{formSuccessMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PAYMENT LIST (Exact representation of Image 1)                     */}
      {/* ========================================================================= */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Main Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Card Header matching Screenshot */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-sky-700 dark:text-sky-400">Payment List</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {filteredPayments.length} transactions recorded nationwide
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Create Payment</span>
                </button>
              </div>
            </div>

            {/* Filter Bar (Matching Image 1 exact layout) */}
            <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 space-y-3">
              {/* Row 1: Start Date, End Date, Status, Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Start Date */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sky-700 dark:text-sky-400 shrink-0 w-20">Start Date</span>
                  <div className="relative flex-1">
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full pl-3 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* End Date */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sky-700 dark:text-sky-400 shrink-0 w-16">End Date</span>
                  <div className="relative flex-1">
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full pl-3 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sky-700 dark:text-sky-400 shrink-0 w-14">Status</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select status</option>
                    <option value="Created">Created</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* Department */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sky-700 dark:text-sky-400 shrink-0 w-20">Department</span>
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="flex-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                    <option value="HBL EXCLUSIVE">HBL EXCLUSIVE</option>
                    <option value="MOUSUMI NETWORK LTD">MOUSUMI NETWORK LTD</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Distributor, Bank, XLS, Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs items-center">
                {/* Distributor */}
                <div className="lg:col-span-5 flex items-center gap-2">
                  <span className="font-semibold text-sky-700 dark:text-sky-400 shrink-0 w-20">Distributor</span>
                  <select
                    value={filterDistributor}
                    onChange={(e) => setFilterDistributor(e.target.value)}
                    className="flex-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select distributor</option>
                    {distributors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bank */}
                <div className="lg:col-span-4 flex items-center gap-2">
                  <span className="font-semibold text-sky-700 dark:text-sky-400 shrink-0 w-12">Bank</span>
                  <select
                    value={filterBank}
                    onChange={(e) => setFilterBank(e.target.value)}
                    className="flex-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Bank</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons: XLS, Preview */}
                <div className="lg:col-span-3 flex items-center justify-end gap-2">
                  {/* XLS Button */}
                  <button
                    onClick={handleExportXLS}
                    title="Export Payment List to CSV / Excel"
                    className="p-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>XLS</span>
                  </button>

                  {/* Preview Button */}
                  <button
                    onClick={() => {
                      // Trigger refresh / filter confirmation
                    }}
                    className="p-1 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Table Area (Matching Image 1 Column Names & Styling) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-sky-50/70 dark:bg-slate-800 text-sky-800 dark:text-sky-300 font-bold border-b border-slate-200 dark:border-slate-800 tracking-wider text-[11px] uppercase">
                    <th className="p-3 w-24">ACTION</th>
                    <th className="p-3 font-mono">TRANNO</th>
                    <th className="p-3">CREATIONDATE</th>
                    <th className="p-3">TRANDATE</th>
                    <th className="p-3">OUTACCOUNTNAME</th>
                    <th className="p-3">REQUESTED BY</th>
                    <th className="p-3 text-right">PAYMENT AMOUNT</th>
                    <th className="p-3 text-right">APPROVED AMOUNT</th>
                    <th className="p-3">APPROVED BY</th>
                    <th className="p-3">APPROVEDDATE</th>
                    <th className="p-3 text-center">STATUS</th>
                    <th className="p-3">DEPARTMENT</th>
                    <th className="p-3">INVOICE NO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-8 text-center text-slate-400">
                        No payments match the specified filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => {
                      const isApproved = p.status === 'Approved';
                      const isRejected = p.status === 'Rejected';

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* ACTION Buttons: Cyan Eye, Green Checkmark, Red Cross */}
                          <td className="p-2.5">
                            <div className="flex items-center gap-1.5">
                              {/* View Eye Button (Cyan) */}
                              <button
                                onClick={() => setViewPaymentModal(p)}
                                title="View Payment Details & Receipt"
                                className="w-6 h-6 rounded flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white transition-colors shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Approve Checkmark Button (Green) */}
                              <button
                                onClick={() => {
                                  setApproveModalPayment(p);
                                  setApproveModalAmount(p.paymentAmount.toString());
                                  setApproveModalNotes('');
                                }}
                                disabled={isApproved}
                                title={isApproved ? 'Already Approved' : 'Approve Payment & Settle Invoice'}
                                className={`w-6 h-6 rounded flex items-center justify-center text-white transition-colors shadow-2xs ${
                                  isApproved
                                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                                    : 'bg-emerald-500 hover:bg-emerald-600'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>

                              {/* Reject Cross Button (Red) */}
                              <button
                                onClick={() => {
                                  setRejectModalPayment(p);
                                  setRejectModalReason('');
                                }}
                                disabled={isRejected || isApproved}
                                title={isApproved ? 'Approved payments cannot be rejected' : 'Reject Payment'}
                                className={`w-6 h-6 rounded flex items-center justify-center text-white transition-colors shadow-2xs ${
                                  isApproved || isRejected
                                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                                    : 'bg-rose-500 hover:bg-rose-600'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* TRANNO */}
                          <td className="p-2.5 font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {p.tranNo}
                          </td>

                          {/* CREATIONDATE */}
                          <td className="p-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {p.creationDate}
                          </td>

                          {/* TRANDATE */}
                          <td className="p-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {p.tranDate}
                          </td>

                          {/* OUTACCOUNTNAME */}
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                            {p.outAccountName}
                          </td>

                          {/* REQUESTED BY */}
                          <td className="p-2.5 text-slate-700 dark:text-slate-300">
                            {p.requestedBy}
                          </td>

                          {/* PAYMENT AMOUNT */}
                          <td className="p-2.5 font-mono text-right font-bold text-slate-900 dark:text-white">
                            {p.paymentAmount.toLocaleString()}
                          </td>

                          {/* APPROVED AMOUNT */}
                          <td className="p-2.5 font-mono text-right font-semibold text-emerald-600 dark:text-emerald-400">
                            {p.approvedAmount ? p.approvedAmount.toLocaleString() : '0'}
                          </td>

                          {/* APPROVED BY */}
                          <td className="p-2.5 text-slate-600 dark:text-slate-400">
                            {p.approvedBy || '-'}
                          </td>

                          {/* APPROVEDDATE */}
                          <td className="p-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {p.approvedDate || '-'}
                          </td>

                          {/* STATUS */}
                          <td className="p-2.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                p.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                  : p.status === 'Rejected'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>

                          {/* DEPARTMENT */}
                          <td className="p-2.5 text-slate-700 dark:text-slate-300 font-medium">
                            {p.department}
                          </td>

                          {/* INVOICE NO */}
                          <td className="p-2.5">
                            {p.invoiceNo ? (
                              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {p.invoiceNo}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">On Account</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Summary Stats */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-400">Total Entries:</span>{' '}
                  <span className="font-bold text-slate-800 dark:text-white">{filteredPayments.length}</span>
                </div>
                <div>
                  <span className="text-slate-400">Total Requested:</span>{' '}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    ৳ {metrics.totalCollected.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Total Approved:</span>{' '}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ৳ {metrics.totalApproved.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                Data real-time synchronized with General Ledger & Aging Schedule.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CREATE PAYMENT (Exact representation of Image 2 + Invoice Dropdown) */}
      {/* ========================================================================= */}
      {activeTab === 'create' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-sky-700 dark:text-sky-400">Create Payment</h2>
              
            </div>

            <button
              onClick={() => setActiveTab('list')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to List</span>
            </button>
          </div>

          {/* Form Form Container */}
          <form onSubmit={handleSavePayment} className="p-6 space-y-6">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Two Column Grid matching Image 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5 text-xs">
              {/* ================= LEFT COLUMN ================= */}
              <div className="space-y-4">
                {/* Department */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Department
                  </label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                    <option value="HBL EXCLUSIVE">HBL EXCLUSIVE</option>
                    <option value="MOUSUMI NETWORK LTD">MOUSUMI NETWORK LTD</option>
                    <option value="EV MOBILITY CELLS">EV MOBILITY CELLS</option>
                  </select>
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Payment Mode
                  </label>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Deposit">Bank Deposit</option>
                    <option value="BEFTN">BEFTN</option>
                    <option value="RTGS">RTGS</option>
                    <option value="bKash/MFS">bKash/MFS</option>
                    <option value="Online Transfer">Online Transfer</option>
                  </select>
                </div>

                {/* Cheque No./ Receipt No. */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cheque No./ Receipt No.
                  </label>
                  <input
                    type="text"
                    value={formChequeNoReceiptNo}
                    onChange={(e) => setFormChequeNoReceiptNo(e.target.value)}
                    placeholder="e.g. CHQ-88201 or REC-0914"
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Bank* */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Bank<span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    required
                    value={formBankId}
                    onChange={(e) => setFormBankId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="">Select Bank</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.accountNo} - {b.branchName})
                      </option>
                    ))}
                    <option value="cash-ho">Head Office Hand Cash Account</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Enter collection details, deposit notes, or reference remarks..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* ================= RIGHT COLUMN ================= */}
              <div className="space-y-4">
                {/* Distributor */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Distributor
                  </label>
                  <select
                    value={formDistributorId}
                    onChange={(e) => handleDistributorChange(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="">Select distributor</option>
                    {distributors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — Outstanding: ৳ {d.currentOutstandingBDT.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Date* */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Payment Date<span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formPaymentDate}
                    onChange={(e) => setFormPaymentDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Invoice No. (THE CORE FEATURE REQUESTED BY USER) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Invoice No.{' '}
                      <span className="text-[11px] font-normal text-sky-600 dark:text-sky-400">
                        (Select due invoice to ensure accurate aging report)
                      </span>
                    </label>
                    {availableInvoicesForSelectedDistributor.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        {availableInvoicesForSelectedDistributor.length} Due Invoices Found
                      </span>
                    )}
                  </div>

                  <select
                    value={formInvoiceNo}
                    onChange={(e) => handleInvoiceSelect(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="">-- Select Due Invoice (Sorted Oldest / Highest Aging) --</option>
                    {availableInvoicesForSelectedDistributor.map((inv) => (
                      <option key={inv.id} value={inv.invoiceNumber}>
                        [{inv.invoiceNumber}] Due: ৳ {inv.dueAmountBDT.toLocaleString()} | Date: {inv.date} ({inv.agingDays} Days Old • {inv.agingBucket})
                      </option>
                    ))}
                    <option value="">-- On Account / Advance Payment (No Invoice) --</option>
                  </select>

                  {/* INTERACTIVE INVOICE AGING & ALLOCATION BREAKDOWN CARD */}
                  {selectedInvoiceDetail && (
                    <div className="mt-2.5 p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-slate-800 dark:to-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            Invoice {selectedInvoiceDetail.invoiceNumber}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${selectedInvoiceDetail.agingColor}`}>
                          {selectedInvoiceDetail.agingBucket} ({selectedInvoiceDetail.agingDays} Days)
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-500 block">Total Invoiced:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            ৳ {selectedInvoiceDetail.netAmountBDT.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Already Paid:</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ৳ {selectedInvoiceDetail.paidAmountBDT.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Current Due:</span>
                          <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                            ৳ {selectedInvoiceDetail.dueAmountBDT.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Projected Post-Payment Due Simulation */}
                      {formAmount && !isNaN(parseFloat(formAmount)) && (
                        <div className="pt-2 border-t border-blue-200/60 dark:border-slate-700 flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 dark:text-slate-300">
                            Remaining Due after ৳ {parseFloat(formAmount).toLocaleString()} payment:
                          </span>
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                            ৳ {Math.max(0, selectedInvoiceDetail.dueAmountBDT - parseFloat(formAmount)).toLocaleString()}
                            {parseFloat(formAmount) >= selectedInvoiceDetail.dueAmountBDT && ' (Fully Cleared ✓)'}
                          </span>
                        </div>
                      )}

                      <p className="text-[10px] text-blue-600 dark:text-blue-300/80 italic">
                        ✓ Linked payment will immediately credit this invoice and adjust the aging report.
                      </p>
                    </div>
                  )}
                </div>

                {/* Amount* */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Amount<span className="text-red-500 font-bold">*</span>
                    </label>
                    {selectedInvoiceDetail && (
                      <button
                        type="button"
                        onClick={() => setFormAmount(selectedInvoiceDetail.dueAmountBDT.toString())}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                      >
                        Set to Full Due (৳ {selectedInvoiceDetail.dueAmountBDT.toLocaleString()})
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-slate-400">৳</span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="Enter collection amount"
                      className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Document Image (Matching Image 2 exact wording) */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Document Image
                  </label>

                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    {!formDocumentImage ? (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Upload image</span>
                        </button>
                        <span className="text-[11px] text-slate-400">Allowed PNG. Max size of 1MB</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={formDocumentImage}
                            alt="Slip preview"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="truncate">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                              {formDocumentImageName || 'Deposit_Slip.png'}
                            </span>
                            <span className="text-[10px] text-emerald-600">Attached successfully</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setFormDocumentImage('');
                            setFormDocumentImageName('');
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instant Approval option for Accounts / Super Admin */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoApproveCheck"
                    checked={formAutoApprove}
                    onChange={(e) => setFormAutoApprove(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="autoApproveCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    Approve immediately & post voucher to General Ledger now
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Buttons matching Image 2 ("Back to List", "Save") */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors shadow-2xs"
              >
                Back to List
              </button>

              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DUE INVOICES & REAL-TIME AGING MATRIX                              */}
      {/* ========================================================================= */}
      {activeTab === 'aging' && (
        <div className="space-y-4">
          {/* Aging Summary Buckets Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 0-30 Days */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
              <div className="flex items-center justify-between text-xs text-emerald-600 font-bold mb-1">
                <span>Current (0–30 Days)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[10px]">
                  {agingBuckets.cCount} Invoices
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                ৳ {agingBuckets.current.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400">Regular credit terms cycle</span>
            </div>

            {/* 31-60 Days */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-xs">
              <div className="flex items-center justify-between text-xs text-amber-600 font-bold mb-1">
                <span>31–60 Days</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-[10px]">
                  {agingBuckets.b31_60Count} Invoices
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                ৳ {agingBuckets.b31_60.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400">Grace period expiring</span>
            </div>

            {/* 61-90 Days */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/40 shadow-xs">
              <div className="flex items-center justify-between text-xs text-orange-600 font-bold mb-1">
                <span>61–90 Days</span>
                <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-[10px]">
                  {agingBuckets.b61_90Count} Invoices
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                ৳ {agingBuckets.b61_90.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400">High collection urgency</span>
            </div>

            {/* 90+ Days */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 shadow-xs">
              <div className="flex items-center justify-between text-xs text-rose-600 font-bold mb-1">
                <span>90+ Days (Critical)</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-[10px]">
                  {agingBuckets.b90_plusCount} Invoices
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                ৳ {agingBuckets.b90_plus.toLocaleString()}
              </div>
              <span className="text-[11px] text-rose-500 font-semibold">Immediate credit freeze</span>
            </div>
          </div>

          {/* Due Invoices Schedule Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Distributor Outstanding Invoices & Aging Schedule
                </h3>
                
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Due:</span>
                <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono">
                  ৳ {agingBuckets.totalDue.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Distributor / Customer</th>
                    <th className="p-3">Issue Date</th>
                    <th className="p-3 text-center">Aging Days</th>
                    <th className="p-3 text-center">Aging Bracket</th>
                    <th className="p-3 text-right">Invoice Net</th>
                    <th className="p-3 text-right">Paid Amount</th>
                    <th className="p-3 text-right">Outstanding Due</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {dueInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {inv.distributorName || inv.customerName}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{inv.date}</td>
                      <td className="p-3 text-center font-mono font-bold">{inv.agingDays}d</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${inv.agingColor}`}>
                          {inv.agingBucket}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-right text-slate-600 dark:text-slate-400">
                        ৳ {inv.netAmountBDT.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-right text-emerald-600">
                        ৳ {inv.paidAmountBDT.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-right font-black text-rose-600 dark:text-rose-400">
                        ৳ {inv.dueAmountBDT.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handlePayInvoiceFromAging(inv)}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] shadow-2xs transition-colors"
                        >
                          Pay This Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW RECEIPT & TRANSACTION DETAILS                                */}
      {/* ========================================================================= */}
      {viewPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-sky-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Payment Receipt & Audit Record
                </h3>
              </div>
              <button
                onClick={() => setViewPaymentModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    TRANSACTION NO
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {viewPaymentModal.tranNo}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-bold text-xs ${
                    viewPaymentModal.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : viewPaymentModal.status === 'Rejected'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  {viewPaymentModal.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Distributor Account:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {viewPaymentModal.outAccountName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Department:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewPaymentModal.department}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Transaction Date:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewPaymentModal.tranDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Created At:</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {viewPaymentModal.creationDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Mode:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewPaymentModal.paymentMode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Instrument / Cheque No:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {viewPaymentModal.chequeNoReceiptNo || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Receiving Bank:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewPaymentModal.bankName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Linked Invoice:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {viewPaymentModal.invoiceNo || 'On Account'}
                  </span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Requested Payment:</span>
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                    ৳ {viewPaymentModal.paymentAmount.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Approved Credit:</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ৳ {(viewPaymentModal.approvedAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Description */}
              {viewPaymentModal.description && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Description & Remarks:</span>
                  <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {viewPaymentModal.description}
                  </p>
                </div>
              )}

              {/* Document Image Preview */}
              {viewPaymentModal.documentImage && (
                <div>
                  <span className="text-slate-400 block mb-1">Attached Bank Slip / Receipt:</span>
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <img
                      src={viewPaymentModal.documentImage}
                      alt="Deposit Instrument"
                      className="max-h-48 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Approval Info */}
              {viewPaymentModal.approvedBy && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                  Approved by <b>{viewPaymentModal.approvedBy}</b> on {viewPaymentModal.approvedDate}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/40">
              <button
                onClick={() => setViewPaymentModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: APPROVE PAYMENT                                                  */}
      {/* ========================================================================= */}
      {approveModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/50">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-sm">Approve Collection Voucher</h3>
              </div>
              <button onClick={() => setApproveModalPayment(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                You are approving payment <b>{approveModalPayment.tranNo}</b> from{' '}
                <b>{approveModalPayment.outAccountName}</b>.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Approved Amount (BDT)
                </label>
                <input
                  type="number"
                  value={approveModalAmount}
                  onChange={(e) => setApproveModalAmount(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Accounts Approval Note (Optional)
                </label>
                <input
                  type="text"
                  value={approveModalNotes}
                  onChange={(e) => setApproveModalNotes(e.target.value)}
                  placeholder="e.g. Bank credit verified against deposit slip"
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-800 dark:text-blue-300 space-y-1">
                <p>• Accounts Cash Book entry will be automatically generated.</p>
                {approveModalPayment.invoiceNo && (
                  <p>• Invoice {approveModalPayment.invoiceNo} due will be credited & aging bucket reduced.</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/40">
              <button
                onClick={() => setApproveModalPayment(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const amt = parseFloat(approveModalAmount);
                  approvePayment(approveModalPayment.id, isNaN(amt) ? undefined : amt, approveModalNotes);
                  setApproveModalPayment(null);
                }}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REJECT PAYMENT                                                   */}
      {/* ========================================================================= */}
      {rejectModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-rose-50 dark:bg-rose-950/50">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Reject Payment Entry</h3>
              </div>
              <button onClick={() => setRejectModalPayment(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Please provide the rejection reason for payment <b>{rejectModalPayment.tranNo}</b>:
              </p>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Rejection<span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectModalReason}
                  onChange={(e) => setRejectModalReason(e.target.value)}
                  placeholder="e.g. Bank slip illegible / Cheque bounced / Incorrect account number"
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/40">
              <button
                onClick={() => setRejectModalPayment(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  rejectPayment(rejectModalPayment.id, rejectModalReason || 'Rejected by Accounts');
                  setRejectModalPayment(null);
                }}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs"
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
