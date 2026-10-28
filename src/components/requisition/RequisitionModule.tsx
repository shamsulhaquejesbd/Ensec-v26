import React, { useState, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  Edit,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  X,
  Check,
  Send,
  Boxes,
  PackageCheck,
  RotateCcw,
  Plus,
  Minus,
  Save,
  ShieldCheck,
  Clock,
  Layers,
  Building,
  User,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Sliders,
  Filter,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { Requisition, RequisitionItem, RequisitionStatus, Product } from '../../types/erp.ts';

export interface RequisitionModuleProps {
  initialTab?: 'create' | 'list' | 'approve' | 'issue' | 'issued' | 'received';
}

// Sample FMCG & Industrial products matching user screenshots
const DEFAULT_CATALOG_ITEMS = [
  { id: 'cat-1', name: 'Lucy Olive Oil 150gm tin (80) 540/-', unit: '80 pcs', price: 428.57, pcsPerCtn: 80, stock: 120 },
  { id: 'cat-2', name: 'Sesa Pro Shine Hair Serum 45ml 245/-', unit: '24 pcs', price: 186.66, pcsPerCtn: 24, stock: 80 },
  { id: 'cat-3', name: 'Sesa Pro Shine Hair Serum 100ml 425/-', unit: '24 pcs', price: 323.81, pcsPerCtn: 24, stock: 60 },
  { id: 'cat-4', name: 'Oxy Deep Wash 50g (C-35) 430/-', unit: '35 pcs', price: 347.05, pcsPerCtn: 35, stock: 50 },
  { id: 'cat-5', name: 'Acnes Creamy Wash 50g 430/-', unit: '20 pcs', price: 347.05, pcsPerCtn: 20, stock: 90 },
  { id: 'cat-6', name: 'Oxy Deep Wash 100g (C-40) 650/-', unit: '40 pcs', price: 524.62, pcsPerCtn: 40, stock: 65 },
  { id: 'cat-7', name: 'Acnes Creamy Wash 100g 650/-', unit: '20 pcs', price: 524.62, pcsPerCtn: 20, stock: 45 },
  { id: 'cat-8', name: 'Acnes Vitamin Cleanser 50g 430/-', unit: '20 pcs', price: 347.05, pcsPerCtn: 20, stock: 75 },
  { id: 'cat-9', name: 'Acnes Vitamin Cleanser 100g 650/-', unit: '20 pcs', price: 524.62, pcsPerCtn: 20, stock: 40 },
  { id: 'cat-10', name: 'Oxy Perfect Wash 50g 430/-', unit: '20 pcs', price: 347.05, pcsPerCtn: 20, stock: 85 },
  { id: 'cat-11', name: 'Ensec LiFePO4 48V 100Ah Rack Unit', unit: '1 pcs', price: 30702.35, pcsPerCtn: 1, stock: 35 },
  { id: 'cat-12', name: 'Optimum PowerPack 12V 200Ah AGM Unit', unit: '1 pcs', price: 24500.00, pcsPerCtn: 1, stock: 40 },
];

export const RequisitionModule: React.FC<RequisitionModuleProps> = ({ initialTab = 'list' }) => {
  const {
    requisitions,
    addRequisition,
    updateRequisition,
    deleteRequisition,
    approveRequisitionByFactory,
    rejectRequisitionByFactory,
    issueRequisitionByAccounts,
    markRequisitionReceived,
    departments,
    distributors,
    customers,
    fieldForceReps,
    products,
    warehouses,
    currentUser,
  } = useERP();

  // Active view tab: 'create' | 'list' | 'approve' | 'issue' | 'issued' | 'received'
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'approve' | 'issue' | 'issued' | 'received'>(initialTab);

  // Requisitions List Filters (Matching Screenshot 2)
  const [startDateFilter, setStartDateFilter] = useState('2026-10-11');
  const [endDateFilter, setEndDateFilter] = useState('2026-10-11');
  const [selectedDistributorFilter, setSelectedDistributorFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Expanded table rows
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);

  // Modals
  const [viewingRequisition, setViewingRequisition] = useState<Requisition | null>(null);
  const [factoryEditRequisition, setFactoryEditRequisition] = useState<Requisition | null>(null);
  const [factoryNotesInput, setFactoryNotesInput] = useState('');
  const [factoryItemsEdit, setFactoryItemsEdit] = useState<RequisitionItem[]>([]);
  const [factorySelectedProdToAdd, setFactorySelectedProdToAdd] = useState<string>('');
  const [factoryNewItemQty, setFactoryNewItemQty] = useState<number>(10);
  
  // Accounts Issue State
  const [issueModalRequisition, setIssueModalRequisition] = useState<Requisition | null>(null);
  const [issueChallanNo, setIssueChallanNo] = useState('');
  const [issueWarehouseId, setIssueWarehouseId] = useState<string>('wh-kushtia');
  const [issueDeliveryPerson, setIssueDeliveryPerson] = useState('Central Logistics Fleet / Driver Md. Kabir (Vehicle # DHAKA-METRO-TA-11-8902)');
  const [issueDate, setIssueDate] = useState('2026-10-11');
  const [issueRemarks, setIssueRemarks] = useState('');
  const [receiveModalRequisition, setReceiveModalRequisition] = useState<Requisition | null>(null);
  const [receiveRemarks, setReceiveRemarks] = useState('');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // CREATE REQUISITION FORM STATE (Selected Field Force for Distributor/Customer)
  // ---------------------------------------------------------------------------
  const [targetType, setTargetType] = useState<'Distributor' | 'Customer'>('Distributor');
  const [formDepartment, setFormDepartment] = useState('DEP-1 - MOUSUMI NETWORK LTD');
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>(distributors[0]?.id || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [selectedFieldForceId, setSelectedFieldForceId] = useState<string>(fieldForceReps[0]?.id || '');
  const [formReqDate, setFormReqDate] = useState('2026-10-11');
  const [formDepositAmount, setFormDepositAmount] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');

  // Selected distributor object & available balance
  const currentDistributor = useMemo(() => {
    return distributors.find((d) => d.id === selectedDistributorId) || distributors[0];
  }, [distributors, selectedDistributorId]);

  const currentCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  // Selected field force rep
  const currentFieldForce = useMemo(() => {
    return fieldForceReps.find((r) => r.id === selectedFieldForceId) || fieldForceReps[0];
  }, [fieldForceReps, selectedFieldForceId]);

  // Sync field force with selected distributor if assigned
  React.useEffect(() => {
    if (targetType === 'Distributor' && currentDistributor) {
      const rep = fieldForceReps.find(
        (r) =>
          (currentDistributor.assignedSalespersonId && r.id === currentDistributor.assignedSalespersonId) ||
          (currentDistributor.assignedSalespersonName && r.name.toLowerCase() === currentDistributor.assignedSalespersonName.toLowerCase()) ||
          (r.distributorId === currentDistributor.id)
      );
      if (rep) {
        setSelectedFieldForceId(rep.id);
      }
    }
  }, [targetType, currentDistributor, fieldForceReps]);

  const availableBalance = useMemo(() => {
    if (targetType === 'Distributor' && currentDistributor) {
      // Calculate remaining credit limit or outstanding
      const outstanding = currentDistributor.currentOutstandingBDT || 16709.42;
      return -Math.round(outstanding);
    }
    if (targetType === 'Customer' && currentCustomer) {
      return (currentCustomer.creditLimitBDT || 50000) - (currentCustomer.outstandingBalanceBDT || 0);
    }
    return -16709.42;
  }, [targetType, currentDistributor, currentCustomer]);

  // Product Grid Rows State for Creation (Clean blank quantities)
  const [gridItems, setGridItems] = useState<
    Array<{
      id: string;
      name: string;
      unit: string;
      price: number;
      pcsPerCtn: number;
      vat: number;
      currentStock: number;
      suggestionQty: number;
      targetQty: number;
      requestedCtn: number | '';
      requestedPcs: number | '';
      freeQty: number;
      discount: number;
    }>
  >(() => {
    return DEFAULT_CATALOG_ITEMS.map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      price: item.price,
      pcsPerCtn: item.pcsPerCtn,
      vat: 0,
      currentStock: item.stock,
      suggestionQty: 0,
      targetQty: 0,
      requestedCtn: '',
      requestedPcs: '',
      freeQty: 0,
      discount: 0,
    }));
  });

  // Handle grid row quantity changes
  const updateGridRowCtn = (index: number, ctnVal: string) => {
    setGridItems((prev) => {
      const next = [...prev];
      const parsedCtn = ctnVal === '' ? '' : parseInt(ctnVal, 10) || 0;
      next[index].requestedCtn = parsedCtn;
      if (parsedCtn !== '') {
        next[index].requestedPcs = (parsedCtn as number) * next[index].pcsPerCtn;
      }
      return next;
    });
  };

  const updateGridRowPcs = (index: number, pcsVal: string) => {
    setGridItems((prev) => {
      const next = [...prev];
      const parsedPcs = pcsVal === '' ? '' : parseInt(pcsVal, 10) || 0;
      next[index].requestedPcs = parsedPcs;
      return next;
    });
  };

  // Calculations for Form
  const formCalculations = useMemo(() => {
    let subtotal = 0;
    let totalItems = 0;
    gridItems.forEach((row) => {
      const pcs = typeof row.requestedPcs === 'number' ? row.requestedPcs : 0;
      if (pcs > 0) {
        subtotal += pcs * row.price;
        totalItems++;
      }
    });
    return {
      subtotal,
      vat: 0,
      discount: 0,
      netTotal: subtotal,
      totalItems,
    };
  }, [gridItems]);

  // Submit Requisition by Field Force
  const handleCreateRequisitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const filledRows = gridItems.filter((row) => {
      const pcs = typeof row.requestedPcs === 'number' ? row.requestedPcs : 0;
      return pcs > 0;
    });

    if (filledRows.length === 0) {
      alert('Please enter quantity for at least one item.');
      return;
    }

    const items: RequisitionItem[] = filledRows.map((r) => {
      const pcs = typeof r.requestedPcs === 'number' ? r.requestedPcs : 0;
      const ctn = typeof r.requestedCtn === 'number' ? r.requestedCtn : 0;
      const lineGross = pcs * r.price;
      return {
        productId: r.id,
        itemCode: r.id.toUpperCase(),
        itemName: r.name,
        unit: r.unit,
        price: r.price,
        vat: r.vat,
        currentStock: r.currentStock,
        suggestionQty: r.suggestionQty,
        targetQty: r.targetQty,
        requestedCtn: ctn,
        requestedPcs: pcs,
        approvedCtn: ctn,
        approvedPcs: pcs,
        freeQty: r.freeQty,
        discount: r.discount,
        grossTotal: lineGross,
        netTotal: lineGross,
      };
    });

    const dep = departments.find((d) => d.name === formDepartment || d.fullName === formDepartment);

    // Numeric deposit extraction
    const numericDeposit = parseFloat(formDepositAmount.replace(/[^0-9.]/g, '')) || 0;

    const newReqId = addRequisition({
      requisitionDate: formReqDate,
      departmentId: dep?.id || 'dept-1',
      departmentName: formDepartment,
      targetType,
      distributorId: targetType === 'Distributor' ? currentDistributor?.id : undefined,
      distributorName: targetType === 'Distributor' ? currentDistributor?.name || 'Selected Distributor' : '',
      customerId: targetType === 'Customer' ? currentCustomer?.id : undefined,
      customerName: targetType === 'Customer' ? currentCustomer?.name || 'Selected Customer' : '',
      fieldForceId: currentFieldForce?.id || 'u-6',
      fieldForceCode: currentFieldForce?.code || 'MEL00143',
      fieldForceName: currentFieldForce?.name || 'Field Officer',
      availableBalance,
      depositAmount: numericDeposit,
      depositNotes: formDepositAmount,
      status: 'Requested',
      items,
      vat: 0,
      lineDiscount: 0,
      subtotalDiscount: 0,
      discountTotal: 0,
      subtotal: formCalculations.subtotal,
      netTotal: formCalculations.netTotal,
    });

    // Reset Create Requisition page completely to blank
    handleResetCreateForm();

    showToast(`Requisition submitted successfully by ${currentFieldForce?.name}! Create page has been reset.`);
    setActiveTab('list');
  };

  // Reset Create Form to blank
  const handleResetCreateForm = () => {
    setGridItems((prev) =>
      prev.map((r) => ({
        ...r,
        requestedCtn: '',
        requestedPcs: '',
        freeQty: 0,
        discount: 0,
      }))
    );
    setFormDepositAmount('');
    setProductSearch('');
    setFormReqDate(new Date().toISOString().substring(0, 10));
  };

  // ---------------------------------------------------------------------------
  // FACTORY REVIEW & APPROVAL LOGIC (Factory can edit, add, increase/decrease qty)
  // ---------------------------------------------------------------------------
  const handleOpenFactoryReview = (req: Requisition) => {
    setFactoryEditRequisition(req);
    setFactoryNotesInput(req.factoryNotes || `Approved by Kushtia Plant Planning Operations. Reserved from line batch.`);
    setFactorySelectedProdToAdd('');
    setFactoryNewItemQty(10);
    setFactoryItemsEdit(
      req.items.map((i) => ({
        ...i,
        approvedCtn: i.approvedCtn ?? i.requestedCtn,
        approvedPcs: i.approvedPcs ?? i.requestedPcs,
      }))
    );
  };

  const handleFactorySetPcs = (index: number, newPcs: number) => {
    setFactoryItemsEdit((prev) => {
      const next = [...prev];
      const item = next[index];
      const val = Math.max(0, isNaN(newPcs) ? 0 : newPcs);
      item.approvedPcs = val;
      item.netTotal = val * item.price;
      item.grossTotal = val * item.price;
      return next;
    });
  };

  const handleFactoryAdjustPcs = (index: number, delta: number) => {
    setFactoryItemsEdit((prev) => {
      const next = [...prev];
      const item = next[index];
      const current = item.approvedPcs ?? item.requestedPcs;
      const updated = Math.max(0, current + delta);
      item.approvedPcs = updated;
      item.netTotal = updated * item.price;
      item.grossTotal = updated * item.price;
      return next;
    });
  };

  const handleFactoryIncreaseQty = (index: number) => {
    handleFactoryAdjustPcs(index, 10);
  };

  const handleFactoryDecreaseQty = (index: number) => {
    handleFactoryAdjustPcs(index, -10);
  };

  const handleFactoryRemoveItem = (index: number) => {
    setFactoryItemsEdit((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFactoryAddCatalogItem = (product: typeof DEFAULT_CATALOG_ITEMS[0]) => {
    const existing = factoryItemsEdit.find((i) => i.productId === product.id);
    if (existing) {
      showToast(`${product.name} is already in the requisition list.`);
      return;
    }
    const newItem: RequisitionItem = {
      productId: product.id,
      itemCode: product.id.toUpperCase(),
      itemName: product.name,
      unit: product.unit,
      price: product.price,
      vat: 0,
      currentStock: product.stock,
      suggestionQty: 0,
      targetQty: 0,
      requestedCtn: 1,
      requestedPcs: product.pcsPerCtn,
      approvedCtn: 1,
      approvedPcs: product.pcsPerCtn,
      freeQty: 0,
      discount: 0,
      grossTotal: product.pcsPerCtn * product.price,
      netTotal: product.pcsPerCtn * product.price,
    };
    setFactoryItemsEdit((prev) => [...prev, newItem]);
  };

  // Factory add item from finished products directory
  const handleFactoryAddFromAllProducts = () => {
    if (!factorySelectedProdToAdd) return;
    
    // Check catalog items first
    const catalogItem = DEFAULT_CATALOG_ITEMS.find((c) => c.id === factorySelectedProdToAdd);
    if (catalogItem) {
      handleFactoryAddCatalogItem(catalogItem);
      setFactorySelectedProdToAdd('');
      return;
    }

    // Check ERP products
    const erpProd = products.find((p) => p.id === factorySelectedProdToAdd);
    if (erpProd) {
      const existing = factoryItemsEdit.find((i) => i.productId === erpProd.id);
      if (existing) {
        showToast(`${erpProd.name} is already in the requisition list.`);
        return;
      }
      const qty = factoryNewItemQty > 0 ? factoryNewItemQty : 1;
      const unitPrice = erpProd.customerPriceBDT || erpProd.distributorPriceBDT || 1500;
      const newItem: RequisitionItem = {
        productId: erpProd.id,
        itemCode: erpProd.code,
        itemName: `${erpProd.name} (${erpProd.capacityAh ? `${erpProd.capacityAh}Ah` : erpProd.category})`,
        unit: erpProd.unit || 'pcs',
        price: unitPrice,
        vat: 0,
        currentStock: 50,
        suggestionQty: 0,
        targetQty: 0,
        requestedCtn: 1,
        requestedPcs: qty,
        approvedCtn: 1,
        approvedPcs: qty,
        freeQty: 0,
        discount: 0,
        grossTotal: qty * unitPrice,
        netTotal: qty * unitPrice,
      };
      setFactoryItemsEdit((prev) => [...prev, newItem]);
      setFactorySelectedProdToAdd('');
      showToast(`Added ${erpProd.name} to factory indent.`);
    }
  };

  const handleConfirmFactoryApproval = () => {
    if (!factoryEditRequisition) return;
    approveRequisitionByFactory(factoryEditRequisition.id, factoryNotesInput, factoryItemsEdit);
    showToast(`Requisition ${factoryEditRequisition.requisitionNo} approved by Factory! Transferred to Accounts & Issue queue.`);
    setFactoryEditRequisition(null);
  };

  const handleConfirmFactoryReject = () => {
    if (!factoryEditRequisition) return;
    rejectRequisitionByFactory(factoryEditRequisition.id, factoryNotesInput || 'Rejected due to stock unavailability.');
    showToast(`Requisition ${factoryEditRequisition.requisitionNo} rejected.`);
    setFactoryEditRequisition(null);
  };

  // ---------------------------------------------------------------------------
  // ACCOUNTS & STORE ISSUE DISPATCH LOGIC (Send product or issue challan)
  // ---------------------------------------------------------------------------
  const handleOpenIssueModal = (req: Requisition) => {
    setIssueModalRequisition(req);
    setIssueChallanNo(`CH-KUS-2026-${Math.floor(100 + Math.random() * 900)}`);
    setIssueWarehouseId(warehouses[0]?.id || 'wh-kushtia');
    setIssueDeliveryPerson('Central Logistics Fleet / Driver Md. Kabir (Vehicle # DHAKA-METRO-TA-11-8902)');
    setIssueDate(new Date().toISOString().substring(0, 10));
    setIssueRemarks(`Dispatched from Central Factory Warehouse. Transport vehicle engaged.`);
  };

  const handleConfirmIssue = () => {
    if (!issueModalRequisition) return;
    const wh = warehouses.find((w) => w.id === issueWarehouseId);
    const issueSummary = `${issueRemarks} | Dispatch Point: ${wh?.name || 'Kushtia Factory Plant'} | Delivery: ${issueDeliveryPerson} | Date: ${issueDate}`;
    issueRequisitionByAccounts(issueModalRequisition.id, issueChallanNo, issueSummary);
    showToast(`Requisition ${issueModalRequisition.requisitionNo} issued! Challan ${issueChallanNo} generated.`);
    setIssueModalRequisition(null);
  };

  // ---------------------------------------------------------------------------
  // RECEIVED CONFIRMATION LOGIC
  // ---------------------------------------------------------------------------
  const handleOpenReceiveModal = (req: Requisition) => {
    setReceiveModalRequisition(req);
    setReceiveRemarks('All items received and verified against Delivery Challan in sound condition.');
  };

  const handleConfirmReceived = () => {
    if (!receiveModalRequisition) return;
    markRequisitionReceived(receiveModalRequisition.id, receiveRemarks);
    showToast(`Requisition ${receiveModalRequisition.requisitionNo} marked as Received! Delivery cycle complete.`);
    setReceiveModalRequisition(null);
  };

  // Toggle row expansion
  const toggleRowExpanded = (id: string) => {
    setExpandedRowIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Filtered Requisitions for List View
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      // Distributor filter
      if (selectedDistributorFilter !== 'ALL' && req.distributorName !== selectedDistributorFilter) {
        return false;
      }
      // Status filter
      if (activeTab === 'approve') {
        if (req.status !== 'Requested') return false;
      } else if (activeTab === 'issue') {
        if (req.status !== 'Approved') return false;
      } else if (activeTab === 'issued') {
        if (req.status !== 'Issued') return false;
      } else if (activeTab === 'received') {
        if (req.status !== 'Received') return false;
      } else if (statusFilter !== 'ALL') {
        if (req.status !== statusFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNo = req.requisitionNo.toLowerCase().includes(q);
        const matchesDist = (req.distributorName || '').toLowerCase().includes(q);
        const matchesCust = (req.customerName || '').toLowerCase().includes(q);
        const matchesRep = (req.fieldForceCode || '').toLowerCase().includes(q);
        if (!matchesNo && !matchesDist && !matchesCust && !matchesRep) return false;
      }

      return true;
    });
  }, [requisitions, selectedDistributorFilter, activeTab, statusFilter, searchQuery]);

  // Paginated List
  const totalPages = Math.ceil(filteredRequisitions.length / pageSize) || 1;
  const paginatedRequisitions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequisitions.slice(start, start + pageSize);
  }, [filteredRequisitions, currentPage, pageSize]);

  // Export to Excel / CSV
  const handleExportCSV = () => {
    const headers = ['REQN NO', 'REQN DATE', 'STATUS', 'DISTRIBUTOR/CUSTOMER', 'REQUESTED BY', 'VAT', 'NET TOTAL'];
    const rows = filteredRequisitions.map((r) => [
      `"${r.requisitionNo}"`,
      `"${r.requisitionDate}"`,
      `"${r.status}"`,
      `"${r.distributorName || r.customerName}"`,
      `"${r.fieldForceCode}"`,
      r.vat.toFixed(2),
      r.netTotal.toFixed(2),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Requisition_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs Bar matching Screenshot 1 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create New Requisition</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('list');
              setStatusFilter('ALL');
            }}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Requisitions ({requisitions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('approve')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'approve'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Approve Requisition ({requisitions.filter((r) => r.status === 'Requested').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('issue')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'issue'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Issue Requisition ({requisitions.filter((r) => r.status === 'Approved').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('issued')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'issued'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Issued Requisition ({requisitions.filter((r) => r.status === 'Issued').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('received')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'received'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Received Requisition ({requisitions.filter((r) => r.status === 'Received').length})</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2">
          Factory Indent &amp; Dispatch Engine
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW: CREATE REQUISITION (Matching Screenshot 3)                          */}
      {/* ========================================================================= */}
      {activeTab === 'create' && (
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-normal text-[#0284c7] dark:text-sky-400">
              Create Requisition
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Target Type:</span>
              <button
                type="button"
                onClick={() => setTargetType('Distributor')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  targetType === 'Distributor'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                Distributor
              </button>
              <button
                type="button"
                onClick={() => setTargetType('Customer')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  targetType === 'Customer'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                Customer
              </button>
            </div>
          </div>

          {/* Form Header Section matching Screenshot 3 */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <form onSubmit={handleCreateRequisitionSubmit} className="space-y-4">
              {/* Row 1: Department & Distributor/Customer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-[#0284c7] dark:text-sky-400 mb-1">
                    Department<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.fullName || d.name}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Distributor or Customer */}
                <div>
                  <label className="block text-xs font-semibold text-[#0284c7] dark:text-sky-400 mb-1">
                    {targetType === 'Distributor' ? 'Distributor' : 'Customer'}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    {targetType === 'Distributor' ? (
                      <select
                        value={selectedDistributorId}
                        onChange={(e) => setSelectedDistributorId(e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-2 pr-8 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                      >
                        {distributors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.code} - {d.name} ({d.territory})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-2 pr-8 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                      >
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Selected Field Force & Requisition Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {/* Field Force Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#0284c7] dark:text-sky-400">
                      Selected Field Force (SR / Officer)<span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Creating on behalf of client
                    </span>
                  </div>
                  <select
                    value={selectedFieldForceId}
                    onChange={(e) => setSelectedFieldForceId(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                  >
                    {fieldForceReps.map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.code} - {rep.name} ({rep.designation} • {rep.territory || rep.area})
                      </option>
                    ))}
                  </select>
                  {currentFieldForce && (
                    <div className="mt-1.5 p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-[11px] flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-sky-700 dark:text-sky-300">
                        {currentFieldForce.code}: {currentFieldForce.name}
                      </span>
                      <span>•</span>
                      <span>Designation: <b className="text-slate-800 dark:text-white">{currentFieldForce.designation}</b></span>
                      <span>•</span>
                      <span>Territory: <b className="text-slate-800 dark:text-white">{currentFieldForce.territory || currentFieldForce.area}</b></span>
                      <span>•</span>
                      <span>Phone: <b className="text-slate-800 dark:text-white">{currentFieldForce.phone}</b></span>
                    </div>
                  )}
                </div>

                {/* Requisition Date */}
                <div>
                  <label className="block text-xs font-semibold text-[#0284c7] dark:text-sky-400 mb-1">
                    Requisition Date<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formReqDate}
                    onChange={(e) => setFormReqDate(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                  />
                  <div className="mt-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
                    Auto-stamped indent voucher generation date.
                  </div>
                </div>
              </div>

              {/* Row 3: Available Balance & Deposit Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {/* Available Balance */}
                <div>
                  <label className="block text-xs font-semibold text-[#0284c7] dark:text-sky-400 mb-1">
                    Available Balance
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={availableBalance.toFixed(2)}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 rounded-md px-3 py-2 text-xs sm:text-sm font-mono text-slate-700 dark:text-slate-300"
                  />
                </div>

                {/* Deposit Amount */}
                <div>
                  <label className="block text-xs font-semibold text-[#0284c7] dark:text-sky-400 mb-1">
                    Deposit Amount
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Deposit Amount (e.g. 15000 taka)"
                    value={formDepositAmount}
                    onChange={(e) => setFormDepositAmount(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                  />
                </div>
              </div>

              {/* Row 4: Search Product */}
              <div>
                <label className="block text-xs font-semibold text-[#0284c7] dark:text-sky-400 mb-1">
                  Search Product
                </label>
                <input
                  type="text"
                  placeholder="Search item by name..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                />
              </div>

              {/* Product Grid / Table matching Screenshot 3 */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#dce9f5] dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700 w-8 text-center">#</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700 min-w-[240px]">Item Name</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center">Unit</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-right">Price</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center">VAT</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center">Current Stock</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center">Suggestion Qty</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center">TargetQty</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center w-24">Requested Ctn</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center w-24">Requested Pcs</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center">Free Qty</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center">Discount</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-right">GrossTotal</th>
                      <th className="p-2 text-right">NetTotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {gridItems
                      .filter((row) => !productSearch || row.name.toLowerCase().includes(productSearch.toLowerCase()))
                      .map((row, idx) => {
                        const originalIdx = gridItems.findIndex((r) => r.id === row.id);
                        const pcs = typeof row.requestedPcs === 'number' ? row.requestedPcs : 0;
                        const hasQty = pcs > 0;
                        const lineGross = pcs * row.price;

                        return (
                          <tr
                            key={row.id}
                            className={`transition-colors ${
                              hasQty
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="p-2 text-center text-slate-500 border-r border-slate-200 dark:border-slate-800">
                              {idx + 1}
                            </td>
                            {/* Item Name: highlighted in mint green like screenshot 3 when active */}
                            <td
                              className={`p-2 font-medium border-r border-slate-200 dark:border-slate-800 ${
                                hasQty
                                  ? 'bg-[#85efb9] text-slate-900 font-semibold'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {row.name}
                            </td>
                            <td className="p-2 text-center text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                              {row.unit}
                            </td>
                            <td className="p-2 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                              {row.price.toFixed(2)}
                            </td>
                            <td className="p-2 text-center text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                              {row.vat}
                            </td>
                            <td className="p-2 text-center text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                              {row.currentStock}
                            </td>
                            <td className="p-2 text-center text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                              {row.suggestionQty}
                            </td>
                            <td className="p-2 text-center text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                              {row.targetQty}
                            </td>
                            {/* Requested Ctn: input box with mint green when filled */}
                            <td
                              className={`p-1.5 text-center border-r border-slate-200 dark:border-slate-800 ${
                                hasQty ? 'bg-[#85efb9]' : ''
                              }`}
                            >
                              <input
                                type="number"
                                min="0"
                                value={row.requestedCtn}
                                onChange={(e) => updateGridRowCtn(originalIdx, e.target.value)}
                                className="w-full text-center border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
                              />
                            </td>
                            {/* Requested Pcs: input box with mint green when filled */}
                            <td
                              className={`p-1.5 text-center border-r border-slate-200 dark:border-slate-800 ${
                                hasQty ? 'bg-[#85efb9]' : ''
                              }`}
                            >
                              <input
                                type="number"
                                min="0"
                                value={row.requestedPcs}
                                onChange={(e) => updateGridRowPcs(originalIdx, e.target.value)}
                                className="w-full text-center border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
                              />
                            </td>
                            <td className="p-2 text-center text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                              {row.freeQty}
                            </td>
                            <td className="p-2 text-center text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                              {row.discount}
                            </td>
                            <td className="p-2 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                              {lineGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-right font-mono font-semibold text-slate-900 dark:text-white">
                              {lineGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Total Summary Row & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-slate-500">Selected Items:</span>{' '}
                    <span className="font-bold">{formCalculations.totalItems}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Subtotal:</span>{' '}
                    <span className="font-mono font-bold">
                      ৳ {formCalculations.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Deposit:</span>{' '}
                    <span className="font-mono text-emerald-600 font-bold">{formDepositAmount}</span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800">
                    <span className="text-blue-700 dark:text-blue-300 font-semibold">Net Total:</span>{' '}
                    <span className="font-mono font-black text-sm text-blue-800 dark:text-blue-200">
                      ৳ {formCalculations.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-4 py-2 border border-[#0284c7] text-[#0284c7] hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Back to List
                  </button>

                  <button
                    type="button"
                    onClick={handleResetCreateForm}
                    className="px-4 py-2 border border-[#0284c7] text-[#0284c7] hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Submit Requisition</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: REQUISITION LIST (Matching Screenshot 2)                            */}
      {/* ========================================================================= */}
      {activeTab !== 'create' && (
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-normal text-[#0284c7] dark:text-sky-400">
                {activeTab === 'approve'
                  ? 'Approve Requisitions (Factory Indent Queue)'
                  : activeTab === 'issue'
                  ? 'Issue Requisitions (Accounts & Dispatch)'
                  : activeTab === 'issued'
                  ? 'Issued Requisitions (In-Transit)'
                  : activeTab === 'received'
                  ? 'Received Requisitions'
                  : 'Requisition List'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === 'approve'
                  ? 'Factory operations queue: review items, adjust product quantities, and approve indents.'
                  : activeTab === 'issue'
                  ? 'Approved indents ready for accounts voucher issue and store dispatch.'
                  : ''}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('create')}
              className="px-4 py-2 border border-[#0284c7] text-[#0284c7] hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg text-xs sm:text-sm font-normal transition-colors cursor-pointer"
            >
              Add New Requisition
            </button>
          </div>

          {/* Filter Bar matching Screenshot 2 */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            {/* Filter Row 1: Start Date, End Date, Distributor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-[#0284c7] dark:text-sky-400 whitespace-nowrap min-w-[70px]">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-[#0284c7] dark:text-sky-400 whitespace-nowrap min-w-[70px]">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-[#0284c7] dark:text-sky-400 whitespace-nowrap min-w-[70px]">
                  Distributor
                </label>
                <select
                  value={selectedDistributorFilter}
                  onChange={(e) => setSelectedDistributorFilter(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                >
                  <option value="ALL">Select distributor (All)</option>
                  {distributors.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Row 2: Search, Status, XLS, Preview */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
              <div className="flex flex-wrap items-center gap-4 flex-1">
                <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                  <label className="text-xs font-semibold text-[#0284c7] dark:text-sky-400 whitespace-nowrap">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search by RequisitionNo, Distributor"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-[#0284c7] dark:text-sky-400 whitespace-nowrap">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 min-w-[130px] focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                  >
                    <option value="ALL">Select status (All)</option>
                    <option value="Requested">Requested</option>
                    <option value="Approved">Approved</option>
                    <option value="Issued">Issued</option>
                    <option value="Received">Received</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons: XLS, Preview */}
              <div className="flex items-center gap-2 self-end lg:self-center">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  title="Export to Excel"
                  className="p-1 hover:opacity-80 transition-opacity cursor-pointer inline-flex items-center"
                >
                  <div className="w-8 h-8 rounded border border-emerald-600 bg-white dark:bg-slate-800 flex flex-col items-center justify-center p-0.5">
                    <div className="bg-emerald-600 text-white rounded-xs text-[9px] font-black px-1 leading-none py-0.5">
                      XLS
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    showToast(`Found ${filteredRequisitions.length} requisition records.`);
                  }}
                  className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-4 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              </div>
            </div>
          </div>

          {/* Requisition Data Table matching Screenshot 2 */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#dce9f5] dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    <th className="py-2.5 px-3 font-semibold text-[#0284c7] dark:text-sky-300 text-center w-28">ACTION</th>
                    <th className="py-2.5 px-3 font-semibold text-[#0284c7] dark:text-sky-300">REQN NO</th>
                    <th className="py-2.5 px-3 font-semibold text-[#0284c7] dark:text-sky-300">REQN. DATE</th>
                    <th className="py-2.5 px-3 font-semibold text-[#0284c7] dark:text-sky-300">STATUS</th>
                    <th className="py-2.5 px-3 font-semibold text-[#0284c7] dark:text-sky-300">DISTRIBUTOR</th>
                    <th className="py-2.5 px-3 font-semibold text-[#0284c7] dark:text-sky-300">REQUESTED BY</th>
                    <th className="py-2.5 px-3 font-semibold text-[#0284c7] dark:text-sky-300 text-right">VAT</th>
                    <th className="py-2.5 px-3 font-semibold text-[#0284c7] dark:text-sky-300 text-center">LINE DISC</th>
                    <th className="py-2.5 px-3 font-semibold text-[#0284c7] dark:text-sky-300 text-center">SUBTOTAL DISC</th>
                    <th className="py-2.5 px-3 font-semibold text-[#0284c7] dark:text-sky-300 text-right">DISC TOTAL</th>
                    <th className="py-2.5 px-3 font-semibold text-[#0284c7] dark:text-sky-300 text-right">NET TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedRequisitions.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-slate-400">
                        No requisitions found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedRequisitions.map((req) => {
                      const isExpanded = expandedRowIds.includes(req.id);
                      return (
                        <React.Fragment key={req.id}>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-slate-700 dark:text-slate-300">
                            {/* ACTION BUTTONS */}
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {/* Expand row details */}
                                <button
                                  type="button"
                                  onClick={() => toggleRowExpanded(req.id)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                  title="Expand items"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-[#0284c7]" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {/* View modal */}
                                <button
                                  type="button"
                                  onClick={() => setViewingRequisition(req)}
                                  className="w-6 h-6 rounded border border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 flex items-center justify-center cursor-pointer"
                                  title="View Requisition"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit / Factory Indent Review */}
                                {req.status === 'Requested' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenFactoryReview(req)}
                                    className="px-2 py-1 rounded border border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 flex items-center gap-1 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                                    title="Factory Review: Edit items, adjust quantity & Approve/Reject"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Factory Review</span>
                                  </button>
                                )}

                                {/* Approved actions: Issue & Send */}
                                {req.status === 'Approved' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenIssueModal(req)}
                                      className="px-2 py-1 rounded border border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 flex items-center gap-1 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                                      title="Accounts Issue & Dispatch Delivery Challan"
                                    >
                                      <Send className="w-3 h-3 text-blue-600" />
                                      <span>Issue &amp; Send</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => window.print()}
                                      className="w-6 h-6 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer shrink-0"
                                      title="Print Requisition"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Delete requisition ${req.requisitionNo}?`)) {
                                          deleteRequisition(req.id);
                                          showToast(`Deleted requisition ${req.requisitionNo}`);
                                        }
                                      }}
                                      className="w-6 h-6 rounded border border-rose-300 text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer shrink-0"
                                      title="Delete Requisition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}

                                {/* Issued actions */}
                                {req.status === 'Issued' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReceiveModal(req)}
                                    className="px-2 py-1 rounded border border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center gap-1 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                                    title="Confirm Goods Received"
                                  >
                                    <Boxes className="w-3 h-3" />
                                    <span>Mark Received</span>
                                  </button>
                                )}

                                {/* Received actions */}
                                {req.status === 'Received' && (
                                  <span className="text-[10px] text-emerald-600 font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                                    ✓ Received
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                              {req.requisitionNo}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {req.requisitionDate}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  req.status === 'Approved'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : req.status === 'Requested'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : req.status === 'Issued'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : req.status === 'Received'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {req.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                              {req.distributorName || req.customerName}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                              {req.fieldForceCode}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                              {req.vat.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                              {req.lineDiscount}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                              {req.subtotalDiscount}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                              {req.discountTotal.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {req.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>

                          {/* Expanded Row: Items preview & status action */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                              <td colSpan={11} className="p-4 pl-12 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                                  <div className="flex items-center gap-4 text-xs">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      Department: {req.departmentName}
                                    </span>
                                    {req.depositNotes && (
                                      <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                                        Deposit: {req.depositNotes}
                                      </span>
                                    )}
                                    {req.challanNo && (
                                      <span className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded font-mono">
                                        Challan: {req.challanNo}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {req.status === 'Requested' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenFactoryReview(req)}
                                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                      >
                                        <Edit className="w-3 h-3" />
                                        <span>Factory Review &amp; Edit Qty</span>
                                      </button>
                                    )}
                                    {req.status === 'Approved' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenIssueModal(req)}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                      >
                                        <Send className="w-3 h-3" />
                                        <span>Issue &amp; Send Products</span>
                                      </button>
                                    )}
                                    {req.status === 'Issued' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenReceiveModal(req)}
                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                      >
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Confirm Delivery Received</span>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Items mini-table */}
                                <div className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-white dark:bg-slate-900">
                                  <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 font-semibold border-b border-slate-200 dark:border-slate-700">
                                      <tr>
                                        <th className="p-2">Item Name</th>
                                        <th className="p-2 text-center">Unit</th>
                                        <th className="p-2 text-right">Price</th>
                                        <th className="p-2 text-center">Requested (Ctn / Pcs)</th>
                                        <th className="p-2 text-center">Approved Pcs</th>
                                        <th className="p-2 text-right">Line Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                      {req.items.map((item, idx) => (
                                        <tr key={idx}>
                                          <td className="p-2 font-medium">{item.itemName}</td>
                                          <td className="p-2 text-center text-slate-500">{item.unit}</td>
                                          <td className="p-2 text-right font-mono">৳ {item.price.toFixed(2)}</td>
                                          <td className="p-2 text-center font-mono">
                                            {item.requestedCtn} ctn ({item.requestedPcs} pcs)
                                          </td>
                                          <td className="p-2 text-center font-mono font-bold text-emerald-600">
                                            {item.approvedPcs ?? item.requestedPcs} pcs
                                          </td>
                                          <td className="p-2 text-right font-mono font-semibold">
                                            ৳ {item.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {req.factoryNotes && (
                                  <div className="text-[11px] text-slate-500 italic">
                                    🏭 Factory Notes: {req.factoryNotes} (by {req.factoryReviewedBy})
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & Footer summary */}
            <div className="p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <div>
                Showing {paginatedRequisitions.length} of {filteredRequisitions.length} requisitions
              </div>
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
      {/* MODAL: FACTORY REVIEW & QUANTITY EDIT (As requested)                      */}
      {/* ========================================================================= */}
      {factoryEditRequisition && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50 dark:bg-amber-950/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Factory Indent Review: {factoryEditRequisition.requisitionNo}
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Factory can edit items, increase/decrease quantities, or add products before approval.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFactoryEditRequisition(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-500">Distributor/Client:</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {factoryEditRequisition.distributorName || factoryEditRequisition.customerName}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Department:</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {factoryEditRequisition.departmentName}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Requested By:</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {factoryEditRequisition.fieldForceCode}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Requisition Date:</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {factoryEditRequisition.requisitionDate}
                  </div>
                </div>
              </div>

              {/* Items Quantity Adjustment Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <h4 className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Indent Item Quantities (Adjust / Increase / Decrease)
                  </h4>
                  <span className="text-slate-500 text-[11px]">Type exact quantity or click buttons to increase/decrease</span>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#dce9f5] dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                      <tr>
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5 text-center">Unit</th>
                        <th className="p-2.5 text-right">Price</th>
                        <th className="p-2.5 text-center">Requested Pcs</th>
                        <th className="p-2.5 text-center">Factory Approved Qty (Pcs)</th>
                        <th className="p-2.5 text-right">Net BDT</th>
                        <th className="p-2.5 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {factoryItemsEdit.map((item, idx) => {
                        const approvedPcs = item.approvedPcs ?? item.requestedPcs;
                        const lineTotal = approvedPcs * item.price;
                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-medium">{item.itemName}</td>
                            <td className="p-2.5 text-center text-slate-500">{item.unit}</td>
                            <td className="p-2.5 text-right font-mono">৳ {item.price.toFixed(2)}</td>
                            <td className="p-2.5 text-center font-mono text-slate-500">{item.requestedPcs}</td>
                            
                            {/* Quantity modifier controls (+ / - and direct input) */}
                            <td className="p-2.5 text-center">
                              <div className="inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-white dark:bg-slate-800">
                                <button
                                  type="button"
                                  onClick={() => handleFactoryAdjustPcs(idx, -10)}
                                  className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-200 cursor-pointer"
                                  title="Decrease 10 pcs"
                                >
                                  -10
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFactoryAdjustPcs(idx, -1)}
                                  className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-[11px] text-slate-700 dark:text-slate-200 cursor-pointer"
                                  title="Decrease 1 pc"
                                >
                                  -1
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={approvedPcs}
                                  onChange={(e) => handleFactorySetPcs(idx, parseInt(e.target.value, 10))}
                                  className="w-16 text-center font-mono font-bold text-xs bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded py-0.5 text-emerald-800 dark:text-emerald-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleFactoryAdjustPcs(idx, 1)}
                                  className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-[11px] text-slate-700 dark:text-slate-200 cursor-pointer"
                                  title="Increase 1 pc"
                                >
                                  +1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFactoryAdjustPcs(idx, 10)}
                                  className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-200 cursor-pointer"
                                  title="Increase 10 pcs"
                                >
                                  +10
                                </button>
                              </div>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                              ৳ {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleFactoryRemoveItem(idx)}
                                className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                title="Remove item from indent"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Product from Catalog / Finished Goods option */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    + Add Product to Indent (Catalog or Factory Inventory)
                  </label>
                  <span className="text-[11px] text-slate-500">Factory can append new products before approval</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select
                    value={factorySelectedProdToAdd}
                    onChange={(e) => setFactorySelectedProdToAdd(e.target.value)}
                    className="flex-1 w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">-- Choose Product to Add to Indent --</option>
                    <optgroup label="FMCG & Fast-Moving Items">
                      {DEFAULT_CATALOG_ITEMS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — ৳ {c.price.toFixed(2)} (Stock: {c.stock})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Enterprise Finished Batteries & Packs">
                      {products.map((p) => {
                        const price = p.customerPriceBDT || p.retailPriceBDT || 1500;
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} [{p.code}] — ৳ {price.toLocaleString()}
                          </option>
                        );
                      })}
                    </optgroup>
                  </select>
                  <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
                    <input
                      type="number"
                      min="1"
                      value={factoryNewItemQty}
                      onChange={(e) => setFactoryNewItemQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      placeholder="Qty"
                      className="w-20 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-center font-mono font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      disabled={!factorySelectedProdToAdd}
                      onClick={handleFactoryAddFromAllProducts}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Factory Notes / Batch Planning */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Factory Planning &amp; Indent Notes<span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={factoryNotesInput}
                  onChange={(e) => setFactoryNotesInput(e.target.value)}
                  placeholder="Enter factory batch allocation notes or remarks..."
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <button
                type="button"
                onClick={handleConfirmFactoryReject}
                className="px-4 py-2 rounded-xl border border-rose-400 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
              >
                Reject Requisition
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFactoryEditRequisition(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFactoryApproval}
                  className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approve Indent &amp; Forward to Accounts</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ACCOUNTS & STORE ISSUE REQUISITION (Send Product or Issue)         */}
      {/* ========================================================================= */}
      {issueModalRequisition && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 space-y-4 p-6">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Issue Requisition &amp; Send Products (Accounts / Dispatch)
                  </h3>
                  <p className="text-xs text-slate-500">{issueModalRequisition.requisitionNo}</p>
                </div>
              </div>
              <button onClick={() => setIssueModalRequisition(null)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-900 dark:text-blue-200">
                    Recipient: {issueModalRequisition.distributorName || issueModalRequisition.customerName}
                  </span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                    ৳ {issueModalRequisition.netTotal.toLocaleString()}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-400 flex items-center gap-3">
                  <span>Department: <b>{issueModalRequisition.departmentName}</b></span>
                  <span>•</span>
                  <span>Field Officer: <b>{issueModalRequisition.fieldForceName || issueModalRequisition.fieldForceCode}</b></span>
                </div>
              </div>

              {/* Items Summary Table in Issue Modal */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Approved Pcs</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {issueModalRequisition.items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">{i.itemName}</td>
                        <td className="p-2 text-center font-mono font-bold text-emerald-600">
                          {i.approvedPcs ?? i.requestedPcs} pcs
                        </td>
                        <td className="p-2 text-right font-mono">৳ {i.price.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono font-semibold">
                          ৳ {((i.approvedPcs ?? i.requestedPcs) * i.price).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Delivery Challan Number<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={issueChallanNo}
                    onChange={(e) => setIssueChallanNo(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800 font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Dispatch Date<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Dispatched From (Warehouse/Plant)<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={issueWarehouseId}
                    onChange={(e) => setIssueWarehouseId(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Delivery Driver / Vehicle No<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={issueDeliveryPerson}
                    onChange={(e) => setIssueDeliveryPerson(e.target.value)}
                    placeholder="e.g. Driver Md. Kabir (DHAKA-METRO-11-8902)"
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Accounts &amp; Dispatch Remarks
                </label>
                <textarea
                  rows={2}
                  value={issueRemarks}
                  onChange={(e) => setIssueRemarks(e.target.value)}
                  placeholder="Enter invoice remarks, dispatch voucher note, or transport details..."
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIssueModalRequisition(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmIssue}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm Issue &amp; Send Products</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECEIVED REQUISITION CONFIRMATION                                  */}
      {/* ========================================================================= */}
      {receiveModalRequisition && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 space-y-4 p-6">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Confirm Goods Received
                  </h3>
                  <p className="text-xs text-slate-500">{receiveModalRequisition.requisitionNo}</p>
                </div>
              </div>
              <button onClick={() => setReceiveModalRequisition(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Confirm physical goods receipt at destination for Challan: <b>{receiveModalRequisition.challanNo || 'CH-KUS'}</b>.
              </p>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Receiver Verification Notes
                </label>
                <textarea
                  rows={2}
                  value={receiveRemarks}
                  onChange={(e) => setReceiveRemarks(e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReceiveModalRequisition(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReceived}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Received</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW REQUISITION SUMMARY / INVOICE PREVIEW                         */}
      {/* ========================================================================= */}
      {viewingRequisition && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div>
                <h3 className="font-bold text-base text-[#0284c7]">Requisition Document</h3>
                <p className="text-xs text-slate-500">{viewingRequisition.requisitionNo}</p>
              </div>
              <button onClick={() => setViewingRequisition(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div>
                  <span className="text-slate-500">Party Name:</span>
                  <div className="font-bold mt-0.5">{viewingRequisition.distributorName || viewingRequisition.customerName}</div>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
                  <div className="font-bold mt-0.5 text-blue-600">{viewingRequisition.status}</div>
                </div>
                <div>
                  <span className="text-slate-500">Date:</span>
                  <div className="font-bold mt-0.5">{viewingRequisition.requisitionDate}</div>
                </div>
                <div>
                  <span className="text-slate-500">Field Officer:</span>
                  <div className="font-bold mt-0.5">{viewingRequisition.fieldForceCode}</div>
                </div>
              </div>

              <table className="w-full border text-left">
                <thead className="bg-[#dce9f5] dark:bg-slate-800 font-bold">
                  <tr>
                    <th className="p-2 border-r">#</th>
                    <th className="p-2 border-r">Item Name</th>
                    <th className="p-2 border-r text-center">Unit</th>
                    <th className="p-2 border-r text-right">Price</th>
                    <th className="p-2 border-r text-center">Req Pcs</th>
                    <th className="p-2 border-r text-center">Approved Pcs</th>
                    <th className="p-2 text-right">Net BDT</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {viewingRequisition.items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border-r text-center">{idx + 1}</td>
                      <td className="p-2 border-r font-medium">{i.itemName}</td>
                      <td className="p-2 border-r text-center text-slate-500">{i.unit}</td>
                      <td className="p-2 border-r text-right font-mono">৳ {i.price.toFixed(2)}</td>
                      <td className="p-2 border-r text-center font-mono">{i.requestedPcs}</td>
                      <td className="p-2 border-r text-center font-mono font-bold text-emerald-600">{i.approvedPcs ?? i.requestedPcs}</td>
                      <td className="p-2 text-right font-mono font-bold">৳ {i.netTotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-3 border-t">
                <div className="text-right">
                  <div className="text-slate-500">Grand Total Net:</div>
                  <div className="text-xl font-bold font-mono text-blue-700">
                    ৳ {viewingRequisition.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 px-6 border-t bg-slate-50 dark:bg-slate-800/40 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setViewingRequisition(null)}
                className="px-4 py-2 border rounded-xl font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-1.5"
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
