import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Eye,
  CheckCircle2,
  Printer,
  DollarSign,
  Download,
  RefreshCw,
  PlusCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  Building,
  AlertCircle,
  Check,
  Tag,
  Receipt,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  Percent,
  ShieldCheck,
  Truck,
  Edit3,
  TrendingUp,
  TrendingDown,
  Info,
  PackageCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { SalesOrder, SalesOrderItem, CashBookEntry } from '../../types/erp.ts';
import { DeliveryOrderModal } from './DeliveryOrderModal.tsx';
import { ChallanModal } from './ChallanModal.tsx';
import { CustomerReceiptModal } from './CustomerReceiptModal.tsx';

interface SalesOrdersRegistryModuleProps {
  onNavigateToCreateOrder?: () => void;
}

type DatePreset = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';

export const SalesOrdersRegistryModule: React.FC<SalesOrdersRegistryModuleProps> = ({
  onNavigateToCreateOrder,
}) => {
  const {
    salesOrders,
    updateSalesOrder,
    approveSalesOrder,
    dispatchAndInvoiceSalesOrder,
    confirmCustomerReceipt,
    recordOrderPayment,
    customers,
    distributors,
    products,
    warehouses,
    refreshSalesOrders,
  } = useERP();

  // ---------------------------------------------------------------------------
  // FILTER STATES
  // ---------------------------------------------------------------------------
  const [orderNoSearch, setOrderNoSearch] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');

  // Pagination & Display
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<SalesOrder | null>(null);
  const [selectedOrderForDO, setSelectedOrderForDO] = useState<SalesOrder | null>(null);
  const [selectedOrderForChallan, setSelectedOrderForChallan] = useState<SalesOrder | null>(null);
  const [selectedOrderForCustomerReceipt, setSelectedOrderForCustomerReceipt] = useState<SalesOrder | null>(null);
  const [selectedOrderReceiptProof, setSelectedOrderReceiptProof] = useState<SalesOrder | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<SalesOrder | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payAccount, setPayAccount] = useState<CashBookEntry['accountType']>('City Bank PLC');
  const [payRef, setPayRef] = useState('');
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const [orderToDispatchConfirm, setOrderToDispatchConfirm] = useState<SalesOrder | null>(null);

  // ---------------------------------------------------------------------------
  // ACCOUNTS ORDER REVIEW & RATE VERIFICATION MODAL STATE
  // ---------------------------------------------------------------------------
  const [reviewOrder, setReviewOrder] = useState<SalesOrder | null>(null);
  const [reviewItems, setReviewItems] = useState<SalesOrderItem[]>([]);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [originalRates, setOriginalRates] = useState<Record<string, number>>({});
  const [reviewVatRate, setReviewVatRate] = useState<number>(5);
  const [reviewVatAmount, setReviewVatAmount] = useState<number>(0);
  const [reviewVatMode, setReviewVatMode] = useState<'percent' | 'amount'>('percent');

  // VAT / Tax editing state for Commercial Tax Invoice Modal
  const [isEditingInvoiceVat, setIsEditingInvoiceVat] = useState(false);
  const [invoiceEditVatRate, setInvoiceEditVatRate] = useState<number>(5);
  const [invoiceEditVatAmount, setInvoiceEditVatAmount] = useState<number>(0);
  const [invoiceVatMode, setInvoiceVatMode] = useState<'percent' | 'amount'>('percent');

  // All unique customers from orders and database
  const customerOptions = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => map.set(c.id, c.name));
    distributors.forEach((d) => map.set(d.id, `${d.name} (Distributor)`));
    salesOrders.forEach((so) => {
      if (so.customerName) {
        map.set(so.customerId || so.customerName, so.customerName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [customers, distributors, salesOrders]);

  // All unique products
  const productOptions = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => map.set(p.id, p.name));
    salesOrders.forEach((so) => {
      so.items?.forEach((item) => {
        if (item.productId && item.productName) {
          map.set(item.productId, item.productName);
        }
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products, salesOrders]);

  // Today & Date Calculations
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const weekStartStr = useMemo(() => {
    const d = new Date();
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const monthPrefixStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // ---------------------------------------------------------------------------
  // FILTERING LOGIC
  // ---------------------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      // 1. Order No & ID search
      if (orderNoSearch.trim()) {
        const query = orderNoSearch.toLowerCase().trim();
        const matchesOrderNo = order.orderNumber?.toLowerCase().includes(query);
        const matchesId = order.id?.toLowerCase().includes(query);
        const matchesMemo = order.notes?.toLowerCase().includes(query);
        if (!matchesOrderNo && !matchesId && !matchesMemo) return false;
      }

      // 2. Date Filtering
      const orderDate = order.date ? order.date.slice(0, 10) : '';
      if (datePreset === 'today') {
        if (orderDate !== todayStr) return false;
      } else if (datePreset === 'yesterday') {
        if (orderDate !== yesterdayStr) return false;
      } else if (datePreset === 'this_week') {
        if (orderDate < weekStartStr || orderDate > todayStr) return false;
      } else if (datePreset === 'this_month') {
        if (!orderDate.startsWith(monthPrefixStr)) return false;
      } else if (datePreset === 'custom') {
        if (fromDate && orderDate < fromDate) return false;
        if (toDate && orderDate > toDate) return false;
      }

      // 3. Status Filtering
      if (statusFilter !== 'all') {
        if (order.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // 4. Customer Name Filtering
      if (customerFilter !== 'all') {
        const matchesId = order.customerId === customerFilter;
        const matchesName = order.customerName?.toLowerCase() === customerFilter.toLowerCase();
        if (!matchesId && !matchesName) return false;
      }

      // 5. Product Wise Filtering
      if (productFilter !== 'all') {
        const hasProduct = order.items?.some(
          (item) =>
            item.productId === productFilter ||
            item.productName?.toLowerCase().includes(productFilter.toLowerCase())
        );
        if (!hasProduct) return false;
      }

      return true;
    });
  }, [
    salesOrders,
    orderNoSearch,
    datePreset,
    fromDate,
    toDate,
    statusFilter,
    customerFilter,
    productFilter,
    todayStr,
    yesterdayStr,
    weekStartStr,
    monthPrefixStr,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [orderNoSearch, datePreset, fromDate, toDate, statusFilter, customerFilter, productFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (orderNoSearch.trim()) count++;
    if (datePreset !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (customerFilter !== 'all') count++;
    if (productFilter !== 'all') count++;
    return count;
  }, [orderNoSearch, datePreset, statusFilter, customerFilter, productFilter]);

  const clearAllFilters = () => {
    setOrderNoSearch('');
    setDatePreset('all');
    setFromDate('');
    setToDate('');
    setStatusFilter('all');
    setCustomerFilter('all');
    setProductFilter('all');
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    let grossTotal = 0;
    let netTotal = 0;
    let paidTotal = 0;
    let dueTotal = 0;
    let invoicedCount = 0;
    let approvedCount = 0;
    let submittedCount = 0;

    filteredOrders.forEach((o) => {
      grossTotal += o.subTotalBDT || 0;
      netTotal += o.netAmountBDT || 0;
      paidTotal += o.paidAmountBDT || 0;
      dueTotal += o.dueAmountBDT ?? (o.netAmountBDT - (o.paidAmountBDT || 0));

      if (o.status === 'Invoiced') invoicedCount++;
      else if (o.status === 'Approved' || o.status === 'Dispatched') approvedCount++;
      else if (o.status === 'Submitted') submittedCount++;
    });

    return {
      count: filteredOrders.length,
      grossTotal,
      netTotal,
      paidTotal,
      dueTotal: Math.max(0, dueTotal),
      invoicedCount,
      approvedCount,
      submittedCount,
    };
  }, [filteredOrders]);

  // Refresh data from Supabase
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (refreshSalesOrders) {
      await refreshSalesOrders();
    }
    setTimeout(() => {
      setIsRefreshing(false);
      setNotificationBanner('Orders synchronized from database.');
      setTimeout(() => setNotificationBanner(null), 3000);
    }, 600);
  };

  // ---------------------------------------------------------------------------
  // ACCOUNTS REVIEW & RATE CHANGE HANDLERS
  // ---------------------------------------------------------------------------
  const handleOpenAccountsApprovalModal = (order: SalesOrder) => {
    setReviewOrder(order);
    const origMap: Record<string, number> = {};
    const clonedItems: SalesOrderItem[] = (order.items || []).map((it, idx) => {
      origMap[`${it.productId}-${idx}`] = it.unitPriceBDT;
      return {
        ...it,
        unitPriceBDT: it.unitPriceBDT,
        quantity: it.quantity,
        discountBDT: it.discountBDT || 0,
        lineTotalBDT: it.lineTotalBDT || (it.quantity * it.unitPriceBDT - (it.discountBDT || 0)),
      };
    });
    setOriginalRates(origMap);
    setReviewItems(clonedItems);
    setReviewNotes(order.notes || '');

    const initialRate = order.vatRatePercent !== undefined ? order.vatRatePercent : 5;
    const initialAmount = order.taxVatBDT !== undefined ? order.taxVatBDT : 0;
    setReviewVatRate(initialRate);
    setReviewVatAmount(initialAmount);
    setReviewVatMode('percent');
  };

  const handleOpenInvoiceModal = (order: SalesOrder) => {
    setSelectedOrderForInvoice(order);
    const taxableBase = Math.max(0, order.subTotalBDT - (order.discountBDT || 0));
    const rate = order.vatRatePercent !== undefined
      ? order.vatRatePercent
      : (taxableBase > 0 && order.taxVatBDT ? Number(((order.taxVatBDT / taxableBase) * 100).toFixed(2)) : 5);
    setInvoiceEditVatRate(rate);
    setInvoiceEditVatAmount(order.taxVatBDT || 0);
    setInvoiceVatMode('percent');
    setIsEditingInvoiceVat(false);
  };

  const handleRateChange = (idx: number, newRate: number) => {
    setReviewItems((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          const rate = Math.max(0, Number(newRate) || 0);
          const discount = item.discountBDT || 0;
          const lineTotal = Math.max(0, item.quantity * rate - discount);
          return {
            ...item,
            unitPriceBDT: rate,
            lineTotalBDT: lineTotal,
          };
        }
        return item;
      })
    );
  };

  const handleItemDiscountChange = (idx: number, newDiscount: number) => {
    setReviewItems((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          const discount = Math.max(0, Number(newDiscount) || 0);
          const lineTotal = Math.max(0, item.quantity * item.unitPriceBDT - discount);
          return {
            ...item,
            discountBDT: discount,
            lineTotalBDT: lineTotal,
          };
        }
        return item;
      })
    );
  };

  // Live Calculations for Accounts Review
  const reviewSubtotal = useMemo(() => {
    return reviewItems.reduce((sum, item) => sum + (item.quantity * item.unitPriceBDT), 0);
  }, [reviewItems]);

  const reviewTotalDiscount = useMemo(() => {
    return reviewItems.reduce((sum, item) => sum + (item.discountBDT || 0), 0);
  }, [reviewItems]);

  const reviewTaxBase = useMemo(() => {
    return Math.max(0, reviewSubtotal - reviewTotalDiscount);
  }, [reviewSubtotal, reviewTotalDiscount]);

  const reviewTaxVat = useMemo(() => {
    if (reviewVatMode === 'amount') {
      return Math.max(0, Math.round(reviewVatAmount || 0));
    }
    return Math.max(0, Math.round(reviewTaxBase * ((reviewVatRate || 0) / 100)));
  }, [reviewTaxBase, reviewVatMode, reviewVatRate, reviewVatAmount]);

  const reviewEffectiveVatPercent = useMemo(() => {
    if (reviewVatMode === 'percent') return reviewVatRate;
    return reviewTaxBase > 0 ? Number(((reviewTaxVat / reviewTaxBase) * 100).toFixed(2)) : 0;
  }, [reviewVatMode, reviewVatRate, reviewTaxBase, reviewTaxVat]);

  const handleReviewVatRateChange = (newRate: number) => {
    const rate = Math.max(0, Number(newRate) || 0);
    setReviewVatRate(rate);
    setReviewVatMode('percent');
    setReviewVatAmount(Math.round(reviewTaxBase * (rate / 100)));
  };

  const handleReviewVatAmountChange = (newAmount: number) => {
    const amount = Math.max(0, Number(newAmount) || 0);
    setReviewVatAmount(amount);
    setReviewVatMode('amount');
    setReviewVatRate(reviewTaxBase > 0 ? Number(((amount / reviewTaxBase) * 100).toFixed(2)) : 0);
  };

  // Handlers for Commercial Tax Invoice Modal VAT Editing
  const handleInvoiceVatRateChange = (newRate: number) => {
    const rate = Math.max(0, Number(newRate) || 0);
    setInvoiceEditVatRate(rate);
    setInvoiceVatMode('percent');
    if (selectedOrderForInvoice) {
      const base = Math.max(0, selectedOrderForInvoice.subTotalBDT - (selectedOrderForInvoice.discountBDT || 0));
      setInvoiceEditVatAmount(Math.round(base * (rate / 100)));
    }
  };

  const handleInvoiceVatAmountChange = (newAmount: number) => {
    const amount = Math.max(0, Number(newAmount) || 0);
    setInvoiceEditVatAmount(amount);
    setInvoiceVatMode('amount');
    if (selectedOrderForInvoice) {
      const base = Math.max(0, selectedOrderForInvoice.subTotalBDT - (selectedOrderForInvoice.discountBDT || 0));
      setInvoiceEditVatRate(base > 0 ? Number(((amount / base) * 100).toFixed(2)) : 0);
    }
  };

  const handleSaveInvoiceVatChange = () => {
    if (!selectedOrderForInvoice) return;
    const base = Math.max(0, selectedOrderForInvoice.subTotalBDT - (selectedOrderForInvoice.discountBDT || 0));
    const newVatAmount = invoiceVatMode === 'amount'
      ? Math.max(0, Math.round(invoiceEditVatAmount || 0))
      : Math.max(0, Math.round(base * ((invoiceEditVatRate || 0) / 100)));
    const newVatRate = invoiceVatMode === 'percent'
      ? invoiceEditVatRate
      : (base > 0 ? Number(((newVatAmount / base) * 100).toFixed(2)) : 0);
    const newNetPayable = Math.max(0, base + newVatAmount);
    const paid = selectedOrderForInvoice.paidAmountBDT || 0;
    const newDue = Math.max(0, newNetPayable - paid);

    const updates: Partial<SalesOrder> = {
      taxVatBDT: newVatAmount,
      vatRatePercent: newVatRate,
      netAmountBDT: newNetPayable,
      dueAmountBDT: newDue,
    };

    updateSalesOrder(selectedOrderForInvoice.id, updates);
    setSelectedOrderForInvoice((prev) => prev ? { ...prev, ...updates } : null);
    setIsEditingInvoiceVat(false);
    setNotificationBanner(`VAT / Tax updated to ৳${newVatAmount.toLocaleString()} (${newVatRate}%) for Order ${selectedOrderForInvoice.orderNumber}.`);
    setTimeout(() => setNotificationBanner(null), 4000);
  };

  const reviewNetAmount = useMemo(() => {
    return Math.max(0, reviewSubtotal - reviewTotalDiscount + reviewTaxVat);
  }, [reviewSubtotal, reviewTotalDiscount, reviewTaxVat]);

  const reviewDueAmount = useMemo(() => {
    const paid = reviewOrder?.paidAmountBDT || 0;
    return Math.max(0, reviewNetAmount - paid);
  }, [reviewNetAmount, reviewOrder]);

  const modifiedRatesCount = useMemo(() => {
    if (!reviewOrder) return 0;
    let count = 0;
    reviewItems.forEach((it, idx) => {
      const orig = originalRates[`${it.productId}-${idx}`];
      if (orig !== undefined && orig !== it.unitPriceBDT) {
        count++;
      }
    });
    return count;
  }, [reviewItems, originalRates, reviewOrder]);

  const handleConfirmAccountsApproval = () => {
    if (!reviewOrder) return;

    const updatedData: Partial<SalesOrder> = {
      items: reviewItems,
      subTotalBDT: reviewSubtotal,
      discountBDT: reviewTotalDiscount,
      taxVatBDT: reviewTaxVat,
      vatRatePercent: reviewEffectiveVatPercent,
      netAmountBDT: reviewNetAmount,
      dueAmountBDT: reviewDueAmount,
      notes: reviewNotes.trim()
        ? `${reviewNotes.trim()}${modifiedRatesCount > 0 ? ` | [Accounts adjusted ${modifiedRatesCount} item rates]` : ' | [Accounts Verified]'}`
        : reviewOrder.notes,
    };

    const doNum = reviewOrder.doNumber || `012/2026-${(reviewOrder.orderNumber || reviewOrder.id).replace(/\D/g, "").slice(-2).padStart(2, "0") || "88"}`;
    const enrichedData = { ...updatedData, doNumber: doNum };
    approveSalesOrder(reviewOrder.id, enrichedData);
    setNotificationBanner(
      `Order ${reviewOrder.orderNumber} successfully approved by Accounts! Official Factory Delivery Order (D.O. #${doNum}) generated.`
    );
    setTimeout(() => setNotificationBanner(null), 5000);
    setSelectedOrderForDO({
      ...reviewOrder,
      ...enrichedData,
      status: 'Approved',
    } as SalesOrder);
    setReviewOrder(null);
  };

  // Payment modal trigger
  const handleOpenPayment = (order: SalesOrder) => {
    const due = order.dueAmountBDT ?? (order.netAmountBDT - (order.paidAmountBDT || 0));
    setPayAmount(due);
    setPayRef(`RCT-${order.orderNumber}`);
    setShowPaymentModal(order);
  };

  // Submit payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal || payAmount <= 0) return;

    recordOrderPayment(showPaymentModal.id, payAmount, payAccount, payRef);
    setNotificationBanner(
      `Payment of BDT ${payAmount.toLocaleString()} recorded against ${showPaymentModal.orderNumber}.`
    );
    setTimeout(() => setNotificationBanner(null), 4000);
    setShowPaymentModal(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;
    const headers = [
      'Order Number',
      'Date',
      'Customer',
      'Channel',
      'Warehouse',
      'Net Amount BDT',
      'Paid Amount BDT',
      'Due Amount BDT',
      'Status',
      'Payment Method',
      'Items Count',
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.date}"`,
      `"${o.customerName?.replace(/"/g, '""')}"`,
      `"${o.channel || ''}"`,
      `"${o.warehouseName || ''}"`,
      o.netAmountBDT,
      o.paidAmountBDT || 0,
      o.dueAmountBDT || 0,
      `"${o.status}"`,
      `"${o.paymentMethod || ''}"`,
      o.items?.length || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_orders_registry_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Sales Orders Master Registry
              </h1>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs cursor-pointer"
            title="Sync latest orders from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs disabled:opacity-40 cursor-pointer"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {onNavigateToCreateOrder && (
            <button
              onClick={onNavigateToCreateOrder}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm shadow-blue-600/20 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Sales Order & Invoicing</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {notificationBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{notificationBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotificationBanner(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            <span>Filtered Orders</span>
            <Receipt className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {metrics.count} <span className="text-xs font-normal text-slate-400">/ {salesOrders.length} total</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px] font-semibold text-slate-500">
            <span className="text-emerald-600 dark:text-emerald-400">{metrics.invoicedCount} Invoiced</span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400">{metrics.approvedCount} Approved</span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400">{metrics.submittedCount} Pending Check</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            <span>Total Net Value</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ৳ {metrics.netTotal.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-2">
            Gross Subtotal: ৳ {metrics.grossTotal.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            <span>Collected / Paid</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
            ৳ {metrics.paidTotal.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-2">
            {metrics.netTotal > 0 ? `${Math.round((metrics.paidTotal / metrics.netTotal) * 100)}% realization rate` : '0%'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            <span>Outstanding Due</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
            ৳ {metrics.dueTotal.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-2">
            Receivable across filtered customers
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MULTI-CRITERIA FILTERS PANEL                                          */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Filter & Search Orders</h2>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {activeFiltersCount} active {activeFiltersCount === 1 ? 'filter' : 'filters'}
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          {/* 1. Order No & Memo Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Order No / Memo Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={orderNoSearch}
                onChange={(e) => setOrderNoSearch(e.target.value)}
                placeholder="e.g. SO-DHK-2026-001 or memo..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-xs"
              />
              {orderNoSearch && (
                <button
                  type="button"
                  onClick={() => setOrderNoSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Order Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Order Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-xs cursor-pointer font-medium"
            >
              <option value="all">All Statuses (Every Stage)</option>
              <option value="Submitted">Submitted (Pending Accounts Check & Rate Verification)</option>
              <option value="Approved">Approved (Ready for Dispatch)</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Invoiced">Invoiced (Final Posted)</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* 3. Customer / Buyer Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Customer / Buyer Name
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-xs cursor-pointer font-medium truncate"
              >
                <option value="all">All Customers / Buyers</option>
                {customerOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Product Wise Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Product Wise Filter
            </label>
            <div className="relative">
              <Package className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-xs cursor-pointer font-medium truncate"
              >
                <option value="all">All Products (Any Item)</option>
                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Date Filter & Presets Row */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Date Filter:</span>
            </span>

            {(
              [
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'this_week', label: 'This Week' },
                { id: 'this_month', label: 'This Month' },
                { id: 'custom', label: 'Custom Date Range' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDatePreset(p.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  datePreset === p.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 self-start md:self-auto animate-in fade-in">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[11px]"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[11px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Active Filter Tags */}
        {activeFiltersCount > 0 && (
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Applied:</span>

            {orderNoSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <span>Order: &ldquo;{orderNoSearch}&rdquo;</span>
                <button onClick={() => setOrderNoSearch('')} className="hover:text-rose-500 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {datePreset !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <span>
                  Date:{' '}
                  {datePreset === 'custom'
                    ? `${fromDate || 'Start'} to ${toDate || 'End'}`
                    : datePreset.replace('_', ' ')}
                </span>
                <button onClick={() => setDatePreset('all')} className="hover:text-rose-500 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <span>Status: {statusFilter}</span>
                <button onClick={() => setStatusFilter('all')} className="hover:text-rose-500 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {customerFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <span>
                  Customer: {customerOptions.find((c) => c.id === customerFilter)?.name || customerFilter}
                </span>
                <button onClick={() => setCustomerFilter('all')} className="hover:text-rose-500 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {productFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span>
                  Product: {productOptions.find((p) => p.id === productFilter)?.name || productFilter}
                </span>
                <button onClick={() => setProductFilter('all')} className="hover:text-rose-500 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* ORDERS MASTER TABLE                                                   */}
      {/* ===================================================================== */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Registry Records</h2>
            <span className="text-[11px] bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/60">
              Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <span>•</span>
            <span className="font-medium">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Order No & Date</th>
                <th className="p-3">Customer / Buyer</th>
                <th className="p-3">Warehouse Hub</th>
                <th className="p-3">Ordered Products</th>
                <th className="p-3 text-right">Net Amount</th>
                <th className="p-3 text-right">Paid / Due</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 dark:text-slate-500">
                    <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-sm">No sales orders found matching current filters.</p>
                    <p className="text-xs mt-1 text-slate-400">
                      Try clearing filters or search criteria, or create a new order.
                    </p>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((so) => {
                  const due = so.dueAmountBDT ?? (so.netAmountBDT - (so.paidAmountBDT || 0));

                  return (
                    <tr
                      key={so.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Order No & Date */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {so.orderNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{so.date}</span>
                        </div>
                      </td>

                      {/* Customer / Buyer */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {so.customerName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                            {so.channel || 'Direct Sales'}
                          </span>
                          {so.distributorName && (
                            <span className="text-blue-500 truncate max-w-[140px]">
                              via {so.distributorName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Warehouse Hub */}
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1 font-medium">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{so.warehouseName || 'Main Hub'}</span>
                        </div>
                      </td>

                      {/* Ordered Products (with highlight if filtered by product) */}
                      <td className="p-3">
                        <div className="space-y-0.5 max-w-xs">
                          {so.items?.map((item, idx) => {
                            const isMatchedProduct =
                              productFilter !== 'all' &&
                              (item.productId === productFilter ||
                                item.productName?.toLowerCase().includes(productFilter.toLowerCase()));

                            return (
                              <div
                                key={idx}
                                className={`text-[11px] truncate flex items-center justify-between gap-2 px-1.5 py-0.5 rounded ${
                                  isMatchedProduct
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 font-bold'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <span className="truncate">
                                  {item.quantity}x {item.productName}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                  @ ৳{item.unitPriceBDT.toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Net Amount */}
                      <td className="p-3 font-mono text-right font-black text-slate-900 dark:text-white">
                        ৳ {so.netAmountBDT.toLocaleString()}
                      </td>

                      {/* Paid & Due */}
                      <td className="p-3 text-right font-mono">
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Paid: ৳{(so.paidAmountBDT || 0).toLocaleString()}
                        </div>
                        <div
                          className={`text-[11px] font-bold ${
                            due > 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          Due: ৳{due.toLocaleString()}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            so.status === 'Delivered' || so.receivedByCustomer
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : so.status === 'Dispatched & Invoiced' || so.status === 'Dispatched'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : so.status === 'Invoiced'
                              ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                              : so.status === 'Approved'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : so.status === 'Cancelled'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {so.status === 'Delivered' || so.receivedByCustomer ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Received by Customer</span>
                            </>
                          ) : so.status === 'Dispatched & Invoiced' || so.status === 'Dispatched' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                              <span>Dispatched (Awaiting Handover)</span>
                            </>
                          ) : so.status === 'Approved' ? (
                            <span>Approved (Challan Ready)</span>
                          ) : so.status === 'Submitted' ? (
                            <span>Submitted (Verify Rates)</span>
                          ) : (
                            so.status
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* View Order Copy / Tax Invoice */}
                          <button
                            type="button"
                            onClick={() => handleOpenInvoiceModal(so)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Check Order Copy / Tax Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Accounts Rate Verification & Approval */}
                          {so.status === 'Submitted' && (
                            <button
                              type="button"
                              onClick={() => handleOpenAccountsApprovalModal(so)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] cursor-pointer transition-colors shadow-xs"
                              title="Accounts Rate Check: Verify order copy and revise product rates before approving"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Check & Approve</span>
                            </button>
                          )}

                          {/* OFFICIAL FACTORY DELIVERY ORDER (D.O.) - ONLY AFTER CHECK & APPROVAL */}
                          {so.status !== 'Submitted' && so.status !== 'Booked' && so.status !== 'Cancelled' && so.status !== 'Rejected' && (
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForDO(so)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 font-bold text-[11px] cursor-pointer transition-colors border border-emerald-300 dark:border-emerald-800 shadow-xs"
                              title="View official Factory Delivery Order (D.O.) for release authorization"
                            >
                              <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>D.O.</span>
                            </button>
                          )}

                          {/* AUTO-GENERATED FACTORY CHALLAN - ONLY AFTER CHECK & APPROVAL */}
                          {so.status !== 'Submitted' && so.status !== 'Booked' && so.status !== 'Cancelled' && so.status !== 'Rejected' && (
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForChallan(so)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 font-bold text-[11px] cursor-pointer transition-colors border border-blue-200 dark:border-blue-800 shadow-xs"
                              title="View official Factory Challan (Matches uploaded sample layout)"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Challan</span>
                            </button>
                          )}

                          {/* Factory Dispatch & Invoice Action - ONLY AFTER APPROVED */}
                          {so.status === 'Approved' && (
                            <button
                              type="button"
                              onClick={() => setOrderToDispatchConfirm(so)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] cursor-pointer transition-colors shadow-xs"
                              title="Post Invoice, deduct warehouse stock & release for salesman handover"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Dispatch & Invoice</span>
                            </button>
                          )}

                          {/* SALESMAN CUSTOMER RECEIPT HANDOVER (Requested by User) */}
                          {(so.status === 'Dispatched & Invoiced' || so.status === 'Dispatched') && (
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForCustomerReceipt(so)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] cursor-pointer transition-colors shadow-xs animate-pulse"
                              title="Salesman: Ensure and confirm customer received the sales order and verified Challan"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Ensure Received</span>
                            </button>
                          )}

                          {/* VIEW RECEIPT PROOF (When Already Delivered) */}
                          {(so.status === 'Delivered' || so.receivedByCustomer) && (
                            <button
                              type="button"
                              onClick={() => setSelectedOrderReceiptProof(so)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[11px] cursor-pointer transition-colors border border-emerald-200 dark:border-emerald-800"
                              title="View Customer Handover Confirmation Proof"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Receipt Proof</span>
                            </button>
                          )}

                          {due > 0 && so.status === 'Invoiced' && (
                            <button
                              type="button"
                              onClick={() => handleOpenPayment(so)}
                              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] cursor-pointer transition-colors shadow-xs"
                            >
                              Record Payment
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 px-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(currentPage * pageSize, filteredOrders.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredOrders.length}</span>{' '}
            orders
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors font-medium cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              if (
                totalPages > 7 &&
                pageNum !== 1 &&
                pageNum !== totalPages &&
                Math.abs(pageNum - currentPage) > 2
              ) {
                if (pageNum === 2 || pageNum === totalPages - 1) {
                  return (
                    <span key={pageNum} className="px-1 text-slate-400">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors font-medium cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL: ACCOUNTS ORDER REVIEW & PRODUCT RATE VERIFICATION             */}
      {/* ===================================================================== */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-7 space-y-5 text-xs text-slate-800 dark:text-slate-100 my-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-950/80 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      Accounts Order Copy Verification & Rate Approval
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Approval Stage
                    </span>
                  </div>
                  
                </div>
              </div>

              <div className="text-left sm:text-right font-mono text-xs shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  ORDER / MEMO NO
                </span>
                <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                  {reviewOrder.orderNumber}
                </span>
                <div className="text-slate-400 text-[11px]">Booking Date: {reviewOrder.date}</div>
              </div>
            </div>

           

            {/* Order Copy Meta Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Customer / Buyer:
                </span>
                <div className="font-bold text-slate-900 dark:text-white text-xs">
                  {reviewOrder.customerName}
                </div>
                <div className="text-[11px] text-slate-500">{reviewOrder.channel || 'Direct Retail'}</div>
                {reviewOrder.distributorName && (
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                    Via DB: {reviewOrder.distributorName}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Dispatch Warehouse:
                </span>
                <div className="font-bold text-slate-900 dark:text-white text-xs">
                  {reviewOrder.warehouseName || 'Central Hub'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Salesperson: {reviewOrder.salespersonName || 'Direct Booking'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Payment Terms & Status:
                </span>
                <div className="font-bold text-slate-900 dark:text-white text-xs">
                  {reviewOrder.paymentMethod || 'Credit (Due)'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Upfront Paid: ৳{(reviewOrder.paidAmountBDT || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Line Items Table with Editable Rates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Ordered Product Line Items
                  </h3>
                  {modifiedRatesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {modifiedRatesCount} {modifiedRatesCount === 1 ? 'rate adjusted' : 'rates adjusted'} by Accounts
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">Rates in Bangladeshi Taka (BDT)</span>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3 w-8">#</th>
                      <th className="p-3">Product Description</th>
                      <th className="p-3 text-center">Batch</th>
                      <th className="p-3 text-center">Qty (Pcs)</th>
                      <th className="p-3 text-right">Original Rate</th>
                      <th className="p-3 text-right w-44">
                        Approved Rate (BDT) <span className="text-blue-500">*</span>
                      </th>
                      <th className="p-3 text-right w-28">Discount (৳)</th>
                      <th className="p-3 text-right">Line Total (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {reviewItems.map((item, idx) => {
                      const origRate = originalRates[`${item.productId}-${idx}`] ?? item.unitPriceBDT;
                      const isRateChanged = origRate !== item.unitPriceBDT;
                      const rateDiff = item.unitPriceBDT - origRate;

                      return (
                        <tr
                          key={idx}
                          className={`transition-colors ${
                            isRateChanged
                              ? 'bg-amber-50/50 dark:bg-amber-950/20'
                              : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="p-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>

                          <td className="p-3">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {item.productName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {item.productId}
                            </div>
                          </td>

                          <td className="p-3 text-center font-mono text-[10px] text-purple-600 dark:text-purple-400">
                            {item.batchNumber || 'BT-202610-001'}
                          </td>

                          <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                            {item.quantity}
                          </td>

                          <td className="p-3 text-right font-mono text-slate-500">
                            ৳ {origRate.toLocaleString()}
                          </td>

                          {/* Editable Unit Rate Field for Accounts */}
                          <td className="p-3 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <div className="relative w-full max-w-[150px]">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-xs">
                                  ৳
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.unitPriceBDT}
                                  onChange={(e) => handleRateChange(idx, parseFloat(e.target.value) || 0)}
                                  className={`w-full pl-6 pr-2.5 py-1.5 rounded-lg border text-right font-mono font-bold text-xs focus:outline-hidden focus:ring-2 ${
                                    isRateChanged
                                      ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 focus:ring-amber-500/30'
                                      : 'border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-blue-500/30'
                                  }`}
                                  placeholder="Rate"
                                />
                              </div>

                              {isRateChanged && (
                                <div className="flex items-center gap-1 text-[10px] font-bold">
                                  {rateDiff > 0 ? (
                                    <span className="text-emerald-600 flex items-center">
                                      <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                                      +৳{rateDiff.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-amber-600 flex items-center">
                                      <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                                      -৳{Math.abs(rateDiff).toLocaleString()}
                                    </span>
                                  )}
                                  <span className="text-slate-400">vs original</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Discount Field */}
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.discountBDT || 0}
                              onChange={(e) =>
                                handleItemDiscountChange(idx, parseFloat(e.target.value) || 0)
                              }
                              className="w-20 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-right font-mono text-xs"
                            />
                          </td>

                          {/* Line Total */}
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ৳ {(item.lineTotalBDT || 0).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations & Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-2">
              {/* Accounts Notes & Audit Log */}
              <div className="md:col-span-7 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Accounts Approval Remarks & Rate Adjustment Notes:
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Order copy checked against customer quotation #Q-2026. Negotiated promotional tariff of BDT 1,450 applied per Commercial Director approval."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                />
                <p className="text-[10px] text-slate-400">
                  This note will be permanently stamped on the sales order registry and invoice audit trail.
                </p>
              </div>

              {/* Financial Recalculation Card */}
              <div className="md:col-span-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Subtotal:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ৳ {reviewSubtotal.toLocaleString()}
                  </span>
                </div>

                {reviewTotalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Total Discount:</span>
                    <span>-৳ {reviewTotalDiscount.toLocaleString()}</span>
                  </div>
                )}

                {/* Accounts VAT / Tax Control Box */}
                <div className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-[11px]">
                      VAT / Tax ({reviewEffectiveVatPercent}%):
                    </span>
                    <span className="font-bold font-mono text-xs">
                      ৳ {reviewTaxVat.toLocaleString()}
                    </span>
                  </div>

                  {/* Mode and Quick Presets */}
                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-slate-400 font-sans">Presets:</span>
                      {[0, 5, 7.5, 10, 15].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleReviewVatRateChange(preset)}
                          className={`px-1.5 py-0.5 rounded font-bold font-mono transition-colors cursor-pointer ${
                            reviewVatMode === 'percent' && reviewVatRate === preset
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          {preset}%
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setReviewVatMode('percent')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          reviewVatMode === 'percent'
                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewVatMode('amount')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          reviewVatMode === 'amount'
                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        ৳
                      </button>
                    </div>
                  </div>

                  {/* Interactive Rate & Amount Inputs */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-sans font-medium mb-0.5">Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={reviewVatRate}
                        onChange={(e) => handleReviewVatRateChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-sans font-medium mb-0.5">Amount (৳)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={reviewVatAmount}
                        onChange={(e) => handleReviewVatAmountChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline font-black text-sm">
                  <span className="text-slate-900 dark:text-white">Net Payable:</span>
                  <div className="text-right">
                    <span className="text-blue-600 dark:text-blue-400 text-base">
                      ৳ {reviewNetAmount.toLocaleString()}
                    </span>
                    {reviewOrder.netAmountBDT !== reviewNetAmount && (
                      <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                        Original: ৳{reviewOrder.netAmountBDT.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between text-[11px] pt-1 text-slate-500">
                  <span>Paid Upfront:</span>
                  <span>৳ {(reviewOrder.paidAmountBDT || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-xs pt-1 font-bold text-amber-600 dark:text-amber-400">
                  <span>Balance Due:</span>
                  <span>৳ {reviewDueAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  handleOpenInvoiceModal(reviewOrder);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
                title="View printable tax invoice copy"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>View Full Order Copy / Invoice</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setReviewOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Cancel / Keep Pending
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAccountsApproval}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {modifiedRatesCount > 0
                      ? `Approve with Revised Rates (${modifiedRatesCount})`
                      : 'Approve Sales Order'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: OFFICIAL COMMERCIAL TAX INVOICE                                 */}
      {/* ===================================================================== */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 text-xs text-slate-800 dark:text-slate-100 my-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="text-lg font-black text-blue-600 dark:text-blue-400 tracking-tight">
                  ENSEC BANGLADESH LIMITED
                </div>
                <p className="text-[11px] text-slate-500">
                  National Distributor & Manufacturer • Lithium Energy Storage Systems
                </p>
                <p className="text-[10px] text-slate-400">
                  Tejgaon Industrial Area, Dhaka-1208 • Phone: +880 2 9887766 • BIN: 002391029-0101
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  COMMERCIAL TAX INVOICE
                </span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  {selectedOrderForInvoice.orderNumber}
                </span>
                <div className="text-[10px] text-slate-500">Date: {selectedOrderForInvoice.date}</div>
              </div>
            </div>

            {/* Bill To & Dispatch info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Billed To / Customer:
                </span>
                <div className="font-bold text-slate-900 dark:text-white">
                  {selectedOrderForInvoice.customerName}
                </div>
                <div className="text-slate-500">{selectedOrderForInvoice.channel}</div>
                {selectedOrderForInvoice.distributorName && (
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                    Via DB: {selectedOrderForInvoice.distributorName}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Dispatch Warehouse & Logistics:
                </span>
                <div className="font-bold text-slate-900 dark:text-white">
                  {selectedOrderForInvoice.warehouseName}
                </div>
                <div className="text-slate-500">Salesperson: {selectedOrderForInvoice.salespersonName}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  Payment Terms: {selectedOrderForInvoice.paymentMethod || 'Credit (Due)'}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold border-b border-slate-200 dark:border-slate-800 text-left">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5">Batch</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Rate (BDT)</th>
                    <th className="p-2.5 text-right">Total (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {selectedOrderForInvoice.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5">{item.productName}</td>
                      <td className="p-2.5 font-mono text-[10px] text-purple-600">
                        {item.batchNumber || 'BT-REG-001'}
                      </td>
                      <td className="p-2.5 text-center font-bold font-mono">{item.quantity}</td>
                      <td className="p-2.5 font-mono text-right">৳ {item.unitPriceBDT.toLocaleString()}</td>
                      <td className="p-2.5 font-mono text-right font-bold">
                        ৳ {(item.lineTotalBDT || (item.quantity * item.unitPriceBDT)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Totals */}
            <div className="flex justify-end">
              <div className="w-72 sm:w-80 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>৳ {selectedOrderForInvoice.subTotalBDT.toLocaleString()}</span>
                </div>
                {(selectedOrderForInvoice.discountBDT || 0) > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount:</span>
                    <span>-৳ {(selectedOrderForInvoice.discountBDT || 0).toLocaleString()}</span>
                  </div>
                )}

                {/* VAT / Tax Line with Interactive Input Option */}
                <div className="py-1">
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className="font-semibold text-xs">
                        VAT / Tax ({selectedOrderForInvoice.vatRatePercent !== undefined ? `${selectedOrderForInvoice.vatRatePercent}%` : '5%'}):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isEditingInvoiceVat) {
                            const base = Math.max(0, selectedOrderForInvoice.subTotalBDT - (selectedOrderForInvoice.discountBDT || 0));
                            const currentRate = selectedOrderForInvoice.vatRatePercent !== undefined
                              ? selectedOrderForInvoice.vatRatePercent
                              : (base > 0 && selectedOrderForInvoice.taxVatBDT ? Number(((selectedOrderForInvoice.taxVatBDT / base) * 100).toFixed(2)) : 5);
                            setInvoiceEditVatRate(currentRate);
                            setInvoiceEditVatAmount(selectedOrderForInvoice.taxVatBDT || 0);
                            setInvoiceVatMode('percent');
                          }
                          setIsEditingInvoiceVat(!isEditingInvoiceVat);
                        }}
                        className="print:hidden text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                        title="Change VAT rate percentage or amount for this sales order"
                      >
                        {isEditingInvoiceVat ? 'Cancel' : 'Change VAT'}
                      </button>
                    </div>
                    <span className="font-bold font-mono">
                      ৳ {selectedOrderForInvoice.taxVatBDT.toLocaleString()}
                    </span>
                  </div>

                  {/* Inline VAT Rate & Amount Editor */}
                  {isEditingInvoiceVat && (
                    <div className="print:hidden mt-2 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2 font-sans text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px] uppercase text-blue-700 dark:text-blue-300">
                          Change VAT / Tax
                        </span>
                        <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => setInvoiceVatMode('percent')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                              invoiceVatMode === 'percent'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => setInvoiceVatMode('amount')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                              invoiceVatMode === 'amount'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            ৳
                          </button>
                        </div>
                      </div>

                      {/* Quick presets */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium">Presets:</span>
                        {[0, 5, 7.5, 10, 15].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleInvoiceVatRateChange(preset)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                              invoiceVatMode === 'percent' && invoiceEditVatRate === preset
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {preset}%
                          </button>
                        ))}
                      </div>

                      {/* Inputs for Rate % and Amount ৳ */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Rate (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={invoiceEditVatRate}
                            onChange={(e) => handleInvoiceVatRateChange(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Amount (৳)</label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={invoiceEditVatAmount}
                            onChange={(e) => handleInvoiceVatAmountChange(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsEditingInvoiceVat(false)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveInvoiceVatChange}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Save & Update Invoice
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-white">
                  <span>Net Payable:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    ৳ {selectedOrderForInvoice.netAmountBDT.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold pt-1">
                  <span>Paid:</span>
                  <span>৳ {(selectedOrderForInvoice.paidAmountBDT || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-600 font-bold">
                  <span>Balance Due:</span>
                  <span>
                    ৳{' '}
                    {(
                      selectedOrderForInvoice.dueAmountBDT ??
                      (selectedOrderForInvoice.netAmountBDT - (selectedOrderForInvoice.paidAmountBDT || 0))
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {selectedOrderForInvoice.notes && (
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">Notes / Remarks: </span>
                {selectedOrderForInvoice.notes}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedOrderForInvoice.status === 'Invoiced'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedOrderForInvoice.status === 'Approved'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Status: {selectedOrderForInvoice.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedOrderForInvoice.status === 'Submitted' && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedOrderForInvoice;
                      setSelectedOrderForInvoice(null);
                      handleOpenAccountsApprovalModal(target);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Check & Change Rates</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForInvoice(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: OFFICIAL FACTORY CHALLAN COPY (Requested by User)               */}
      {/* ===================================================================== */}
      {selectedOrderForChallan && (
        <ChallanModal
          order={selectedOrderForChallan}
          onClose={() => setSelectedOrderForChallan(null)}
          onUpdateOrder={updateSalesOrder}
          onSwitchToDO={() => {
            const ord = selectedOrderForChallan;
            setSelectedOrderForChallan(null);
            setSelectedOrderForDO(ord);
          }}
          onDispatchAndInvoice={(orderId) => {
            dispatchAndInvoiceSalesOrder(orderId);
            setNotificationBanner(
              '✅ Order dispatched & invoiced! Factory Challan copy issued. Salesman will now ensure customer receipt.'
            );
            setTimeout(() => setNotificationBanner(null), 5000);
          }}
        />
      )}

      {/* ===================================================================== */}
      {/* MODAL: SALESMAN CUSTOMER RECEIPT CONFIRMATION (Requested by User)     */}
      {/* ===================================================================== */}
      {selectedOrderForCustomerReceipt && (
        <CustomerReceiptModal
          order={selectedOrderForCustomerReceipt}
          onClose={() => setSelectedOrderForCustomerReceipt(null)}
          onConfirmReceipt={(orderId, details) => {
            confirmCustomerReceipt(orderId, details);
            setNotificationBanner(
              `🎉 Sales Order ${selectedOrderForCustomerReceipt.orderNumber} successfully marked as Received by Customer (${details.receiverName})!`
            );
            setTimeout(() => setNotificationBanner(null), 5000);
          }}
        />
      )}

      {/* ===================================================================== */}
      {/* MODAL: CUSTOMER RECEIPT HANDOVER PROOF DETAILS                        */}
      {/* ===================================================================== */}
      {selectedOrderReceiptProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-xs">
            <div className="p-5 bg-linear-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Customer Receipt Handover Certificate</h3>
                  <p className="text-[11px] text-emerald-100">
                    Order: {selectedOrderReceiptProof.orderNumber} • Challan: {selectedOrderReceiptProof.challanNumber || 'BD-ES-2026-12'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderReceiptProof(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Physical Delivery Confirmed &amp; Handed Over</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                  The goods and battery units were verified and handed over to the customer. All serial numbers match the official factory Challan copy.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Received By</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                    {selectedOrderReceiptProof.customerReceiverName || selectedOrderReceiptProof.contactPerson || 'Uzzal Hossain'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Receiver Phone</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-100 text-xs">
                    {selectedOrderReceiptProof.customerReceiverPhone || selectedOrderReceiptProof.deliveryMobile || '+8801327-113571'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Handover Date &amp; Time</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100 text-xs">
                    {selectedOrderReceiptProof.customerReceivedAt || selectedOrderReceiptProof.date}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Assigned Salesman</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100 text-xs">
                    {selectedOrderReceiptProof.deliveryHandoverBy || selectedOrderReceiptProof.salespersonName || 'Abu Jubair Khan'}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Acknowledgement</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    {selectedOrderReceiptProof.customerReceiptSignature || 'Customer Seal & Signature Verified on Physical Challan'}
                  </span>
                </div>
                {selectedOrderReceiptProof.customerReceiverNotes && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Salesman Verification Notes</span>
                    <span className="text-slate-700 dark:text-slate-300 text-xs italic">
                      "{selectedOrderReceiptProof.customerReceiverNotes}"
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const ord = selectedOrderReceiptProof;
                    setSelectedOrderReceiptProof(null);
                    setSelectedOrderForDO(ord);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold"
                  title="View official Factory Delivery Order"
                >
                  <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>View D.O.</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ord = selectedOrderReceiptProof;
                    setSelectedOrderReceiptProof(null);
                    setSelectedOrderForChallan(ord);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold"
                  title="View official Factory Challan"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>View Challan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderReceiptProof(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DELIVERY ORDER (D.O.)                                          */}
      {/* ===================================================================== */}
      {selectedOrderForDO && (
        <DeliveryOrderModal
          order={selectedOrderForDO}
          onClose={() => setSelectedOrderForDO(null)}
          onUpdateOrder={updateSalesOrder}
          onSwitchToChallan={() => {
            const ord = selectedOrderForDO;
            setSelectedOrderForDO(null);
            setSelectedOrderForChallan(ord);
          }}
        />
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Collect Invoice Payment</h3>
                <p className="text-[11px] text-slate-500">Invoice: {showPaymentModal.orderNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400 text-xs">
                  <span>Customer:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {showPaymentModal.customerName}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 text-xs">
                  <span>Total Net:</span>
                  <span className="font-mono">৳ {showPaymentModal.netAmountBDT.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold text-xs">
                  <span>Current Due:</span>
                  <span className="font-mono">
                    ৳{' '}
                    {(
                      showPaymentModal.dueAmountBDT ??
                      (showPaymentModal.netAmountBDT - (showPaymentModal.paidAmountBDT || 0))
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Collection Amount (BDT)
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    showPaymentModal.dueAmountBDT ??
                    (showPaymentModal.netAmountBDT - (showPaymentModal.paidAmountBDT || 0))
                  }
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deposit Account / Cash Book
                </label>
                <select
                  value={payAccount}
                  onChange={(e) => setPayAccount(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value="City Bank PLC">City Bank PLC (A/C: 110-3882-901)</option>
                  <option value="Pubali Bank Ltd">Pubali Bank Ltd (A/C: 088-2991-443)</option>
                  <option value="Dutch Bangla Bank">Dutch Bangla Bank (A/C: 104-9921-552)</option>
                  <option value="Head Office Cash">Head Office Cash</option>
                  <option value="bKash Merchant">bKash Merchant (Wallet: 01711-223344)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instrument / Reference No
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. BEFTN-998812, CQ-8874, bKash TrxID"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors shadow-sm"
                >
                  Post Payment & Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISPATCH & INVOICE CONFIRMATION DIALOG */}
      {orderToDispatchConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-800 dark:text-slate-100 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Factory Dispatch &amp; Invoice
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to dispatch this order and generate its commercial invoice?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 space-y-2 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Number:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{orderToDispatchConfirm.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Buyer:</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">{orderToDispatchConfirm.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Units:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(orderToDispatchConfirm.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0)} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Net Invoice Amount:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  BDT {orderToDispatchConfirm.netAmountBDT?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Factory Challan:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                  {orderToDispatchConfirm.challanNumber || 'Auto Pre-Generated'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                This action will deduct finished goods inventory from factory stock, create the official sales invoice, and mark the order ready for salesman customer handover.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDispatchConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = orderToDispatchConfirm;
                  setOrderToDispatchConfirm(null);
                  dispatchAndInvoiceSalesOrder(target.id);
                  setNotificationBanner(
                    `✅ Factory dispatched & invoiced Order ${target.orderNumber}. Official Challan #${target.challanNumber || 'BD-ES-2026-12'} ready. Salesman will now ensure customer receipt.`
                  );
                  setTimeout(() => setNotificationBanner(null), 6000);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white cursor-pointer shadow-sm transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Yes, Dispatch &amp; Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
