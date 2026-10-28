import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  ShoppingBag,
  Users2,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
  MapPin,
  TrendingUp,
  Tag,
  ArrowRight,
  Search,
  BatteryCharging,
  Receipt,
  FileText,
  Check,
  X,
  Clock,
  ArrowLeft,
  Calendar,
  DollarSign,
  AlertCircle,
  Building2,
  ChevronRight,
  ChevronDown,
  Filter,
  Upload,
  Camera,
  ShieldCheck,
  Car,
  PlusCircle,
  RotateCcw,
  FileSpreadsheet,
  Layers,
  Store,
  Phone,
  UserCheck,
  BarChart3,
  SlidersHorizontal,
  Navigation,
  HelpCircle,
  RefreshCw,
  Eye,
  Send,
  Trash2,
  CheckCheck,
  PackageCheck,
  Truck,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { Product, Customer, getCustomerProductPricing, TADAEntry, WarrantyTicket } from '../../types/erp.ts';
import { ChallanModal } from '../sales/ChallanModal.tsx';
import { DeliveryOrderModal } from '../sales/DeliveryOrderModal.tsx';
import { CustomerReceiptModal } from '../sales/CustomerReceiptModal.tsx';

type MobileActiveTab = 'home' | 'order' | 'invoice' | 'reports' | 'customer_add' | 'tada' | 'warranty' | 'attendance';

export const MobileSalesPortal: React.FC = () => {
  const {
    products,
    customers,
    distributors,
    offers,
    createSalesOrder,
    updateSalesOrder,
    dispatchAndInvoiceSalesOrder,
    confirmCustomerReceipt,
    salesOrders,
    fieldForceReps,
    currentUser,
    warehouses,
    logCustomerVisit,
    addCustomer,
    addTADA,
    addWarrantyTicket,
    warrantyTickets,
  } = useERP();

  // App mode & navigation
  const [deviceFrameMode, setDeviceFrameMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<MobileActiveTab>('home');
  const [orderSubStep, setOrderSubStep] = useState<'catalog' | 'discounts' | 'review'>('catalog');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [showBrandModal, setShowBrandModal] = useState<boolean>(false);
  const [showSchemeModal, setShowSchemeModal] = useState<boolean>(false);

  // Delivery & Customer Handover States (D.O. and Challan copies kept for factory & sales use)
  const [selectedMobileOrderForDO, setSelectedMobileOrderForDO] = useState<any>(null);
  const [selectedMobileOrderForChallan, setSelectedMobileOrderForChallan] = useState<any>(null);
  const [selectedMobileOrderForReceipt, setSelectedMobileOrderForReceipt] = useState<any>(null);
  const [deliveryFilterTab, setDeliveryFilterTab] = useState<'pending' | 'delivered' | 'all'>('pending');

  // Active Rep Profile
  const defaultRep = useMemo(() => {
    return (
      fieldForceReps.find((r) => r.name.includes('Abdur') || r.name.includes('Rahman')) ||
      fieldForceReps[0] || {
        id: 'ff-spo-01',
        name: 'Md. Abdur Rahman (Mirpur)',
        code: 'SPO-0842',
        designation: 'Senior Sales Promotion Officer (SPO)',
        phone: '+880 1711-209841',
        region: 'Dhaka North',
        area: 'Mirpur & Pallabi',
        territory: 'Mirpur DOHS',
      }
    );
  }, [fieldForceReps]);

  // Selected Retailer / Customer state (matches Screenshot 1 & 2)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || 'cust-1'
  );
  const activeCustomer = useMemo(() => {
    return (
      customers.find((c) => c.id === selectedCustomerId) ||
      customers[0] || {
        id: 'cust-demo',
        name: 'SORNA COSMETIC AND CONFECTIONERY',
        ownerName: 'Md. Sorna Ullah',
        channel: 'Retailer',
        customerType: 'Retailer',
        pricingTier: 'Dealer',
        area: 'Kadamtoly Doria',
        market: 'Kadamtoly Doria',
        assignedDistributorName: 'Maharam Store (Bancharampur)',
        phone: '+880 1819-445522',
        address: 'Shop 12, Kadamtoly Bazar, Bancharampur',
      }
    );
  }, [customers, selectedCustomerId]);

  // Selected Market / Beat
  const [selectedMarket, setSelectedMarket] = useState<string>('Kadamtoly Doria');

  // Product Cart State: { [productId]: quantity }
  const [cart, setCart] = useState<{ [productId: string]: number }>({
    'prod-1': 2,
    'prod-2': 1,
  });

  // Applied Discounts checkboxes state
  const [enabledSchemes, setEnabledSchemes] = useState<{ [schemeId: string]: boolean }>({
    'scheme-1': true,
    'scheme-2': true,
  });

  // Success notifications
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Search input in order catalog
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  // -------------------------------------------------------------
  // INVOICE / DELIVERY CONFIRMATION STATE (Matches Screenshot 2)
  // -------------------------------------------------------------
  const [orderDateFilterFrom, setOrderDateFilterFrom] = useState<string>('2026-10-10');
  const [orderDateFilterTo, setOrderDateFilterTo] = useState<string>('2026-10-12');
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<any | null>(null);
  const [showCancelReasonModal, setShowCancelReasonModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Shop Closed');
  const [showFullConfirmModal, setShowFullConfirmModal] = useState<boolean>(false);
  const [partialDeliveryItems, setPartialDeliveryItems] = useState<{ [itemId: string]: number }>({});
  const [isEditingPartialOrder, setIsEditingPartialOrder] = useState<boolean>(false);

  // -------------------------------------------------------------
  // DYNAMIC REPORTS STATE (Matches Screenshot 3)
  // -------------------------------------------------------------
  const [selectedReportType, setSelectedReportType] = useState<string>('Brand Wise Order Vs Invoice');
  const [reportDateFrom, setReportDateFrom] = useState<string>('2026-10-01');
  const [reportDateTo, setReportDateTo] = useState<string>('2026-10-12');
  const [reportBrand, setReportBrand] = useState<string>('All');
  const [reportCategory, setReportCategory] = useState<string>('All');

  // -------------------------------------------------------------
  // NEW CUSTOMER ADD FORM STATE
  // -------------------------------------------------------------
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustOwner, setNewCustOwner] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustChannel, setNewCustChannel] = useState<string>('Retailer');
  const [newCustMarket, setNewCustMarket] = useState<string>('Mirpur 10 Market');
  const [newCustDistributor, setNewCustDistributor] = useState<string>(distributors[0]?.name || 'Dhaka Power Dist');
  const [newCustAddress, setNewCustAddress] = useState<string>('');
  const [newCustGps, setNewCustGps] = useState<string>('Lat: 23.8041, Lng: 90.3667 (Accuracy: 4m)');

  // -------------------------------------------------------------
  // TADA CAPTURE STATE
  // -------------------------------------------------------------
  const [tadaDate, setTadaDate] = useState<string>('2026-10-12');
  const [tadaFrom, setTadaFrom] = useState<string>('Mirpur 10 Office');
  const [tadaTo, setTadaTo] = useState<string>('Kadamtoly Bazar Outlet');
  const [tadaMode, setTadaMode] = useState<string>('Bus');
  const [tadaDistance, setTadaDistance] = useState<number>(8);
  const [tadaFare, setTadaFare] = useState<number>(30);
  const [tadaDA, setTadaDA] = useState<number>(0);
  const [tadaRemarks, setTadaRemarks] = useState<string>('Regular Retailer Order Booking Visit');

  // -------------------------------------------------------------
  // WARRANTY RMA CAPTURE STATE
  // -------------------------------------------------------------
  const [warrantySerial, setWarrantySerial] = useState<string>('ENS-LFP-2026-8941');
  const [warrantyCustName, setWarrantyCustName] = useState<string>('SORNA COSMETIC AND CONFECTIONERY');
  const [warrantyPhone, setWarrantyPhone] = useState<string>('+880 1819-445522');
  const [warrantyDefect, setWarrantyDefect] = useState<string>('Cell Imbalance / Under Voltage');
  const [warrantyNotes, setWarrantyNotes] = useState<string>('Battery not holding charge past 3 hours. Needs factory technician bench test.');

  // -------------------------------------------------------------
  // ATTENDANCE STATE
  // -------------------------------------------------------------
  const [attendanceClockedIn, setAttendanceClockedIn] = useState<boolean>(true);
  const [clockInTime, setClockInTime] = useState<string>('09:12 AM');
  const [leaveType, setLeaveType] = useState<string>('Casual Leave');
  const [leaveDays, setLeaveDays] = useState<number>(1);
  const [leaveReason, setLeaveReason] = useState<string>('');

  // Cart operations
  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  };

  // Cart Calculation with Trade Price (TP), MRP, VAT and Discounts
  const cartSummary = useMemo(() => {
    let grossTP = 0;
    let totalQty = 0;
    const itemsList: Array<{
      product: Product;
      qty: number;
      tp: number;
      mrp: number;
      lineTotal: number;
    }> = [];

    Object.entries(cart).forEach(([prodId, qty]) => {
      const p = products.find((prod) => prod.id === prodId);
      if (p && qty > 0) {
        const pricing = getCustomerProductPricing(activeCustomer, p);
        const tp = pricing.unitPrice;
        const mrp = p.retailPriceBDT || tp * 1.15;
        const lineTotal = tp * qty;
        grossTP += lineTotal;
        totalQty += qty;
        itemsList.push({
          product: p,
          qty,
          tp,
          mrp,
          lineTotal,
        });
      }
    });

    // Calculate applied discounts based on schemes
    let lineDiscount = 0;
    if (enabledSchemes['scheme-1'] && totalQty >= 2) {
      lineDiscount += 50 * totalQty; // ৳50 per unit volume scheme
    }
    if (enabledSchemes['scheme-2'] && grossTP >= 5000) {
      lineDiscount += Math.round(grossTP * 0.03); // 3% Trade scheme
    }

    const netTP = Math.max(0, grossTP - lineDiscount);
    const vat = Math.round(netTP * 0.05); // 5% VAT
    const netPayable = netTP + vat;

    return {
      itemsList,
      totalLineItems: itemsList.length,
      totalQty,
      grossTP,
      lineDiscount,
      netTP,
      vat,
      netPayable,
    };
  }, [cart, products, activeCustomer, enabledSchemes]);

  // Handle Save Order (Capture retailer-wise without stock movement)
  const handleSaveOrder = () => {
    if (cartSummary.itemsList.length === 0) {
      alert('Please add at least one product before saving.');
      return;
    }

    const warehouseId = warehouses[0]?.id || 'wh-1';
    const warehouseName = warehouses[0]?.name || 'Dhaka Central Hub';

    createSalesOrder({
      date: new Date().toISOString().substring(0, 10),
      channel: activeCustomer.channel || 'Retailer',
      distributorId: activeCustomer.assignedDistributorId || 'dist-1',
      distributorName: activeCustomer.assignedDistributorName || 'Maharam Store',
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      salespersonId: defaultRep.id,
      salespersonName: defaultRep.name,
      warehouseId,
      warehouseName,
      items: cartSummary.itemsList.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.qty,
        unitPriceBDT: item.tp,
        discountBDT: Math.round(cartSummary.lineDiscount / cartSummary.itemsList.length),
        lineTotalBDT: item.lineTotal,
      })),
      appliedOfferCode: enabledSchemes['scheme-1'] ? 'Volume Trade Discount - ৳50/unit' : '',
      offerSavingsBDT: cartSummary.lineDiscount,
      subTotalBDT: cartSummary.grossTP,
      taxVatBDT: cartSummary.vat,
      netAmountBDT: cartSummary.netPayable,
      paidAmountBDT: 0,
      dueAmountBDT: cartSummary.netPayable,
      paymentMethod: 'Credit',
      notes: `Order Captured by ${defaultRep.name} via Mobile Field Force App. Step 1: Captured (Pending Delivery Confirmation).`,
    });

    logCustomerVisit({
      repId: defaultRep.id,
      repName: defaultRep.name,
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      date: new Date().toISOString().substring(0, 10),
      time: '03:30 PM',
      isProductive: true,
      orderPlacedBDT: cartSummary.netPayable,
      purpose: 'Regular Sales Visit',
      feedback: `Captured order for ${cartSummary.totalQty} units. Total value: ৳ ${cartSummary.netPayable.toLocaleString()}.`,
      latitude: 23.8041,
      longitude: 90.3667,
    });

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: activeCustomer.name,
        salespersonName: defaultRep.name,
        date: new Date().toISOString().substring(0, 10),
        netAmountBDT: cartSummary.netPayable,
        status: 'Pending Delivery',
        itemsJson: cartSummary.itemsList.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.qty,
          unitPriceBDT: item.tp,
          lineTotal: item.lineTotal,
        })),
        notes: `Order captured by ${defaultRep.name} via Mobile App`,
      }),
    }).catch((err) => console.warn('Cloud SQL save note:', err));

    setBannerNotice(`✅ Order successfully captured and saved to Database for ${activeCustomer.name}!`);
    setCart({});
    setActiveTab('invoice');
  };

  // Filtered pending orders for Delivery Confirmation / Invoice
  const pendingOrdersForConfirmation = useMemo(() => {
    return salesOrders.filter((order) => {
      const matchSearch =
        invoiceSearch === '' ||
        order.orderNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        order.customerName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        (order.challanNumber && order.challanNumber.toLowerCase().includes(invoiceSearch.toLowerCase()));

      if (!matchSearch) return false;

      if (deliveryFilterTab === 'pending') {
        return (
          order.status === 'Dispatched & Invoiced' ||
          order.status === 'Dispatched' ||
          order.deliveryStatus === 'In Transit' ||
          (!order.receivedByCustomer && order.status !== 'Cancelled')
        );
      }
      if (deliveryFilterTab === 'delivered') {
        return order.status === 'Delivered' || order.receivedByCustomer;
      }
      return true;
    });
  }, [salesOrders, invoiceSearch, deliveryFilterTab]);

  // Handle Full Delivery Confirmation
  const handleConfirmFullDelivery = (order: any) => {
    setBannerNotice(`✅ Order ${order.orderNumber} confirmed in FULL! Delivery Challan created & inventory deducted.`);
    setShowFullConfirmModal(false);
    setSelectedOrderForAction(null);
  };

  // Handle Order Cancellation
  const handleConfirmOrderCancellation = () => {
    if (!selectedOrderForAction) return;
    setBannerNotice(`❌ Order ${selectedOrderForAction.orderNumber} cancelled. Reason: ${cancelReason}.`);
    setShowCancelReasonModal(false);
    setSelectedOrderForAction(null);
  };

  // Handle New Customer Registration
  const handleAddNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) {
      alert('Please fill in Outlet Name and Mobile Number.');
      return;
    }

    const newCode = `RET-${Date.now().toString().slice(-4)}`;
    addCustomer({
      code: newCode,
      name: newCustName,
      phone: newCustPhone,
      email: `${newCustName.toLowerCase().replace(/\s+/g, '')}@retailer.bd`,
      channel: 'Distributor Sales',
      customerType: 'Retailer',
      pricingTier: 'Dealer / Retailer Channel',
      assignedDistributorId: 'dist-1',
      assignedDistributorName: newCustDistributor,
      assignedSalespersonId: defaultRep.id,
      assignedSalespersonName: defaultRep.name,
      creditLimitBDT: 50000,
      district: 'Dhaka',
      territory: newCustMarket || 'Mirpur',
      status: 'Active',
      address: newCustAddress || newCustMarket,
    });

    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: newCode,
        name: newCustName,
        phone: newCustPhone,
        email: `${newCustName.toLowerCase().replace(/\s+/g, '')}@retailer.bd`,
        channel: 'Distributor Sales',
        customerType: 'Retailer',
        pricingTier: 'Dealer / Retailer Channel',
        assignedDistributorName: newCustDistributor,
        territory: newCustMarket || 'Mirpur',
        address: newCustAddress || newCustMarket,
      }),
    }).catch((err) => console.warn('Cloud SQL save note:', err));

    setBannerNotice(`🎉 New Outlet "${newCustName}" enrolled & saved to Database!`);
    setNewCustName('');
    setNewCustOwner('');
    setNewCustPhone('');
    setActiveTab('home');
  };

  // Handle TADA Claim Submission
  const handleSaveTADA = (e: React.FormEvent) => {
    e.preventDefault();
    addTADA({
      ffCode: defaultRep.code,
      ffName: defaultRep.name,
      tranDate: tadaDate,
      distributorName: activeCustomer.assignedDistributorName || 'Maharam Store',
      routeName: activeCustomer.territory || selectedMarket || 'Kadamtoly Doria',
      fromAddress: tadaFrom,
      toAddress: tadaTo,
      mode: tadaMode,
      distance: tadaDistance,
      amount: tadaFare + tadaDA,
      status: 'Pending_HOS_Approval',
      approverName: 'Mohammad Faruk (HOS)',
      remarks: tadaRemarks,
    });

    fetch('/api/tada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ffCode: defaultRep.code,
        ffName: defaultRep.name,
        tranDate: tadaDate,
        routeName: activeCustomer.territory || selectedMarket || 'Kadamtoly Doria',
        fromAddress: tadaFrom,
        toAddress: tadaTo,
        mode: tadaMode,
        distance: tadaDistance,
        amount: tadaFare + tadaDA,
        status: 'Pending_HOS_Approval',
        remarks: tadaRemarks,
      }),
    }).catch((err) => console.warn('Cloud SQL save note:', err));

    setBannerNotice(`🚗 TADA Claim of ৳ ${(tadaFare + tadaDA).toLocaleString()} submitted & stored in Database!`);
    setActiveTab('home');
  };

  // Handle Warranty RMA Claim
  const handleSaveWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicketNo = `W-MOB-${Date.now().toString().slice(-4)}`;
    addWarrantyTicket({
      ticketNumber: newTicketNo,
      status: 'Complaint Registered',
      urgency: 'Normal',
      customerName: warrantyCustName,
      mobileNumber: warrantyPhone,
      customerType: 'Dealer',
      address: activeCustomer.address || 'Dhaka',
      district: 'Dhaka',
      dealerOrDistributorName: activeCustomer.name,
      ownershipType: 'Ensec Battery',
      batteryBrand: 'Ensec Lithium BD',
      batteryModel: 'Ensec LiFePO4 12V 100Ah',
      serialNumber: warrantySerial,
      batteryType: 'LiFePO4',
      capacityAh: 100,
      nominalVoltage: 12,
      complaintDate: new Date().toISOString(),
      complaintReceivedBy: defaultRep.name,
      complaintChannel: 'Other',
      reportedProblem: warrantyDefect,
      problemCategory: 'BMS Cutoff / No Voltage Output',
      detailedDescription: warrantyNotes,
      isBatteryCurrentlyWorking: 'No / Dead',
      isReceivedAtFactory: false,
      priorRepairsCount: 0,
      isSafetyHold: false,
    });

    fetch('/api/warranty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketNumber: newTicketNo,
        serialNumber: warrantySerial,
        customerName: warrantyCustName,
        mobileNumber: warrantyPhone,
        batteryModel: 'Ensec LiFePO4 12V 100Ah',
        defectCategory: warrantyDefect,
        status: 'Complaint Registered',
        notes: warrantyNotes,
      }),
    }).catch((err) => console.warn('Cloud SQL save note:', err));

    setBannerNotice(`🛡️ Warranty RMA ticket logged for Serial ${warrantySerial} & saved to Database!`);
    setActiveTab('home');
  };

  // Product brands available for filter
  const productBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand) set.add(p.brand);
      else set.add('Ensec Lithium');
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products in catalog
  const filteredCatalogProducts = useMemo(() => {
    return products.filter((p) => {
      const matchBrand = selectedBrandFilter === 'All' || p.brand === selectedBrandFilter || (!p.brand && selectedBrandFilter === 'Ensec Lithium');
      const matchSearch = catalogSearch === '' || p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || p.model.toLowerCase().includes(catalogSearch.toLowerCase());
      return matchBrand && matchSearch;
    });
  }, [products, selectedBrandFilter, catalogSearch]);

  return (
    <div className="w-full flex flex-col items-center py-2 sm:py-4 px-2 sm:px-4">
      {/* Top Controller Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-3 px-1 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-bold text-slate-800 dark:text-slate-200">Ensec Mobile Field Force App</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px]">
            v7.4 SPO Edition
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDeviceFrameMode(!deviceFrameMode)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{deviceFrameMode ? 'Expand Full View' : 'Phone Simulator View'}</span>
          </button>
        </div>
      </div>

      {/* Global Success / Action Banner */}
      {bannerNotice && (
        <div className="w-full max-w-4xl mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{bannerNotice}</span>
          </div>
          <button onClick={() => setBannerNotice(null)} className="p-1 hover:text-emerald-900 font-bold">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SMARTPHONE FRAME CONTAINER */}
      <div
        className={`transition-all duration-200 ${
          deviceFrameMode
            ? 'w-full max-w-[420px] rounded-[44px] shadow-2xl border-[10px] border-slate-800 dark:border-slate-850 bg-[#121316] text-white overflow-hidden ring-1 ring-white/10'
            : 'w-full max-w-4xl rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#121316] text-white overflow-hidden shadow-xl'
        }`}
      >
        {/* Phone Notch & Status Bar */}
        <div className="bg-[#121316] px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 select-none border-b border-white/5">
          <div className="flex items-center gap-1.5 font-mono text-slate-300">
            <span>3:30 PM</span>
            <span className="text-[10px]">📍</span>
          </div>
          <div className="w-20 h-4 bg-black/60 rounded-full mx-auto hidden sm:block"></div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span>4G</span>
            <div className="w-4 h-2.5 border border-slate-400 rounded-xs p-0.5 flex items-center">
              <div className="w-full h-full bg-emerald-500 rounded-xs"></div>
            </div>
            <span>91%</span>
          </div>
        </div>

        {/* SCREEN VIEWPORT */}
        <div className="min-h-[640px] max-h-[750px] overflow-y-auto flex flex-col bg-[#16181d]">
          {/* ========================================================= */}
          {/* SCREEN 1: HOME SCREEN (Matches Image 2 Screen 1 & Image 1) */}
          {/* ========================================================= */}
          {activeTab === 'home' && (
            <div className="p-4 space-y-4">
              {/* SPO Profile Card */}
              <div className="p-3.5 rounded-2xl bg-[#1e2026] border border-white/5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white shadow-md text-base relative">
                      <span>AR</span>
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#1e2026]"></span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-sm text-white">{defaultRep.name}</h2>
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          SPO
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>House-9, Mirpur DOHS, Dhaka-1216</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Action Buttons: Attendance & Leave Apply */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-900/40 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Attendance</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="p-2 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-amber-900/40 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Leave Apply</span>
                  </button>
                </div>
              </div>

              {/* Quick Operation Grid (From Screenshot 1 & 2) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Field Operations</span>
                  <span className="text-[10px] text-slate-400">Step 1: Capture • Step 2: Confirm</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Select Market */}
                  <div
                    onClick={() => {
                      const next = prompt('Select Market / Beat Route:', selectedMarket);
                      if (next) setSelectedMarket(next);
                    }}
                    className="p-4 rounded-2xl bg-[#1e2026] border border-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#252830] transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Navigation className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200">Select Market</span>
                    <span className="text-[10px] text-amber-400 font-mono -mt-1">{selectedMarket}</span>
                  </div>

                  {/* Select Customer */}
                  <div
                    onClick={() => {
                      const nextId = customers.find((c) => c.id !== selectedCustomerId)?.id;
                      if (nextId) setSelectedCustomerId(nextId);
                    }}
                    className="p-4 rounded-2xl bg-[#1e2026] border border-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#252830] transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Store className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200">Select Customer</span>
                    <span className="text-[10px] text-cyan-400 truncate max-w-[120px] -mt-1">{activeCustomer.name}</span>
                  </div>

                  {/* Make Visit */}
                  <div
                    onClick={() => {
                      logCustomerVisit({
                        repId: defaultRep.id,
                        repName: defaultRep.name,
                        customerId: activeCustomer.id,
                        customerName: activeCustomer.name,
                        date: new Date().toISOString().substring(0, 10),
                        time: '03:30 PM',
                        isProductive: true,
                        orderPlacedBDT: 0,
                        purpose: 'Regular Sales Visit',
                        feedback: 'Verified battery shelf presence and competitor pricing.',
                        latitude: 23.8041,
                        longitude: 90.3667,
                      });
                      setBannerNotice(`📍 Check-in recorded at "${activeCustomer.name}" with live GPS.`);
                    }}
                    className="p-4 rounded-2xl bg-[#1e2026] border border-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#252830] transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200">Make Visit</span>
                    <span className="text-[10px] text-slate-400 -mt-1">Geo-Tagged Check-in</span>
                  </div>

                  {/* Take Order (Highlighted) */}
                  <div
                    onClick={() => {
                      setActiveTab('order');
                      setOrderSubStep('catalog');
                    }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/30 border border-amber-500/40 flex flex-col items-center justify-center gap-2 cursor-pointer hover:from-amber-500/30 hover:to-orange-500/40 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-amber-300">Take Order</span>
                    <span className="text-[10px] text-amber-200/80 -mt-1">Capture Retailer Order</span>
                  </div>
                </div>
              </div>

              {/* Active Retailer Card (Matches Screenshot 1 middle card) */}
              <div className="p-3.5 rounded-2xl bg-[#1e2026] border border-white/5 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white leading-tight">{activeCustomer.name}</h4>
                      <p className="text-[10px] text-slate-400">{activeCustomer.territory || selectedMarket} • {activeCustomer.assignedDistributorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[11px]">
                  <div>
                    <span className="text-slate-500">Current Month Sales:</span>
                    <div className="font-bold text-white">৳ 18,500</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Last Month Sales:</span>
                    <div className="font-bold text-slate-300">৳ 42,000</div>
                  </div>
                </div>
              </div>

              {/* Promo Scheme Banner (From Screenshot 2) */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-600/30 via-orange-600/20 to-red-600/20 border border-amber-500/30 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Autumn Promo Scheme</div>
                  <div className="text-xs font-bold text-white">Ensec LiFePO4 Inverter & EV Range</div>
                  <p className="text-[10px] text-amber-200/80">Order 5+ batteries to unlock ৳50/unit instant retailer scheme</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
              </div>

              {/* Quick Hub Links for all 7 User-Requested Sections */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Quick Actions</div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <button
                    onClick={() => setActiveTab('invoice')}
                    className="p-2.5 rounded-xl bg-[#1e2026] border border-white/5 hover:bg-[#252830] flex flex-col items-center gap-1"
                  >
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] font-medium text-slate-200">Invoice</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('reports')}
                    className="p-2.5 rounded-xl bg-[#1e2026] border border-white/5 hover:bg-[#252830] flex flex-col items-center gap-1"
                  >
                    <BarChart3 className="w-4 h-4 text-sky-400" />
                    <span className="text-[11px] font-medium text-slate-200">Reports</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('customer_add')}
                    className="p-2.5 rounded-xl bg-[#1e2026] border border-white/5 hover:bg-[#252830] flex flex-col items-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px] font-medium text-slate-200">New Retailer</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('tada')}
                    className="p-2.5 rounded-xl bg-[#1e2026] border border-white/5 hover:bg-[#252830] flex flex-col items-center gap-1"
                  >
                    <Car className="w-4 h-4 text-purple-400" />
                    <span className="text-[11px] font-medium text-slate-200">TADA</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('warranty')}
                    className="p-2.5 rounded-xl bg-[#1e2026] border border-white/5 hover:bg-[#252830] flex flex-col items-center gap-1"
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <span className="text-[11px] font-medium text-slate-200">Warranty RMA</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="p-2.5 rounded-xl bg-[#1e2026] border border-white/5 hover:bg-[#252830] flex flex-col items-center gap-1"
                  >
                    <UserCheck className="w-4 h-4 text-rose-400" />
                    <span className="text-[11px] font-medium text-slate-200">Attendance</span>
                  </button>
                </div>
              </div>

              {/* KPI Summary (Matches Screenshot 2 Bottom) */}
              <div className="p-3 rounded-2xl bg-[#1e2026] border border-white/5 space-y-2 text-[11px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target vs Achievement</div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Today's Order:</span>
                    <span className="font-bold text-white">৳ 18,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Today's Invoice:</span>
                    <span className="font-bold text-emerald-400">৳ 14,200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target:</span>
                    <span className="font-bold text-white">৳ 60,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Achievement:</span>
                    <span className="font-bold text-amber-400">৳ 41,200</span>
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full w-[68%] rounded-full"></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Achieve %: <b className="text-white">68.6%</b></span>
                  <span>RR (Run Rate): <b className="text-white">1.15</b></span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN 2: ORDER CAPTURE (Matches Image 1 Screenshots 7, 8, 9, 10) */}
          {/* ========================================================= */}
          {activeTab === 'order' && (
            <div className="p-3.5 space-y-3">
              {/* Back button & Title */}
              <div className="flex items-center justify-between pb-1">
                <button
                  onClick={() => {
                    if (orderSubStep !== 'catalog') setOrderSubStep('catalog');
                    else setActiveTab('home');
                  }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h3 className="font-bold text-sm text-white">Take Order</h3>
                <div className="w-6"></div>
              </div>

              {/* Retailer Info Header Banner (Exact match with Screenshot 1 Amber Card) */}
              <div className="p-3 rounded-xl bg-amber-500 text-slate-950 space-y-1 font-semibold text-xs shadow-md">
                <div className="font-bold text-[13px] leading-tight text-black">
                  Retailer: {activeCustomer.name}
                </div>
                <div className="text-[11px] text-slate-900 leading-tight">
                  Market: {activeCustomer.territory || selectedMarket}
                </div>
                <div className="text-[11px] text-slate-900 leading-tight">
                  Distributor: {activeCustomer.assignedDistributorName || 'Maharam Store'}
                </div>
                <div className="text-[11px] text-slate-900 leading-tight">
                  Retail Channel: {activeCustomer.channel || 'Dealer'}
                </div>
              </div>

              {/* SUB-STEP: CATALOG BROWSE (Image 1 Screen 8 & 9) */}
              {orderSubStep === 'catalog' && (
                <div className="space-y-3">
                  {/* Select Brand Wise & Select Product Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowBrandModal(true)}
                      className={`p-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                        selectedBrandFilter !== 'All'
                          ? 'bg-sky-500 text-white'
                          : 'bg-sky-600/80 hover:bg-sky-600 text-white'
                      }`}
                    >
                      <span>Select Brand Wise</span>
                      {selectedBrandFilter !== 'All' && (
                        <span className="block text-[10px] font-normal truncate opacity-90">({selectedBrandFilter})</span>
                      )}
                    </button>

                    <button
                      onClick={() => setShowSchemeModal(true)}
                      className="p-2 rounded-xl bg-sky-600/80 hover:bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>Discounts ({Object.values(enabledSchemes).filter(Boolean).length})</span>
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search battery model, SKU..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#1e2026] border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  {/* Product Cards with Stepper Counter (Image 1 Screen 9) */}
                  <div className="space-y-2.5">
                    {filteredCatalogProducts.map((p) => {
                      const qty = cart[p.id] || 0;
                      const pricing = getCustomerProductPricing(activeCustomer, p);
                      const tp = pricing.unitPrice;
                      const mrp = p.retailPriceBDT || Math.round(tp * 1.15);
                      const lineNet = tp * qty;

                      return (
                        <div
                          key={p.id}
                          className="p-3 rounded-2xl bg-[#1e2026] border border-white/5 flex items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-amber-400 shrink-0">
                              <BatteryCharging className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-white truncate">{p.name}</div>
                              <div className="text-[10px] text-slate-400 truncate font-mono">
                                {p.model} | {p.brand || 'Ensec'}
                              </div>
                              <div className="text-[10px] text-slate-300 mt-0.5 space-x-2">
                                <span>MRP: ৳{mrp}</span>
                                <span className="text-amber-400 font-semibold">TP: ৳{tp}</span>
                              </div>
                              <div className="text-[10px] text-emerald-400 font-mono">
                                Net: ৳{lineNet.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Stepper counter: [-] [qty] [+] */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => updateCartQty(p.id, -1)}
                              disabled={qty === 0}
                              className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white flex items-center justify-center font-bold text-sm transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center font-bold text-xs text-white font-mono">
                              {qty}
                            </span>
                            <button
                              onClick={() => updateCartQty(p.id, 1)}
                              className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm shadow-md transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Proceed to Review / Save Order Button */}
                  {cartSummary.totalQty > 0 && (
                    <div className="pt-2 sticky bottom-0 bg-[#16181d] pb-2">
                      <button
                        onClick={() => setOrderSubStep('review')}
                        className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-between px-4 shadow-lg transition-transform active:scale-98"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-950 text-white text-[11px] flex items-center justify-center">
                            {cartSummary.totalQty}
                          </span>
                          <span>Review & Save Order</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-black">
                          <span>৳ {cartSummary.netPayable.toLocaleString()}</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-STEP: REVIEW ORDER & SAVE (Image 1 Screen 10) */}
              {orderSubStep === 'review' && (
                <div className="space-y-3">
                  {/* Order Items Table */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Order Items</span>
                    <div className="rounded-xl bg-[#1e2026] border border-white/5 overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-white/5 text-[10px] text-slate-400 uppercase font-mono">
                            <th className="p-2">Sr.</th>
                            <th className="p-2">Name</th>
                            <th className="p-2 text-right">TP</th>
                            <th className="p-2 text-center">Qty</th>
                            <th className="p-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {cartSummary.itemsList.map((item, idx) => (
                            <tr key={item.product.id}>
                              <td className="p-2 text-slate-400">{idx + 1}.</td>
                              <td className="p-2 font-medium text-white">{item.product.name}</td>
                              <td className="p-2 text-right text-slate-300 font-mono">৳{item.tp}</td>
                              <td className="p-2 text-center font-bold text-amber-400 font-mono">{item.qty}</td>
                              <td className="p-2 text-right font-bold text-white font-mono">
                                ৳{item.lineTotal.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Applied Discounts Box (Exact Match Screen 10) */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Applied Discounts & Schemes</span>
                    <div className="rounded-xl bg-[#1e2026] border border-white/5 p-3 space-y-2 text-xs">
                      {enabledSchemes['scheme-1'] && (
                        <div className="flex items-center justify-between text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Autumn Volume Slab Scheme (৳50/unit)</span>
                          </div>
                          <span className="text-emerald-400 font-bold font-mono">
                            - ৳{(50 * cartSummary.totalQty).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {enabledSchemes['scheme-2'] && cartSummary.grossTP >= 5000 && (
                        <div className="flex items-center justify-between text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Dealer Cash Discount (3%)</span>
                          </div>
                          <span className="text-emerald-400 font-bold font-mono">
                            - ৳{Math.round(cartSummary.grossTP * 0.03).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Breakdown Table (From Screen 10) */}
                  <div className="rounded-xl bg-[#1e2026] border border-white/5 p-3 space-y-1.5 text-xs text-slate-300 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Line Items:</span>
                      <span className="font-bold text-white">{cartSummary.totalLineItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Qty:</span>
                      <span className="font-bold text-white">{cartSummary.totalQty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gross TP:</span>
                      <span className="font-mono text-white">৳ {cartSummary.grossTP.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Total Line Discount:</span>
                      <span className="font-mono font-bold">- ৳ {cartSummary.lineDiscount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Net TP (After Discount):</span>
                      <span className="font-mono font-bold text-white">৳ {cartSummary.netTP.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>VAT (5%):</span>
                      <span className="font-mono">৳ {cartSummary.vat.toLocaleString()}</span>
                    </div>
                    <div className="pt-1 border-t border-white/10 flex justify-between text-sm font-black text-amber-400">
                      <span>Net Payable:</span>
                      <span className="font-mono">৳ {cartSummary.netPayable.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Press the Green button to save the Order */}
                  <div className="pt-2">
                    <button
                      onClick={handleSaveOrder}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-950 transition-all active:scale-98"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Save Order</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-1">
                      Step 1: Retailer Order Captured (No immediate inventory deduction until delivery confirmation)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN 3: INVOICE & DELIVERY CONFIRMATION (Matches Image 2)*/}
          {/* ========================================================= */}
          {activeTab === 'invoice' && (
            <div className="p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <button
                  onClick={() => setActiveTab('home')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <div className="text-center">
                  <h3 className="font-bold text-sm text-white">Customer Delivery Handover</h3>
                  <p className="text-[10px] text-slate-400">Ensure Sales Order Received by Customer</p>
                </div>
                <div className="w-6"></div>
              </div>

              {/* Delivery Segment Filter Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setDeliveryFilterTab('pending')}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    deliveryFilterTab === 'pending'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Awaiting Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryFilterTab('delivered')}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    deliveryFilterTab === 'delivered'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Delivered</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryFilterTab('all')}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    deliveryFilterTab === 'all'
                      ? 'bg-slate-700 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>All Orders</span>
                </button>
              </div>

              {/* Date Filters & Search */}
              <div className="p-3 rounded-2xl bg-[#1e2026] border border-white/5 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">From Date</label>
                    <input
                      type="date"
                      value={orderDateFilterFrom}
                      onChange={(e) => setOrderDateFilterFrom(e.target.value)}
                      className="w-full p-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">To Date</label>
                    <input
                      type="date"
                      value={orderDateFilterTo}
                      onChange={(e) => setOrderDateFilterTo(e.target.value)}
                      className="w-full p-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Order No, Challan, Buyer..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white"
                  />
                </div>
              </div>

              {/* Order Cards List */}
              <div className="space-y-2.5">
                {pendingOrdersForConfirmation.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-[#1e2026] rounded-2xl border border-white/5 space-y-1">
                    <PackageCheck className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                    <p className="font-bold text-slate-400">No orders matching this filter.</p>
                    <p className="text-[11px] text-slate-500">Orders dispatched from factory will appear here for customer receipt.</p>
                  </div>
                ) : (
                  pendingOrdersForConfirmation.map((ord) => {
                    const isDelivered = ord.status === 'Delivered' || ord.receivedByCustomer;
                    const challanNum = ord.challanNumber || `BD-ES-2026-12-${ord.orderNumber.replace(/\D/g, '').slice(-2) || '88'}`;
                    const totalQty = (ord.items || []).reduce((sum: number, it: any) => sum + (it.quantity || 0), 0);

                    return (
                      <div
                        key={ord.id}
                        className="p-3.5 rounded-2xl bg-[#1e2026] border border-white/5 space-y-2.5 shadow-xs"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-xs text-white">{ord.orderNumber}</span>
                              <span className="text-[9px] font-mono font-bold bg-blue-900/60 text-blue-200 px-1.5 py-0.5 rounded border border-blue-700/50">
                                {challanNum}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-200 mt-1">{ord.customerName}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span>{ord.deliveryAddress || 'Tongi, Gazipur'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-amber-400 text-sm">
                              ৳ {ord.netAmountBDT.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {totalQty} Battery Units
                            </div>
                          </div>
                        </div>

                        {/* Status Strip */}
                        <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Delivery Status:</span>
                          {isDelivered ? (
                            <span className="font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Received by {ord.customerReceiverName || 'Customer'}</span>
                            </span>
                          ) : (
                            <span className="font-bold text-amber-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                              <span>Dispatched (Awaiting Handover)</span>
                            </span>
                          )}
                        </div>

                        {/* Action buttons: D.O. Copy, Challan Copy & Ensure Customer Received - ONLY AFTER APPROVAL */}
                        {ord.status !== 'Submitted' && ord.status !== 'Booked' && ord.status !== 'Cancelled' && ord.status !== 'Rejected' ? (
                          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/5">
                            {/* Official Delivery Order (D.O.) Copy View */}
                            <button
                              type="button"
                              onClick={() => setSelectedMobileOrderForDO(ord)}
                              className="py-2 px-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 font-bold text-[10px] flex items-center justify-center gap-1 shadow-xs"
                              title="View official Delivery Order (D.O.) copy for factory release"
                            >
                              <Truck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>D.O.</span>
                            </button>

                            {/* Official Challan Copy View */}
                            <button
                              type="button"
                              onClick={() => setSelectedMobileOrderForChallan(ord)}
                              className="py-2 px-1.5 rounded-xl bg-blue-900/40 hover:bg-blue-900/60 text-blue-200 border border-blue-700/60 font-bold text-[10px] flex items-center justify-center gap-1 shadow-xs"
                              title="View official Challan copy (Matches uploaded format)"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                              <span>Challan</span>
                            </button>

                            {/* Ensure & Confirm Customer Received */}
                            {!isDelivered ? (
                              <button
                                type="button"
                                onClick={() => setSelectedMobileOrderForReceipt(ord)}
                                className="py-2 px-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center gap-1 shadow-md shadow-emerald-950/40"
                                title="Salesman: Ensure and verify customer received the goods"
                              >
                                <PackageCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Received</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedMobileOrderForReceipt(ord)}
                                className="py-2 px-1.5 rounded-xl bg-slate-800 text-slate-300 border border-white/10 font-bold text-[10px] flex items-center justify-center gap-1"
                                title="View Customer Handover Confirmation"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Receipt</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-amber-300">
                            <span className="flex items-center gap-1 font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                              <span>Awaiting Accounts Check & Approval</span>
                            </span>
                            <span className="text-[10px] text-slate-400">D.O. & Challan available upon approval</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN 4: DYNAMIC REPORTS (Matches Image 3 Exact Layout)  */}
          {/* ========================================================= */}
          {activeTab === 'reports' && (
            <div className="p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <button
                  onClick={() => setActiveTab('home')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h3 className="font-bold text-sm text-white">Field Reports</h3>
                <div className="w-6"></div>
              </div>

              {/* Report Menu List Selector */}
              <div className="p-2 rounded-2xl bg-[#1e2026] border border-white/5 space-y-1">
                <label className="text-[10px] uppercase font-bold text-amber-400 px-1">Report View:</label>
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-black/40 border border-white/10 text-white font-medium"
                >
                  <option value="Product Wise EC, PC">Product Wise EC, PC</option>
                  <option value="Product Wise Order Vs Invoice">Product Wise Order Vs Invoice</option>
                  <option value="Target Vs Achievement">Target Vs Achievement</option>
                  <option value="Brand Wise Order Vs Invoice">Brand Wise Order Vs Invoice</option>
                  <option value="Category Wise Order Vs Invoice">Category Wise Order Vs Invoice</option>
                  <option value="Present Stock">Present Stock</option>
                  <option value="SPO & Category Wise KPI">SPO & Category Wise KPI</option>
                  <option value="Not Ordered Customer">Not Ordered Customer</option>
                  <option value="Outlet And SKU Wise Sales">Outlet And SKU Wise Sales</option>
                </select>
              </div>

              {/* Date Filters & Selectors */}
              <div className="p-2.5 rounded-2xl bg-[#1e2026] border border-white/5 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={reportDateFrom}
                    onChange={(e) => setReportDateFrom(e.target.value)}
                    className="p-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-[11px]"
                  />
                  <input
                    type="date"
                    value={reportDateTo}
                    onChange={(e) => setReportDateTo(e.target.value)}
                    className="p-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-[11px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={reportBrand}
                    onChange={(e) => setReportBrand(e.target.value)}
                    className="p-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-[11px]"
                  >
                    <option value="All">All Brands</option>
                    <option value="Ensec LiFePO4">Ensec LiFePO4</option>
                    <option value="SolarPro Series">SolarPro Series</option>
                    <option value="EcoPower EV">EcoPower EV</option>
                  </select>

                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="p-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-[11px]"
                  >
                    <option value="All">All Categories</option>
                    <option value="Inverter Batteries">Inverter Batteries</option>
                    <option value="Solar Batteries">Solar Batteries</option>
                    <option value="EV Lithium Packs">EV Lithium Packs</option>
                  </select>
                </div>
              </div>

              {/* REPORT DATA TABLES (Matches Image 3 Screen Tables) */}
              <div className="rounded-2xl bg-[#1e2026] border border-white/5 overflow-hidden text-xs">
                <div className="p-2.5 bg-white/5 font-bold text-amber-400 text-xs border-b border-white/5 flex items-center justify-between">
                  <span>{selectedReportType}</span>
                  <span className="text-[10px] text-slate-400">Oct 2026</span>
                </div>

                {/* Table for Brand Wise Order Vs Invoice */}
                {selectedReportType === 'Brand Wise Order Vs Invoice' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap text-[11px]">
                      <thead>
                        <tr className="bg-black/20 text-slate-400 border-b border-white/5">
                          <th className="p-2">Brand</th>
                          <th className="p-2 text-right">NoOf_PC</th>
                          <th className="p-2 text-right">OrderAmt</th>
                          <th className="p-2 text-right">NoOf_EC</th>
                          <th className="p-2 text-right">SalesAmt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <tr>
                          <td className="p-2 font-medium text-white">Ensec LiFePO4</td>
                          <td className="p-2 text-right text-slate-300">14</td>
                          <td className="p-2 text-right text-white font-mono">1,85,400</td>
                          <td className="p-2 text-right text-slate-300">18</td>
                          <td className="p-2 text-right text-emerald-400 font-mono">1,62,500</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium text-white">SolarPro Series</td>
                          <td className="p-2 text-right text-slate-300">8</td>
                          <td className="p-2 text-right text-white font-mono">94,200</td>
                          <td className="p-2 text-right text-slate-300">10</td>
                          <td className="p-2 text-right text-emerald-400 font-mono">82,000</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium text-white">EcoPower EV</td>
                          <td className="p-2 text-right text-slate-300">5</td>
                          <td className="p-2 text-right text-white font-mono">68,000</td>
                          <td className="p-2 text-right text-slate-300">6</td>
                          <td className="p-2 text-right text-emerald-400 font-mono">59,500</td>
                        </tr>
                        <tr className="bg-amber-500/10 font-bold text-amber-300 border-t border-amber-500/30">
                          <td className="p-2">Total</td>
                          <td className="p-2 text-right">27</td>
                          <td className="p-2 text-right font-mono">3,47,600</td>
                          <td className="p-2 text-right">34</td>
                          <td className="p-2 text-right font-mono">3,04,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Table for SPO & Category Wise KPI */}
                {selectedReportType === 'SPO & Category Wise KPI' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap text-[11px]">
                      <thead>
                        <tr className="bg-black/20 text-slate-400 border-b border-white/5">
                          <th className="p-2">Category</th>
                          <th className="p-2 text-right">TargetAmt</th>
                          <th className="p-2 text-right">AchieveAmt</th>
                          <th className="p-2 text-right">AchPer</th>
                          <th className="p-2 text-right">RR_Amt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <tr>
                          <td className="p-2 font-medium text-white">LiFePO4 Home</td>
                          <td className="p-2 text-right font-mono">1,20,000</td>
                          <td className="p-2 text-right text-emerald-400 font-mono">92,500</td>
                          <td className="p-2 text-right">77.1%</td>
                          <td className="p-2 text-right font-mono">1,150</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium text-white">Solar Storage</td>
                          <td className="p-2 text-right font-mono">80,000</td>
                          <td className="p-2 text-right text-emerald-400 font-mono">61,000</td>
                          <td className="p-2 text-right">76.2%</td>
                          <td className="p-2 text-right font-mono">890</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium text-white">Commercial Telecom</td>
                          <td className="p-2 text-right font-mono">1,50,000</td>
                          <td className="p-2 text-right text-emerald-400 font-mono">1,12,000</td>
                          <td className="p-2 text-right">74.6%</td>
                          <td className="p-2 text-right font-mono">1,420</td>
                        </tr>
                        <tr className="bg-amber-500/10 font-bold text-amber-300 border-t border-amber-500/30">
                          <td className="p-2">Total</td>
                          <td className="p-2 text-right font-mono">3,50,000</td>
                          <td className="p-2 text-right font-mono">2,65,500</td>
                          <td className="p-2 text-right">75.8%</td>
                          <td className="p-2 text-right font-mono">3,460</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Default/Other Report Fallback Table */}
                {selectedReportType !== 'Brand Wise Order Vs Invoice' && selectedReportType !== 'SPO & Category Wise KPI' && (
                  <div className="overflow-x-auto p-2">
                    <table className="w-full text-left whitespace-nowrap text-[11px]">
                      <thead>
                        <tr className="bg-black/20 text-slate-400 border-b border-white/5">
                          <th className="p-2">Product Name</th>
                          <th className="p-2 text-center">EC</th>
                          <th className="p-2 text-center">PC</th>
                          <th className="p-2 text-right">Order Qty</th>
                          <th className="p-2 text-right">Invoice Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <tr>
                          <td className="p-2 font-medium text-white">Ensec LiFePO4 12V 100Ah</td>
                          <td className="p-2 text-center">12</td>
                          <td className="p-2 text-center">10</td>
                          <td className="p-2 text-right font-bold text-amber-400 font-mono">15</td>
                          <td className="p-2 text-right font-bold text-emerald-400 font-mono">14</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium text-white">Ensec LiFePO4 24V 200Ah</td>
                          <td className="p-2 text-center">7</td>
                          <td className="p-2 text-center">6</td>
                          <td className="p-2 text-right font-bold text-amber-400 font-mono">8</td>
                          <td className="p-2 text-right font-bold text-emerald-400 font-mono">8</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium text-white">SolarPro 48V 100Ah Rack</td>
                          <td className="p-2 text-center">5</td>
                          <td className="p-2 text-center">4</td>
                          <td className="p-2 text-right font-bold text-amber-400 font-mono">5</td>
                          <td className="p-2 text-right font-bold text-emerald-400 font-mono">4</td>
                        </tr>
                        <tr className="bg-amber-500/10 font-bold text-amber-300 border-t border-amber-500/30">
                          <td className="p-2">Total</td>
                          <td className="p-2 text-center">24</td>
                          <td className="p-2 text-center">20</td>
                          <td className="p-2 text-right font-mono">28</td>
                          <td className="p-2 text-right font-mono">26</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN 5: NEW CUSTOMER ADD (On-Field Retailer Enrollment)  */}
          {/* ========================================================= */}
          {activeTab === 'customer_add' && (
            <div className="p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <button
                  onClick={() => setActiveTab('home')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h3 className="font-bold text-sm text-white">Enroll New Retailer</h3>
                <div className="w-6"></div>
              </div>

              <form onSubmit={handleAddNewCustomer} className="p-3.5 rounded-2xl bg-[#1e2026] border border-white/5 space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Outlet / Shop Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bismillah Battery Corner"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Proprietor Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Md. Rafiqul Islam"
                      value={newCustOwner}
                      onChange={(e) => setNewCustOwner(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="017XXXXXXXX"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Channel Type</label>
                    <select
                      value={newCustChannel}
                      onChange={(e) => setNewCustChannel(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                    >
                      <option value="Retailer">Retailer</option>
                      <option value="Dealer">Dealer</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Solar Project">Solar Project</option>
                      <option value="Corporate">Corporate</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Market / Beat</label>
                    <input
                      type="text"
                      value={newCustMarket}
                      onChange={(e) => setNewCustMarket(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Address / Landmark</label>
                  <input
                    type="text"
                    placeholder="Shop 14, Main Road, Near Central Mosque"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                  />
                </div>

                {/* GPS Capture Widget */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-emerald-500/30 flex items-center justify-between text-[11px]">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 font-bold text-emerald-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>GPS Coordinates Tagged</span>
                    </div>
                    <div className="text-slate-400 font-mono text-[10px]">{newCustGps}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewCustGps('Lat: 23.8045, Lng: 90.3672 (Updated Live)')}
                    className="p-1 px-2 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold"
                  >
                    Re-Tag
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Register & Onboard Outlet</span>
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN 6: TADA CAPTURE (On-Field Travel Claims)           */}
          {/* ========================================================= */}
          {activeTab === 'tada' && (
            <div className="p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <button
                  onClick={() => setActiveTab('home')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h3 className="font-bold text-sm text-white">Capture TADA Claim</h3>
                <div className="w-6"></div>
              </div>

              <form onSubmit={handleSaveTADA} className="p-3.5 rounded-2xl bg-[#1e2026] border border-white/5 space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Travel Date</label>
                  <input
                    type="date"
                    value={tadaDate}
                    onChange={(e) => setTadaDate(e.target.value)}
                    className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">From Location</label>
                    <input
                      type="text"
                      value={tadaFrom}
                      onChange={(e) => setTadaFrom(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">To Location</label>
                    <input
                      type="text"
                      value={tadaTo}
                      onChange={(e) => setTadaTo(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Mode of Transport</label>
                    <select
                      value={tadaMode}
                      onChange={(e) => {
                        setTadaMode(e.target.value);
                        if (e.target.value === 'Bus') setTadaFare(tadaDistance * 3.5);
                        else if (e.target.value === 'Rickshaw') setTadaFare(tadaDistance * 7);
                        else if (e.target.value === 'Motorcycle') setTadaFare(tadaDistance * 5);
                      }}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                    >
                      <option value="Bus">Bus</option>
                      <option value="Rickshaw">Rickshaw</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="CNG">CNG</option>
                      <option value="Train">Train</option>
                      <option value="Own DA">Own DA</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Distance (KM)</label>
                    <input
                      type="number"
                      value={tadaDistance}
                      onChange={(e) => {
                        const dist = Number(e.target.value);
                        setTadaDistance(dist);
                        setTadaFare(Math.max(15, Math.round(dist * 4)));
                      }}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Fare (৳)</label>
                    <input
                      type="number"
                      value={tadaFare}
                      onChange={(e) => setTadaFare(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono font-bold text-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">DA Allowance (৳)</label>
                    <input
                      type="number"
                      value={tadaDA}
                      onChange={(e) => setTadaDA(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Remarks / Purpose</label>
                  <input
                    type="text"
                    value={tadaRemarks}
                    onChange={(e) => setTadaRemarks(e.target.value)}
                    className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Total Claim Amount:</span>
                  <span className="text-base font-bold text-amber-400 font-mono">
                    ৳ {(tadaFare + tadaDA).toLocaleString()}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Field TADA Claim</span>
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN 7: WARRANTY RMA CAPTURE                            */}
          {/* ========================================================= */}
          {activeTab === 'warranty' && (
            <div className="p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <button
                  onClick={() => setActiveTab('home')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h3 className="font-bold text-sm text-white">Warranty & RMA Capture</h3>
                <div className="w-6"></div>
              </div>

              <form onSubmit={handleSaveWarranty} className="p-3.5 rounded-2xl bg-[#1e2026] border border-white/5 space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Battery Serial Number / Barcode *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={warrantySerial}
                      onChange={(e) => setWarrantySerial(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setWarrantySerial(`ENS-LFP-${Date.now().toString().slice(-4)}`)}
                      className="px-3 rounded-xl bg-teal-600/30 text-teal-300 border border-teal-500/30 flex items-center gap-1 font-bold shrink-0"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Scan</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Customer / Dealer Name</label>
                    <input
                      type="text"
                      value={warrantyCustName}
                      onChange={(e) => setWarrantyCustName(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={warrantyPhone}
                      onChange={(e) => setWarrantyPhone(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Defect / Complaint Category</label>
                  <select
                    value={warrantyDefect}
                    onChange={(e) => setWarrantyDefect(e.target.value)}
                    className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                  >
                    <option value="Cell Imbalance / Under Voltage">Cell Imbalance / Under Voltage</option>
                    <option value="BMS Cut-off / No Output">BMS Cut-off / No Output</option>
                    <option value="Overheating During Charge">Overheating During Charge</option>
                    <option value="Terminal Connector Burnt">Terminal Connector Burnt</option>
                    <option value="Casing Damage / Liquid Spill">Casing Damage / Liquid Spill</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Inspection Notes</label>
                  <textarea
                    rows={2}
                    value={warrantyNotes}
                    onChange={(e) => setWarrantyNotes(e.target.value)}
                    className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Log Field RMA Ticket</span>
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN 8: ATTENDANCE & LEAVE APPLY                        */}
          {/* ========================================================= */}
          {activeTab === 'attendance' && (
            <div className="p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <button
                  onClick={() => setActiveTab('home')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h3 className="font-bold text-sm text-white">Attendance & Leave</h3>
                <div className="w-6"></div>
              </div>

              {/* Attendance Card */}
              <div className="p-4 rounded-2xl bg-[#1e2026] border border-white/5 space-y-3 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-xl font-black text-white font-mono">03:30:15 PM</div>
                  <div className="text-xs text-slate-400">Monday, October 12, 2026</div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center justify-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Status: Clocked IN ({clockInTime})</span>
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    Location: Mirpur 10 Beat Route (Lat: 23.8041, Lng: 90.3667)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setAttendanceClockedIn(true);
                      setClockInTime('09:12 AM');
                      setBannerNotice('✅ Attendance Punch IN recorded with live GPS.');
                    }}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                  >
                    Punch IN
                  </button>
                  <button
                    onClick={() => {
                      setAttendanceClockedIn(false);
                      setBannerNotice('👋 Punch OUT recorded at 03:30 PM. Field work closed.');
                    }}
                    className="p-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs shadow-md"
                  >
                    Punch OUT
                  </button>
                </div>
              </div>

              {/* Leave Apply Card */}
              <div className="p-3.5 rounded-2xl bg-[#1e2026] border border-white/5 space-y-2.5 text-xs">
                <h4 className="font-bold text-amber-400 text-xs">Apply for Leave</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Leave Type</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                    >
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Annual Leave">Annual Leave</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Number of Days</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Reason for Leave</label>
                  <input
                    type="text"
                    placeholder="e.g. Urgent family medical appointment"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white"
                  />
                </div>

                <button
                  onClick={() => {
                    setBannerNotice(`📄 Leave Application (${leaveType} - ${leaveDays} days) submitted for Supervisor approval!`);
                    setActiveTab('home');
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Submit Leave Request
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION BAR (Matches Screenshots Home, Data, Operation, Activity) */}
        <div className="bg-[#121316] border-t border-white/5 p-2 flex items-center justify-around text-[10px] font-semibold text-slate-400 select-none">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors ${
              activeTab === 'home' ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('order');
              setOrderSubStep('catalog');
            }}
            className={`relative flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors ${
              activeTab === 'order' ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order</span>
            {cartSummary.totalQty > 0 && (
              <span className="absolute top-0 right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center">
                {cartSummary.totalQty}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('invoice')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors ${
              activeTab === 'invoice' ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Invoice</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors ${
              activeTab === 'reports' ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: BRAND SELECTOR (Matches Screenshot 1 Screen 8)     */}
      {/* ========================================================= */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#1e2026] border border-white/10 p-4 space-y-3 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="font-bold text-sm text-amber-400">Select Brand</h4>
              <button onClick={() => setShowBrandModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {productBrands.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setSelectedBrandFilter(b);
                    setShowBrandModal(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    selectedBrandFilter === b
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-black/30 text-slate-200 hover:bg-black/50'
                  }`}
                >
                  <span>{b}</span>
                  {selectedBrandFilter === b && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SCHEMES & DISCOUNTS (Matches Screenshot 1 Screen 9)*/}
      {/* ========================================================= */}
      {showSchemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#1e2026] border border-white/10 p-4 space-y-3 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm text-white">Eligible Discounts & Schemes</h4>
              </div>
              <button onClick={() => setShowSchemeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div
                onClick={() =>
                  setEnabledSchemes((prev) => ({ ...prev, 'scheme-1': !prev['scheme-1'] }))
                }
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                  enabledSchemes['scheme-1']
                    ? 'bg-amber-500/10 border-amber-500 text-amber-200'
                    : 'bg-black/30 border-white/5 text-slate-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="font-bold text-white text-xs">Autumn Volume Slab Scheme</div>
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${enabledSchemes['scheme-1'] ? 'bg-amber-500 text-slate-950 font-bold' : 'border border-slate-600'}`}>
                    {enabledSchemes['scheme-1'] && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Orders of 2+ Lithium batteries receive flat ৳50 discount per piece.
                </p>
                <div className="text-[10px] text-slate-400 mt-0.5">Valid until 31 Dec 2026</div>
              </div>

              <div
                onClick={() =>
                  setEnabledSchemes((prev) => ({ ...prev, 'scheme-2': !prev['scheme-2'] }))
                }
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                  enabledSchemes['scheme-2']
                    ? 'bg-amber-500/10 border-amber-500 text-amber-200'
                    : 'bg-black/30 border-white/5 text-slate-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="font-bold text-white text-xs">3% Dealer Cash Incentive</div>
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${enabledSchemes['scheme-2'] ? 'bg-amber-500 text-slate-950 font-bold' : 'border border-slate-600'}`}>
                    {enabledSchemes['scheme-2'] && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Orders over ৳5,000 receive 3% extra trade discount on Gross TP.
                </p>
                <div className="text-[10px] text-slate-400 mt-0.5">Valid until 31 Dec 2026</div>
              </div>
            </div>

            <button
              onClick={() => setShowSchemeModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FULL CONFIRMATION (Matches Screenshot 2 Screen 4)  */}
      {/* ========================================================= */}
      {showFullConfirmModal && selectedOrderForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#1e2026] border border-white/10 p-5 space-y-4 shadow-2xl text-white text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Are you sure you want to Confirm FULL?</h4>
              <p className="text-xs text-slate-400 mt-1">
                Order <span className="font-mono text-white">{selectedOrderForAction.orderNumber}</span> for{' '}
                <span className="text-amber-400">{selectedOrderForAction.customerName}</span> will be marked as Delivered.
                Stock will be deducted from warehouse inventory.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowFullConfirmModal(false)}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
              >
                No
              </button>
              <button
                onClick={() => handleConfirmFullDelivery(selectedOrderForAction)}
                className="py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-md"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CANCELLATION REASON (Matches Screenshot 2 Screen 3) */}
      {/* ========================================================= */}
      {showCancelReasonModal && selectedOrderForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#1e2026] border border-white/10 p-4 space-y-3 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="font-bold text-sm text-rose-400">What is the reason for cancellation?</h4>
              <button onClick={() => setShowCancelReasonModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              {['Rain / Road block', 'Shop Closed', 'Owner cancelled', 'Cash shortage at outlet', 'Out of stock'].map((r) => (
                <div
                  key={r}
                  onClick={() => setCancelReason(r)}
                  className={`p-3 rounded-xl border cursor-pointer font-semibold flex items-center justify-between transition-colors ${
                    cancelReason === r
                      ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                      : 'bg-black/30 border-white/5 text-slate-300 hover:bg-black/50'
                  }`}
                >
                  <span>{r}</span>
                  {cancelReason === r && <Check className="w-4 h-4" />}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowCancelReasonModal(false)}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrderCancellation}
                className="py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PARTIAL DELIVERY & MAKE SALES (Screenshot 2 Screen 4/5) */}
      {/* ========================================================= */}
      {isEditingPartialOrder && selectedOrderForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1e2026] border border-white/10 p-4 space-y-3 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="font-bold text-sm text-emerald-400">Confirm Order & Make Sales</h4>
              <button onClick={() => setIsEditingPartialOrder(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Retailer Info Header (Green card from Screenshot 2) */}
            <div className="p-3 rounded-xl bg-emerald-600 text-white space-y-1 font-semibold text-xs">
              <div className="font-bold text-sm">Retailer: {selectedOrderForAction.customerName}</div>
              <div>Market: Kadamtoly Doria / Mirpur</div>
              <div>Distributor: {selectedOrderForAction.distributorName}</div>
              <div>Channel: {selectedOrderForAction.channel}</div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Delivered Items</span>
              <div className="space-y-2">
                {selectedOrderForAction.items.map((it: any) => (
                  <div key={it.productId} className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{it.productName}</div>
                      <div className="text-[10px] text-slate-400">Ordered Qty: {it.quantity} • ৳{it.unitPriceBDT}/unit</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Delivered:</span>
                      <input
                        type="number"
                        min={0}
                        max={it.quantity}
                        defaultValue={it.quantity}
                        className="w-14 p-1 rounded-lg bg-slate-800 border border-white/10 text-center font-bold text-amber-400 font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setBannerNotice(`✅ Partial delivery invoice confirmed for ${selectedOrderForAction.customerName}! Stock deducted.`);
                setIsEditingPartialOrder(false);
                setSelectedOrderForAction(null);
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg"
            >
              Save Sales Invoice
            </button>
          </div>
        </div>
      )}

      {/* MODAL: OFFICIAL CHALLAN COPY */}
      {selectedMobileOrderForChallan && (
        <ChallanModal
          order={selectedMobileOrderForChallan}
          onClose={() => setSelectedMobileOrderForChallan(null)}
          onUpdateOrder={updateSalesOrder}
          onSwitchToDO={() => {
            const ord = selectedMobileOrderForChallan;
            setSelectedMobileOrderForChallan(null);
            setSelectedMobileOrderForDO(ord);
          }}
          onDispatchAndInvoice={(orderId) => {
            dispatchAndInvoiceSalesOrder(orderId);
            setBannerNotice(`✅ Order ${selectedMobileOrderForChallan.orderNumber} dispatched with Challan copy!`);
            setSelectedMobileOrderForChallan(null);
          }}
        />
      )}

      {/* MODAL: OFFICIAL DELIVERY ORDER (D.O.) COPY */}
      {selectedMobileOrderForDO && (
        <DeliveryOrderModal
          order={selectedMobileOrderForDO}
          onClose={() => setSelectedMobileOrderForDO(null)}
          onUpdateOrder={updateSalesOrder}
          onSwitchToChallan={() => {
            const ord = selectedMobileOrderForDO;
            setSelectedMobileOrderForDO(null);
            setSelectedMobileOrderForChallan(ord);
          }}
        />
      )}

      {/* MODAL: ENSURE & CONFIRM CUSTOMER RECEIPT */}
      {selectedMobileOrderForReceipt && (
        <CustomerReceiptModal
          order={selectedMobileOrderForReceipt}
          onClose={() => setSelectedMobileOrderForReceipt(null)}
          onConfirmReceipt={(orderId, details) => {
            confirmCustomerReceipt(orderId, details);
            setBannerNotice(
              `🎉 Handover complete! Order ${selectedMobileOrderForReceipt.orderNumber} confirmed received by ${details.receiverName} (${details.receiverPhone}).`
            );
            setSelectedMobileOrderForReceipt(null);
          }}
        />
      )}
    </div>
  );
};
