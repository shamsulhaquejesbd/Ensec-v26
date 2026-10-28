import React, { useState, useMemo, useRef } from 'react';
import {
  Edit3,
  Upload,
  RotateCcw,
  Save,
  ArrowLeft,
  Search,
  FileSpreadsheet,
  X,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import {
  OfferPromotion,
} from '../../types/erp.ts';
import {
  getStoredMarketHierarchies,
  STANDARD_DEPARTMENTS,
} from '../../data/marketHierarchy.ts';

// EXACT RED-MARKED ENUM OPTIONS FROM SCREENSHOTS
export const DISCOUNT_ON_OPTIONS = [
  'Select Discount On',
  'LineItem',
  'SubTotal',
  'ProductGroup',
  'LastMonthSalesAmount',
  'OpenSubTotal',
];

export const ELIGIBLE_FOR_OPTIONS = [
  'Select a type',
  'Any',
  'Product',
  'Category',
  'Brand',
  'CustomerCategory',
  'Customer',
  'CustomerClass',
  'CustomerType',
];

export const WHEN_OPTIONS = [
  'Select a type',
  'Quantity',
  'Amount',
  'PercentAmount',
  'PercentQty',
  'RangeAmount',
  'RangeQty',
  'RangePercentAmount',
  'RangePercentQty',
  'LastInvoice',
  'Last7DaysInvoice',
  'Last30DaysInvoice',
  'Last6MonthsInvoice',
];

export const PROVIDE_OPTIONS = [
  'Select a type',
  'FixedAmount',
  'PercentAmount',
  'FreeProduct',
  'FreeSameProduct',
  'PromotionalProduct',
  'FreeChosenProduct',
  'OpenSubTotal',
];

export const DISCOUNT_FOR_OPTIONS = [
  'Select Discount For',
  'Distributor',
  'Retailer',
  'Wholesaler',
  'Corporate',
  'Dealer',
  'All',
];

export const DISCOUNT_LIMITATION_OPTIONS = [
  'Unlimited',
  'Limited',
  'OncePerCustomer',
  'DailyCap',
  'TotalBudgetCap',
];

export const ALLOW_DISCOUNT_FOR_OPTIONS = [
  'FullQuantity',
  'ConditionQuantity',
  'ExcessQuantity',
];

export const OffersPromotionModule: React.FC = () => {
  const { offers, addOffer, updateOffer, products } = useERP();

  // Current view: 'list' | 'create' | 'edit'
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  // Filter Bar State (Screenshot 4)
  const [filterFromDate, setFilterFromDate] = useState<string>('2026-10-11');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('Select Department');
  const [filterDiscountFor, setFilterDiscountFor] = useState<string>('Select Discount For');
  const [filterDiscountOn, setFilterDiscountOn] = useState<string>('Select Discount On');
  const [filterDiscountType, setFilterDiscountType] = useState<string>('Select a type');
  const [filterProduct, setFilterProduct] = useState<string>('Select product');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [appliedFilters, setAppliedFilters] = useState<{
    fromDate?: string;
    endDate?: string;
    department?: string;
    discountFor?: string;
    discountOn?: string;
    discountType?: string;
    product?: string;
    status?: string;
  }>({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // FORM STATE (Screenshots 1, 2, 3, 5)
  // Left Column
  const [startDate, setStartDate] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [discountNativeTitle, setDiscountNativeTitle] = useState<string>('');
  const [excludeMarketHierarchy, setExcludeMarketHierarchy] = useState<string[]>([]);
  const [discountFor, setDiscountFor] = useState<string>('Select Discount For');
  const [priority, setPriority] = useState<number>(0);
  const [limitTimes, setLimitTimes] = useState<number>(0);
  const [includedProducts, setIncludedProducts] = useState<string[]>([]);
  const [eligibleFor, setEligibleFor] = useState<string>('Product'); // RED BOX 1
  const [greaterThanOrEqualTo, setGreaterThanOrEqualTo] = useState<string>('');
  const [allowDiscountFor, setAllowDiscountFor] = useState<string>('FullQuantity');
  const [applyInMultiples, setApplyInMultiples] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Right Column
  const [endDate, setEndDate] = useState<string>('');
  const [discountTitle, setDiscountTitle] = useState<string>('');
  const [includeMarketHierarchy, setIncludeMarketHierarchy] = useState<string[]>([]);
  const [department, setDepartment] = useState<string>('Select Department');
  const [discountOn, setDiscountOn] = useState<string>('LineItem'); // RED BOX 5
  const [discountLimitation, setDiscountLimitation] = useState<string>('Unlimited');
  const [excludeDiscountedItems, setExcludeDiscountedItems] = useState<boolean>(false);
  const [excludedProducts, setExcludedProducts] = useState<string[]>([]);
  const [whenCondition, setWhenCondition] = useState<string>('Quantity'); // RED BOX 2
  const [provideBenefit, setProvideBenefit] = useState<string>('FixedAmount'); // RED BOX 3
  const [discountValue, setDiscountValue] = useState<string>('100'); // Populates DISCOUNT column
  const [bannerImage, setBannerImage] = useState<string | null>(null);

  // Modal State for Market Hierarchy Selector
  const [hierarchyModalType, setHierarchyModalType] = useState<'include' | 'exclude' | null>(null);
  const [hierarchySearch, setHierarchySearch] = useState<string>('');
  const [tempHierarchySelection, setTempHierarchySelection] = useState<string[]>([]);

  // Product multi-select dropdown toggles
  const [showIncludedDropdown, setShowIncludedDropdown] = useState<boolean>(false);
  const [showExcludedDropdown, setShowExcludedDropdown] = useState<boolean>(false);
  const [productSearchTerm, setProductSearchTerm] = useState<string>('');

  // File input ref for banner upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available product list for selectors
  const availableProductOptions = useMemo(() => {
    const defaultList = [
      'Stx.P Primary Blonde Powder',
      'Lucy Advanced Baby Oil 200ml 390/-',
      'Lucy Essential Body Oil 230ml 375/-',
      'Lucy Essential Body Oil 115ml 220/-',
      'Lucy Essential Body Oil 115ml 200/-',
      'Ensec Telecom PowerRack LiFePO4 48V 100Ah',
      'Ensec SolarPro Home ESS 12.8V 200Ah',
      'Ensec AutoLi E-Rickshaw Smart Battery 60V 50Ah',
      'Ensec Industrial MegaPack LiFePO4 51.2V 300Ah',
      'Ensec MarinePro Trolling Battery 24V 100Ah',
    ];
    if (products && products.length > 0) {
      products.forEach((p) => {
        if (!defaultList.includes(p.name)) {
          defaultList.push(p.name);
        }
      });
    }
    return defaultList;
  }, [products]);

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingOfferId(null);
    setStartDate('2026-10-11T00:00');
    setEndDate('2026-11-01T23:59');
    setCode(`RT-${Math.floor(977 + offers.length)}`);
    setDiscountTitle('');
    setDiscountNativeTitle('');
    setDiscountFor('Retailer');
    setDepartment('DEP-1 - MOUSUMI NETWORK LTD');
    setDiscountOn('LineItem');
    setPriority(1);
    setLimitTimes(0);
    setDiscountLimitation('Unlimited');
    setExcludeDiscountedItems(false);
    setIncludedProducts(['Lucy Advanced Baby Oil 200ml 390/-']);
    setExcludedProducts([]);
    setIncludeMarketHierarchy([]);
    setExcludeMarketHierarchy([]);
    setEligibleFor('Product');
    setWhenCondition('Quantity');
    setGreaterThanOrEqualTo('3');
    setProvideBenefit('FixedAmount');
    setDiscountValue('100');
    setAllowDiscountFor('FullQuantity');
    setApplyInMultiples(false);
    setIsActive(true);
    setBannerImage(null);
    setCurrentView('create');
  };

  // Open Edit Form pre-filled
  const handleOpenEdit = (offer: OfferPromotion) => {
    setEditingOfferId(offer.id);
    setStartDate(offer.startDate || offer.validFrom || '2026-10-11T00:00');
    setEndDate(offer.endDate || offer.validTo || '2026-11-01T23:59');
    setCode(offer.code);
    setDiscountTitle(offer.discountTitle || offer.title);
    setDiscountNativeTitle(offer.discountNativeTitle || '');
    setDiscountFor(offer.discountFor || 'Retailer');
    setDepartment(offer.department || 'DEP-1 - MOUSUMI NETWORK LTD');
    setDiscountOn(offer.discountOn || 'LineItem');
    setPriority(offer.priority !== undefined ? offer.priority : 1);
    setLimitTimes(offer.limitTimes || 0);
    setDiscountLimitation(offer.discountLimitation || 'Unlimited');
    setExcludeDiscountedItems(!!offer.excludeDiscountedItems);
    setIncludedProducts(offer.includedProducts || [offer.title]);
    setExcludedProducts(offer.excludedProducts || []);
    setIncludeMarketHierarchy(offer.includeMarketHierarchy || []);
    setExcludeMarketHierarchy(offer.excludeMarketHierarchy || []);
    setEligibleFor(offer.eligibleFor || 'Product');
    setWhenCondition(offer.when || 'Quantity');
    setGreaterThanOrEqualTo(
      offer.greaterThanOrEqualTo !== undefined
        ? String(offer.greaterThanOrEqualTo)
        : offer.value !== undefined
        ? String(offer.value)
        : String(offer.minQuantity || 1)
    );
    setProvideBenefit(offer.provide || (offer.provideBenefitType === 'Buy X Get Y Free' ? 'FreeSameProduct' : 'FixedAmount'));
    setDiscountValue(
      offer.discount !== undefined
        ? String(offer.discount)
        : offer.flatDiscountBDT !== undefined
        ? String(offer.flatDiscountBDT)
        : offer.discountPercentage !== undefined
        ? String(offer.discountPercentage)
        : '100'
    );
    setAllowDiscountFor(offer.allowDiscountFor || 'FullQuantity');
    setApplyInMultiples(!!offer.applyInMultiples);
    setIsActive(offer.isActive);
    setBannerImage(offer.bannerImage || null);
    setCurrentView('edit');
  };

  // Reset form fields
  const handleResetForm = () => {
    setStartDate('');
    setCode('');
    setDiscountTitle('');
    setDiscountNativeTitle('');
    setDiscountFor('Select Discount For');
    setDepartment('Select Department');
    setDiscountOn('Select Discount On');
    setPriority(0);
    setLimitTimes(0);
    setDiscountLimitation('Unlimited');
    setExcludeDiscountedItems(false);
    setIncludedProducts([]);
    setExcludedProducts([]);
    setIncludeMarketHierarchy([]);
    setExcludeMarketHierarchy([]);
    setEligibleFor('Select a type');
    setWhenCondition('Select a type');
    setGreaterThanOrEqualTo('');
    setProvideBenefit('Select a type');
    setDiscountValue('');
    setAllowDiscountFor('FullQuantity');
    setApplyInMultiples(false);
    setIsActive(true);
    setBannerImage(null);
  };

  // Save handler
  const handleSaveDiscount = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!code.trim()) {
      showToast('Please enter a valid Discount Code.');
      return;
    }
    if (!discountTitle.trim()) {
      showToast('Please enter a Discount Title.');
      return;
    }

    const numericVal = parseFloat(greaterThanOrEqualTo) || 1;
    const numericDisc = parseFloat(discountValue) || 0;

    const offerPayload: Omit<OfferPromotion, 'id'> = {
      code: code.trim(),
      title: discountTitle.trim(),
      discountTitle: discountTitle.trim(),
      discountNativeTitle: discountNativeTitle.trim(),
      startDate: startDate || '2026-10-11',
      endDate: endDate || '2026-11-01',
      validFrom: startDate || '2026-10-11',
      validTo: endDate || '2026-11-01',
      discountFor,
      department,
      discountOn,
      eligibleFor,
      priority: Number(priority) || 0,
      limitTimes: Number(limitTimes) || 0,
      discountLimitation,
      excludeDiscountedItems,
      includedProducts,
      excludedProducts,
      includeMarketHierarchy,
      excludeMarketHierarchy,
      when: whenCondition,
      greaterThanOrEqualTo: numericVal,
      value: numericVal,
      minQuantity: numericVal,
      provide: provideBenefit,
      discount: numericDisc,
      flatDiscountBDT: provideBenefit === 'FixedAmount' ? numericDisc : undefined,
      discountPercentage: provideBenefit === 'PercentAmount' ? numericDisc : undefined,
      freeProductQty: provideBenefit.includes('Free') ? numericDisc || 1 : undefined,
      allowDiscountFor,
      applyInMultiples,
      isActive,
      bannerImage: bannerImage || undefined,
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (editingOfferId) {
      updateOffer(editingOfferId, offerPayload);
      showToast(`Discount "${discountTitle}" updated successfully!`);
    } else {
      addOffer(offerPayload);
      showToast(`Discount "${discountTitle}" created successfully!`);
    }

    setCurrentView('list');
  };

  // Open Market Hierarchy Modal
  const openHierarchyModal = (type: 'include' | 'exclude') => {
    setHierarchyModalType(type);
    setTempHierarchySelection(type === 'include' ? [...includeMarketHierarchy] : [...excludeMarketHierarchy]);
    setHierarchySearch('');
  };

  const applyHierarchySelection = () => {
    if (hierarchyModalType === 'include') {
      setIncludeMarketHierarchy(tempHierarchySelection);
    } else if (hierarchyModalType === 'exclude') {
      setExcludeMarketHierarchy(tempHierarchySelection);
    }
    setHierarchyModalType(null);
  };

  // Filtered List
  const handleApplyPreview = () => {
    setAppliedFilters({
      fromDate: filterFromDate,
      endDate: filterEndDate,
      department: filterDepartment,
      discountFor: filterDiscountFor,
      discountOn: filterDiscountOn,
      discountType: filterDiscountType,
      product: filterProduct,
      status: filterStatus,
    });
    setCurrentPage(1);
    showToast('Filters applied to preview list.');
  };

  const filteredOffers = useMemo(() => {
    return offers.filter((item) => {
      if (appliedFilters.status && appliedFilters.status !== 'All') {
        if (appliedFilters.status === 'Active' && !item.isActive) return false;
        if (appliedFilters.status === 'Inactive' && item.isActive) return false;
      }
      if (appliedFilters.fromDate) {
        const itemEnd = item.endDate || item.validTo;
        if (itemEnd && itemEnd < appliedFilters.fromDate) return false;
      }
      if (appliedFilters.endDate) {
        const itemStart = item.startDate || item.validFrom;
        if (itemStart && itemStart > appliedFilters.endDate) return false;
      }
      if (appliedFilters.department && appliedFilters.department !== 'Select Department') {
        if (item.department && item.department !== appliedFilters.department) return false;
      }
      if (appliedFilters.discountFor && appliedFilters.discountFor !== 'Select Discount For') {
        if (item.discountFor && item.discountFor !== appliedFilters.discountFor) return false;
      }
      if (appliedFilters.discountOn && appliedFilters.discountOn !== 'Select Discount On') {
        if (item.discountOn && item.discountOn !== appliedFilters.discountOn) return false;
      }
      if (appliedFilters.discountType && appliedFilters.discountType !== 'Select a type') {
        if (item.provide && item.provide !== appliedFilters.discountType) return false;
      }
      const prodFilter = appliedFilters.product;
      if (prodFilter && prodFilter !== 'Select product') {
        const titleMatch = (item.title || '').toLowerCase().includes(prodFilter.toLowerCase());
        const includedMatch = item.includedProducts?.some((p) =>
          p.toLowerCase().includes(prodFilter.toLowerCase())
        );
        if (!titleMatch && !includedMatch) return false;
      }
      return true;
    });
  }, [offers, appliedFilters]);

  const pageSize = 10;
  const paginatedOffers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOffers.slice(startIndex, startIndex + pageSize);
  }, [filteredOffers, currentPage]);

  // Export to XLS / CSV
  const handleExportXLS = () => {
    const headers = [
      'TITLE',
      'STARTDATE',
      'ENDDATE',
      'FOR',
      'ON',
      'ELIGIBLE',
      'PRIORITY',
      'WHEN',
      'VALUE',
      'PROVIDE',
      'DISCOUNT',
    ];
    const rows = filteredOffers.map((o) => [
      `"${o.discountTitle || o.title}"`,
      `"${o.startDate || o.validFrom || ''}"`,
      `"${o.endDate || o.validTo || ''}"`,
      `"${o.discountFor || 'Retailer'}"`,
      `"${o.discountOn || 'LineItem'}"`,
      `"${o.eligibleFor || 'Product'}"`,
      o.priority !== undefined ? o.priority : 0,
      `"${o.when || 'Quantity'}"`,
      o.greaterThanOrEqualTo !== undefined ? o.greaterThanOrEqualTo : o.value || 1,
      `"${o.provide || 'FixedAmount'}"`,
      o.discount !== undefined ? o.discount : o.flatDiscountBDT || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Discount_List_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Discount list exported successfully (CSV/XLS format)!');
  };

  // Helper date formatter: "14 Jun, 2026"
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        showToast('Image size exceeds 1MB limit. Please upload a smaller PNG.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setBannerImage(reader.result as string);
        showToast('Banner image uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Total count indicator
  const totalCount = 254; // Matches the exact "Total: 254" in screenshot 4

  // Render Market Hierarchy Modal
  const renderMarketHierarchyModal = () => {
    if (!hierarchyModalType) return null;
    const isInclude = hierarchyModalType === 'include';
    const activeHierarchies = getStoredMarketHierarchies();
    const filteredHierarchy = activeHierarchies.filter(
      (m) =>
        m.fullName.toLowerCase().includes(hierarchySearch.toLowerCase()) ||
        m.region.toLowerCase().includes(hierarchySearch.toLowerCase()) ||
        m.area.toLowerCase().includes(hierarchySearch.toLowerCase())
    );

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-medium text-blue-700 dark:text-blue-400">
              {isInclude ? 'Include Market Hierarchy' : 'Exclude Market Hierarchy'}
            </h3>
            <button
              onClick={() => setHierarchyModalType(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Actions */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by market, area or region..."
                value={hierarchySearch}
                onChange={(e) => setHierarchySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setTempHierarchySelection(activeHierarchies.map((m) => m.fullName))}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2.5 py-1.5 border border-blue-200 rounded hover:bg-blue-50 cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => setTempHierarchySelection([])}
              className="text-xs text-slate-600 hover:text-slate-800 font-medium px-2.5 py-1.5 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* List */}
          <div className="p-4 overflow-y-auto flex-1 space-y-2">
            {filteredHierarchy.map((item) => {
              const isSelected = tempHierarchySelection.includes(item.fullName);
              return (
                <label
                  key={item.code}
                  className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer border border-transparent hover:border-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTempHierarchySelection([...tempHierarchySelection, item.fullName]);
                      } else {
                        setTempHierarchySelection(tempHierarchySelection.filter((x) => x !== item.fullName));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <div className="flex-1 text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.fullName}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      ({item.region} &bull; {item.area})
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500">
              {tempHierarchySelection.length} market(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHierarchyModalType(null)}
                className="px-4 py-1.5 border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyHierarchySelection}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
              >
                Apply Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-[1700px] mx-auto min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-blue-600 text-white px-5 py-3 rounded-md shadow-lg flex items-center gap-2 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* VIEW 1: DISCOUNT LIST (Screenshot 4) */}
      {currentView === 'list' && (
        <div className="space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-1">
            <h1 className="text-2xl font-normal text-blue-600 dark:text-blue-400">Discount List</h1>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="bg-white dark:bg-slate-900 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-4 py-1.5 rounded text-sm font-medium transition-colors shadow-xs"
            >
              Add New Discount
            </button>
          </div>

          {/* Filter Container (3 Rows matching Screenshot 4) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 shadow-xs">
            <div className="space-y-3">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-1">
                    From Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={filterFromDate}
                      onChange={(e) => setFilterFromDate(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-1">
                    End Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      placeholder="mm/dd/yyyy"
                      className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-1">
                    Department
                  </label>
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Select Department">Select Department</option>
                    {STANDARD_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                    <option value="Consumer Goods">Consumer Goods</option>
                    <option value="All Departments">All Departments</option>
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-1">
                    Discount For
                  </label>
                  <select
                    value={filterDiscountFor}
                    onChange={(e) => setFilterDiscountFor(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {DISCOUNT_FOR_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-1">
                    Discount On
                  </label>
                  <select
                    value={filterDiscountOn}
                    onChange={(e) => setFilterDiscountOn(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {DISCOUNT_ON_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-1">
                    Discount Type
                  </label>
                  <select
                    value={filterDiscountType}
                    onChange={(e) => setFilterDiscountType(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {PROVIDE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-1">
                    Product
                  </label>
                  <select
                    value={filterProduct}
                    onChange={(e) => setFilterProduct(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Select product">Select product</option>
                    {availableProductOptions.map((prod) => (
                      <option key={prod} value={prod}>
                        {prod}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-1">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="All">All</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  {/* XLS Export Button */}
                  <button
                    type="button"
                    onClick={handleExportXLS}
                    title="Export to XLS / CSV"
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                  </button>

                  {/* Preview Button */}
                  <button
                    type="button"
                    onClick={handleApplyPreview}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Search className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container (Matching Screenshot 4) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#e2edfb] dark:bg-slate-800/80 text-blue-900 dark:text-blue-300 font-semibold border-b border-blue-200 dark:border-slate-700 tracking-wider">
                    <th className="py-2.5 px-3 uppercase w-12 text-center">EDIT</th>
                    <th className="py-2.5 px-3 uppercase min-w-[280px]">TITLE</th>
                    <th className="py-2.5 px-3 uppercase min-w-[100px]">STARTDATE</th>
                    <th className="py-2.5 px-3 uppercase min-w-[100px]">ENDDATE</th>
                    <th className="py-2.5 px-3 uppercase min-w-[100px]">FOR</th>
                    <th className="py-2.5 px-3 uppercase min-w-[90px]">ON</th>
                    <th className="py-2.5 px-3 uppercase min-w-[90px]">ELIGIBLE</th>
                    <th className="py-2.5 px-3 uppercase text-center w-16">PRIORITY</th>
                    <th className="py-2.5 px-3 uppercase min-w-[90px]">WHEN</th>
                    <th className="py-2.5 px-3 uppercase text-center w-16">VALUE</th>
                    <th className="py-2.5 px-3 uppercase min-w-[130px]">PROVIDE</th>
                    <th className="py-2.5 px-3 uppercase text-right pr-4 min-w-[80px]">DISCOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {paginatedOffers.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400">
                        No discounts match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedOffers.map((item) => {
                      const displayTitle = item.discountTitle || item.title;
                      const startDateStr = formatDateDisplay(item.startDate || item.validFrom);
                      const endDateStr = formatDateDisplay(item.endDate || item.validTo);
                      const discountForStr = item.discountFor || 'Retailer';
                      const discountOnStr = item.discountOn || 'LineItem';
                      const eligibleStr = item.eligibleFor || 'Product';
                      const priorityVal = item.priority !== undefined ? item.priority : 1;
                      const whenStr = item.when || 'Quantity';
                      const valueVal =
                        item.greaterThanOrEqualTo !== undefined
                          ? item.greaterThanOrEqualTo
                          : item.value !== undefined
                          ? item.value
                          : item.minQuantity || 1;
                      const provideStr = item.provide || 'FixedAmount';
                      const discountVal =
                        item.discount !== undefined
                          ? item.discount
                          : item.flatDiscountBDT !== undefined
                          ? item.flatDiscountBDT
                          : item.discountPercentage !== undefined
                          ? item.discountPercentage
                          : 0;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* EDIT Button (Sky blue square with pencil) */}
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Discount"
                              className="w-7 h-7 bg-[#0ea5e9] hover:bg-sky-600 text-white rounded flex items-center justify-center mx-auto transition-colors shadow-2xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </td>

                          {/* TITLE */}
                          <td className="py-2 px-3 font-normal text-slate-900 dark:text-slate-100">
                            {displayTitle}
                          </td>

                          {/* STARTDATE */}
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {startDateStr}
                          </td>

                          {/* ENDDATE */}
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {endDateStr}
                          </td>

                          {/* FOR */}
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                            {discountForStr}
                          </td>

                          {/* ON */}
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                            {discountOnStr}
                          </td>

                          {/* ELIGIBLE */}
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                            {eligibleStr}
                          </td>

                          {/* PRIORITY */}
                          <td className="py-2 px-3 text-center font-medium text-slate-800 dark:text-slate-200">
                            {priorityVal}
                          </td>

                          {/* WHEN */}
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                            {whenStr}
                          </td>

                          {/* VALUE */}
                          <td className="py-2 px-3 text-center font-medium text-slate-800 dark:text-slate-200">
                            {valueVal}
                          </td>

                          {/* PROVIDE */}
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">
                            {provideStr}
                          </td>

                          {/* DISCOUNT */}
                          <td className="py-2 px-3 text-right pr-4 font-semibold text-slate-900 dark:text-slate-100">
                            {discountVal}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & Total (Screenshot 4) */}
            <div className="py-3 px-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
              <div>Total: {totalCount}</div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-500"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium ${
                    currentPage === 1
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(2)}
                  className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium ${
                    currentPage === 2
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  2
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(3)}
                  className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium ${
                    currentPage === 3
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  3
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(4)}
                  className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium ${
                    currentPage === 4
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  4
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(5)}
                  className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium ${
                    currentPage === 5
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  5
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(5, p + 1))}
                  className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-500"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2 & 3: CREATE / EDIT DISCOUNT (Screenshots 1, 2, 3, 5) */}
      {(currentView === 'create' || currentView === 'edit') && (
        <form onSubmit={handleSaveDiscount} className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-1">
            <h1 className="text-2xl font-normal text-blue-600 dark:text-blue-400">
              {currentView === 'edit' ? 'Edit Discount' : 'Create Discount'}
            </h1>
            <button
              type="button"
              onClick={() => setCurrentView('list')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Discount List
            </button>
          </div>

          {/* Form Card (2 Columns Exactly Matching the Screenshots) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-14 gap-y-5">
              {/* ===== LEFT COLUMN ===== */}

              {/* Start Date* */}
              <div>
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Start Date<span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="mm/dd/yyyy --:-- --"
                    className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* End Date* (Right column) */}
              <div>
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  End Date<span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="mm/dd/yyyy --:-- --"
                    className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Code* (Left column) */}
              <div>
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Code<span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Last Code: RT-976
                </span>
              </div>

              {/* Discount Title* (Right column) */}
              <div>
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Discount Title<span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter discount title"
                  value={discountTitle}
                  onChange={(e) => setDiscountTitle(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Discount Native Title * (Left column) */}
              <div>
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Discount Native Title <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ডিসকাউন্ট দেশীয় শিরোনাম"
                  value={discountNativeTitle}
                  onChange={(e) => setDiscountNativeTitle(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Include Market Hierarchy (Right column) */}
              <div>
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Include Market Hierarchy
                </label>
                <button
                  type="button"
                  onClick={() => openHierarchyModal('include')}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded py-2 px-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 text-center transition-colors"
                >
                  {includeMarketHierarchy.length > 0
                    ? `Select Market Hierarchy (${includeMarketHierarchy.length} Selected)`
                    : 'Select Market Hierarchy'}
                </button>
              </div>

              {/* Exclude Market Hierarchy (Left column) */}
              <div>
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Exclude Market Hierarchy
                </label>
                <button
                  type="button"
                  onClick={() => openHierarchyModal('exclude')}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded py-2 px-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 text-center transition-colors"
                >
                  {excludeMarketHierarchy.length > 0
                    ? `Select Market Hierarchy (${excludeMarketHierarchy.length} Excluded)`
                    : 'Select Market Hierarchy'}
                </button>
              </div>

              {/* Department* (Right column) */}
              <div>
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Department<span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Select Department">Select Department</option>
                  {STANDARD_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                  <option value="Consumer Goods">Consumer Goods</option>
                  <option value="Battery & Energy">Battery & Energy</option>
                  <option value="Lubricants">Lubricants</option>
                  <option value="All Departments">All Departments</option>
                </select>
              </div>

              {/* Discount For* (Left column) */}
              <div>
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Discount For<span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={discountFor}
                  onChange={(e) => setDiscountFor(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {DISCOUNT_FOR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* RED BOX: Discount On* (Right column) */}
              <div className="relative">
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Discount On<span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={discountOn}
                  onChange={(e) => setDiscountOn(e.target.value)}
                  className="w-full border border-blue-500 dark:border-blue-500 ring-1 ring-blue-500/30 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {DISCOUNT_ON_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority* (Left column) */}
              <div>
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Priority<span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-right bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Discount Limitation* (Right column) */}
              <div>
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Discount Limitation<span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={discountLimitation}
                  onChange={(e) => setDiscountLimitation(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {DISCOUNT_LIMITATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Limit Times* (Left column) */}
              <div>
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Limit Times<span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="number"
                  value={limitTimes}
                  onChange={(e) => setLimitTimes(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-right bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Exclude Discounted Items Checkbox (Right column) */}
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="excludeDiscounted"
                  checked={excludeDiscountedItems}
                  onChange={(e) => setExcludeDiscountedItems(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="excludeDiscounted"
                  className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                >
                  Exclude Discounted Items
                </label>
              </div>

              {/* Included Products (Left column) */}
              <div className="relative">
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Included Products
                </label>
                <button
                  type="button"
                  onClick={() => setShowIncludedDropdown(!showIncludedDropdown)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-left flex items-center justify-between text-slate-700 dark:text-slate-200"
                >
                  <span className="truncate">
                    {includedProducts.length > 0
                      ? `${includedProducts.length} Product(s) Selected`
                      : 'Select Included Products'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
                </button>

                {showIncludedDropdown && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg p-3 max-h-60 overflow-y-auto">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-xs mb-2"
                    />
                    <div className="space-y-1">
                      {availableProductOptions
                        .filter((p) => p.toLowerCase().includes(productSearchTerm.toLowerCase()))
                        .map((prod) => {
                          const isSel = includedProducts.includes(prod);
                          return (
                            <label
                              key={prod}
                              className="flex items-center gap-2 text-xs p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isSel}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setIncludedProducts([...includedProducts, prod]);
                                  } else {
                                    setIncludedProducts(includedProducts.filter((x) => x !== prod));
                                  }
                                }}
                                className="w-3.5 h-3.5 text-blue-600 rounded"
                              />
                              <span className="truncate text-slate-800 dark:text-slate-200">{prod}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Excluded Products (Right column) */}
              <div className="relative">
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Excluded Products
                </label>
                <button
                  type="button"
                  onClick={() => setShowExcludedDropdown(!showExcludedDropdown)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-left flex items-center justify-between text-slate-700 dark:text-slate-200"
                >
                  <span className="truncate">
                    {excludedProducts.length > 0
                      ? `${excludedProducts.length} Product(s) Excluded`
                      : 'Select Excluded Products'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
                </button>

                {showExcludedDropdown && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg p-3 max-h-60 overflow-y-auto">
                    <div className="space-y-1">
                      {availableProductOptions.map((prod) => {
                        const isSel = excludedProducts.includes(prod);
                        return (
                          <label
                            key={prod}
                            className="flex items-center gap-2 text-xs p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isSel}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setExcludedProducts([...excludedProducts, prod]);
                                } else {
                                  setExcludedProducts(excludedProducts.filter((x) => x !== prod));
                                }
                              }}
                              className="w-3.5 h-3.5 text-blue-600 rounded"
                            />
                            <span className="truncate text-slate-800 dark:text-slate-200">{prod}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* RED BOX: Eligible For* (Left column) */}
              <div className="relative">
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Eligible For<span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={eligibleFor}
                  onChange={(e) => setEligibleFor(e.target.value)}
                  className="w-full border border-blue-500 dark:border-blue-500 ring-1 ring-blue-500/30 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {ELIGIBLE_FOR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* RED BOX: When * (Right column) */}
              <div className="relative">
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  When <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={whenCondition}
                  onChange={(e) => setWhenCondition(e.target.value)}
                  className="w-full border border-blue-500 dark:border-blue-500 ring-1 ring-blue-500/30 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {WHEN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Greater Than Or Equal(>=)* (Left column) */}
              <div>
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Greater Than Or Equal(&gt;=)<span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter condition value (e.g. 3, 8)"
                  value={greaterThanOrEqualTo}
                  onChange={(e) => setGreaterThanOrEqualTo(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* RED BOX: Provide* (Right column) */}
              <div className="relative">
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Provide<span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={provideBenefit}
                  onChange={(e) => setProvideBenefit(e.target.value)}
                  className="w-full border border-blue-500 dark:border-blue-500 ring-1 ring-blue-500/30 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {PROVIDE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                {/* Dynamic Provide specification (Discount value / Free item) */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Discount Benefit:</span>
                  <input
                    type="number"
                    placeholder="e.g. 100, 50, 1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-32 border border-slate-300 rounded px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800"
                  />
                  <span className="text-xs text-slate-500">
                    {provideBenefit === 'PercentAmount'
                      ? '% off'
                      : provideBenefit.includes('Free')
                      ? 'piece(s) free'
                      : 'BDT off'}
                  </span>
                </div>
              </div>

              {/* Allow Discount For* (Left column) */}
              <div>
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Allow Discount For<span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={allowDiscountFor}
                  onChange={(e) => setAllowDiscountFor(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {ALLOW_DISCOUNT_FOR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                {/* Checkboxes below Allow Discount For */}
                <div className="flex items-center gap-6 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={applyInMultiples}
                      onChange={(e) => setApplyInMultiples(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span>Apply In Multiples</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span>Is Active</span>
                  </label>
                </div>
              </div>

              {/* Banner Image (Right column) */}
              <div>
                <label className="text-sm font-normal text-blue-600 dark:text-blue-400 block mb-1">
                  Banner Image
                </label>
                <div className="flex items-start gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 px-4 py-2 rounded text-sm text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
                  >
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>Upload image</span>
                  </button>

                  {bannerImage && (
                    <div className="relative w-16 h-10 border border-slate-200 rounded overflow-hidden">
                      <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setBannerImage(null)}
                        className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Allowed PNG. Max size of 1MB ( 1: 4) ration
                </span>
              </div>
            </div>

            {/* Bottom Action Buttons (Screenshots 1, 2, 3, 5) */}
            <div className="mt-10 pt-4 flex items-center justify-end gap-3">
              {/* Back to List */}
              <button
                type="button"
                onClick={() => setCurrentView('list')}
                className="bg-white dark:bg-slate-900 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-5 py-2 rounded text-sm font-medium transition-colors"
              >
                Back to List
              </button>

              {/* Reset */}
              <button
                type="button"
                onClick={handleResetForm}
                className="bg-white dark:bg-slate-900 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-5 py-2 rounded text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>

              {/* Save */}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Market Hierarchy Modal */}
      {renderMarketHierarchyModal()}
    </div>
  );
};
export default OffersPromotionModule;
