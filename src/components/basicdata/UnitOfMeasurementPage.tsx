import React, { useState, useMemo } from 'react';
import {
  Search,
  Edit,
  RotateCcw,
  Save,
  FileSpreadsheet,
  Printer,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Ruler,
  Boxes,
  Cpu,
  Layers,
  Sparkles,
  Scale,
  Package,
  Plus,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { UnitOfMeasurement, UOMApplicableTo } from '../../types/erp.ts';

export const UnitOfMeasurementPage: React.FC = () => {
  const { uoms, addUOM, updateUOM, deleteUOM, products, rawMaterials } = useERP();

  // View state: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [applicableFilter, setApplicableFilter] = useState<'All' | UOMApplicableTo>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'All' | 'Inactive'>('Active');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedUOMForDetails, setSelectedUOMForDetails] = useState<UnitOfMeasurement | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected UOM for editing
  const [editingUOM, setEditingUOM] = useState<UnitOfMeasurement | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formNativeName, setFormNativeName] = useState('');
  const [formApplicableTo, setFormApplicableTo] = useState<UOMApplicableTo>('Finish Product');
  const [formCategory, setFormCategory] = useState<string>('Discrete Count');
  const [formIsBaseUnit, setFormIsBaseUnit] = useState(false);
  const [formAllowDecimals, setFormAllowDecimals] = useState(false);
  const [formDecimalPlaces, setFormDecimalPlaces] = useState<number>(0);
  const [formStandardPackagingRate, setFormStandardPackagingRate] = useState<number>(1);
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Compute Next Suggested Code
  const getNextSuggestedCode = () => {
    const numbers = uoms
      .map((u) => {
        const match = u.code.match(/UOM-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 17;
    const next = maxNum + 1;
    return `UOM-${next < 10 ? '00' + next : next < 100 ? '0' + next : next}`;
  };

  // Open Create View
  const handleOpenCreate = () => {
    setEditingUOM(null);
    setFormCode(getNextSuggestedCode());
    setFormName('');
    setFormSymbol('');
    setFormNativeName('');
    setFormApplicableTo('Finish Product');
    setFormCategory('Discrete Count');
    setFormIsBaseUnit(false);
    setFormAllowDecimals(false);
    setFormDecimalPlaces(0);
    setFormStandardPackagingRate(1);
    setFormDescription('');
    setFormIsActive(true);
    setFormError('');
    setViewMode('create');
  };

  // Open Edit View
  const handleOpenEdit = (uom: UnitOfMeasurement) => {
    setEditingUOM(uom);
    setFormCode(uom.code);
    setFormName(uom.name);
    setFormSymbol(uom.symbol);
    setFormNativeName(uom.nativeName || '');
    setFormApplicableTo(uom.applicableTo);
    setFormCategory(uom.category || 'Discrete Count');
    setFormIsBaseUnit(Boolean(uom.isBaseUnit));
    setFormAllowDecimals(uom.allowDecimals);
    setFormDecimalPlaces(uom.decimalPlaces || 0);
    setFormStandardPackagingRate(uom.standardPackagingRate || 1);
    setFormDescription(uom.description || '');
    setFormIsActive(uom.isActive);
    setFormError('');
    setViewMode('edit');
  };

  // Reset form
  const handleResetForm = () => {
    if (editingUOM) {
      setFormCode(editingUOM.code);
      setFormName(editingUOM.name);
      setFormSymbol(editingUOM.symbol);
      setFormNativeName(editingUOM.nativeName || '');
      setFormApplicableTo(editingUOM.applicableTo);
      setFormCategory(editingUOM.category || 'Discrete Count');
      setFormIsBaseUnit(Boolean(editingUOM.isBaseUnit));
      setFormAllowDecimals(editingUOM.allowDecimals);
      setFormDecimalPlaces(editingUOM.decimalPlaces || 0);
      setFormStandardPackagingRate(editingUOM.standardPackagingRate || 1);
      setFormDescription(editingUOM.description || '');
      setFormIsActive(editingUOM.isActive);
    } else {
      setFormCode(getNextSuggestedCode());
      setFormName('');
      setFormSymbol('');
      setFormNativeName('');
      setFormApplicableTo('Finish Product');
      setFormCategory('Discrete Count');
      setFormIsBaseUnit(false);
      setFormAllowDecimals(false);
      setFormDecimalPlaces(0);
      setFormStandardPackagingRate(1);
      setFormDescription('');
      setFormIsActive(true);
    }
    setFormError('');
  };

  // Save Form (Create or Edit)
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formCode.trim()) {
      setFormError('Code is required (e.g. UOM-001 or PCS)');
      return;
    }
    if (!formName.trim()) {
      setFormError('Unit Name is required (e.g. Pieces, Kilogram)');
      return;
    }
    if (!formSymbol.trim()) {
      setFormError('Symbol / Abbreviation is required (e.g. pcs, kg, m)');
      return;
    }

    if (editingUOM) {
      updateUOM(editingUOM.id, {
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        symbol: formSymbol.trim().toLowerCase(),
        nativeName: formNativeName.trim(),
        applicableTo: formApplicableTo,
        category: formCategory,
        isBaseUnit: formIsBaseUnit,
        allowDecimals: formAllowDecimals,
        decimalPlaces: formAllowDecimals ? Number(formDecimalPlaces) : 0,
        standardPackagingRate: Number(formStandardPackagingRate) || 1,
        description: formDescription.trim(),
        isActive: formIsActive,
      });
      setNotification(`Unit of Measurement ${formCode} updated successfully.`);
    } else {
      addUOM({
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        symbol: formSymbol.trim().toLowerCase(),
        nativeName: formNativeName.trim(),
        applicableTo: formApplicableTo,
        category: formCategory,
        isBaseUnit: formIsBaseUnit,
        allowDecimals: formAllowDecimals,
        decimalPlaces: formAllowDecimals ? Number(formDecimalPlaces) : 0,
        standardPackagingRate: Number(formStandardPackagingRate) || 1,
        description: formDescription.trim(),
        isActive: formIsActive,
      });
      setNotification(`Unit of Measurement ${formCode} created successfully.`);
    }

    setTimeout(() => setNotification(null), 3000);
    setViewMode('list');
  };

  // Delete Unit
  const handleDelete = (uom: UnitOfMeasurement) => {
    if (
      window.confirm(
        `Are you sure you want to delete unit "${uom.name} (${uom.symbol})"? This cannot be undone.`
      )
    ) {
      deleteUOM(uom.id);
      setNotification(`Unit ${uom.name} removed successfully.`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Toggle Status
  const handleToggleStatus = (uom: UnitOfMeasurement) => {
    updateUOM(uom.id, { isActive: !uom.isActive });
    setNotification(
      `Unit ${uom.symbol} marked as ${!uom.isActive ? 'Active' : 'Inactive'}.`
    );
    setTimeout(() => setNotification(null), 3000);
  };

  // Filtered UOMs
  const filteredUOMs = useMemo(() => {
    return uoms.filter((uom) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        uom.name.toLowerCase().includes(q) ||
        uom.code.toLowerCase().includes(q) ||
        uom.symbol.toLowerCase().includes(q) ||
        (uom.nativeName && uom.nativeName.toLowerCase().includes(q)) ||
        (uom.description && uom.description.toLowerCase().includes(q));

      const matchesApplicable =
        applicableFilter === 'All'
          ? true
          : applicableFilter === 'Both'
          ? uom.applicableTo === 'Both'
          : uom.applicableTo === applicableFilter || uom.applicableTo === 'Both';

      const matchesCategory =
        categoryFilter === 'All' ? true : uom.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Active'
          ? uom.isActive
          : !uom.isActive;

      return matchesSearch && matchesApplicable && matchesCategory && matchesStatus;
    });
  }, [uoms, searchQuery, applicableFilter, categoryFilter, statusFilter]);

  // Paginated UOMs
  const totalPages = Math.ceil(filteredUOMs.length / pageSize) || 1;
  const paginatedUOMs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUOMs.slice(start, start + pageSize);
  }, [filteredUOMs, currentPage, pageSize]);

  // Export to CSV/Excel
  const handleExportExcel = () => {
    const headers = [
      'CODE',
      'UNIT NAME',
      'SYMBOL',
      'NATIVE NAME',
      'APPLICABLE TO',
      'CATEGORY',
      'ALLOW DECIMALS',
      'DECIMAL PLACES',
      'BASE UNIT',
      'PACKAGING RATE',
      'ACTIVE',
      'DESCRIPTION',
    ];
    const rows = filteredUOMs.map((u) => [
      `"${u.code}"`,
      `"${u.name}"`,
      `"${u.symbol}"`,
      `"${u.nativeName || ''}"`,
      `"${u.applicableTo}"`,
      `"${u.category || ''}"`,
      u.allowDecimals ? 'Yes' : 'No',
      u.decimalPlaces || 0,
      u.isBaseUnit ? 'Yes' : 'No',
      u.standardPackagingRate || 1,
      u.isActive ? 'Yes' : 'No',
      `"${(u.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `ENSEC_Unit_of_Measurement_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics
  const finishCount = uoms.filter(
    (u) => u.applicableTo === 'Finish Product' || u.applicableTo === 'Both'
  ).length;
  const rawCount = uoms.filter(
    (u) => u.applicableTo === 'Raw Material' || u.applicableTo === 'Both'
  ).length;
  const activeCount = uoms.filter((u) => u.isActive).length;

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: UNIT OF MEASUREMENT LIST                                            */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Top Bar: Title & Create Button (matching Bank List design) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400">
                  <Ruler className="w-5 h-5" />
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-[#0284c7] dark:text-sky-400">
                  Unit of Measurement (UOM)
                </h1>
              </div>
              
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Master Sheet</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Unit</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Units
                </span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {uoms.length}
                </span>
                <span className="text-[10px] text-slate-500 block">System Defined</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Finish Products
                </span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {finishCount}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Across {products.length} models
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                  Raw Materials
                </span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {rawCount}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Across {rawMaterials.length} BOM items
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Active Units
                </span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {activeCount}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {uoms.length - activeCount} Inactive
                </span>
              </div>
            </div>
          </div>

          {/* Filters & Actions Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by code, unit name, native name, symbol..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Scope selector */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  {(['All', 'Finish Product', 'Raw Material', 'Both'] as const).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => {
                        setApplicableFilter(scope);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                        applicableFilter === scope
                          ? 'bg-white dark:bg-slate-900 text-[#0284c7] dark:text-sky-400 shadow-xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {scope === 'All'
                        ? 'All Scopes'
                        : scope === 'Finish Product'
                        ? 'Finish Product'
                        : scope === 'Raw Material'
                        ? 'Raw Material'
                        : 'Universal (Both)'}
                    </button>
                  ))}
                </div>

                {/* Status selector */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                >
                  <option value="Active">Active Only</option>
                  <option value="All">All Statuses</option>
                  <option value="Inactive">Inactive</option>
                </select>

                {/* Export Button */}
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Export to Excel / CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* UOM Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider font-bold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Unit Name</th>
                    <th className="py-3 px-4">Symbol</th>
                    <th className="py-3 px-4">Applicable To</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Precision / Decimals</th>
                    <th className="py-3 px-4">Pack Ratio</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedUOMs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        <Ruler className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-sm">No units of measurement found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Try adjusting search filters or click &quot;Create New Unit&quot;
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedUOMs.map((uom) => {
                      const isFinish =
                        uom.applicableTo === 'Finish Product';
                      const isRaw = uom.applicableTo === 'Raw Material';
                      const isBoth = uom.applicableTo === 'Both';

                      return (
                        <tr
                          key={uom.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800">
                              {uom.code}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{uom.name}</span>
                              {uom.isBaseUnit && (
                                <span
                                  title="Standard Base Unit"
                                  className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase tracking-wider"
                                >
                                  Base
                                </span>
                              )}
                            </div>
                            {uom.nativeName && (
                              <span className="text-[11px] text-slate-400 block font-normal">
                                {uom.nativeName}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {uom.symbol}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isFinish && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                <Package className="w-3 h-3" />
                                Finish Product
                              </span>
                            )}
                            {isRaw && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                <Cpu className="w-3 h-3" />
                                Raw Material
                              </span>
                            )}
                            {isBoth && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                <Layers className="w-3 h-3" />
                                Universal (Both)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {uom.category || 'Discrete Count'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {uom.allowDecimals ? (
                              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                {uom.decimalPlaces || 2} Decimals (Fractional)
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">
                                Whole (0 Decimals)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                            1 : {uom.standardPackagingRate || 1}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(uom)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                uom.isActive
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {uom.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedUOMForDetails(uom)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(uom)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                                title="Edit Unit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(uom)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                                title="Delete Unit"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

            {/* Pagination */}
            {filteredUOMs.length > 0 && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {Math.min(filteredUOMs.length, (currentPage - 1) * pageSize + 1)} to{' '}
                  {Math.min(filteredUOMs.length, currentPage * pageSize)} of {filteredUOMs.length} entries
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-mono font-bold">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: CREATE OR EDIT UNIT FORM (Matching BankListPage Form Design)         */}
      {/* ========================================================================= */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400">
                  <Ruler className="w-5 h-5" />
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-[#0284c7] dark:text-sky-400">
                  {viewMode === 'create' ? 'Create New Unit of Measurement' : `Edit Unit: ${formName}`}
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure measurement specifications, symbols, decimal precision, and applicability
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-3.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel & Back to List
            </button>
          </div>

          {/* Form Card */}
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6"
          >
            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              {/* Code */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Unit Code *
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. UOM-018, PCS, KG, MTR"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-sky-600 dark:text-sky-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Unique identifier used in system ledgers
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Unit Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Pieces, Kilogram, Linear Meter"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Standard formal title in reports
                </span>
              </div>

              {/* Symbol / Abbrev */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Symbol / Abbreviation *
                </label>
                <input
                  type="text"
                  required
                  value={formSymbol}
                  onChange={(e) => setFormSymbol(e.target.value)}
                  placeholder="e.g. pcs, kg, m, set, coil"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Short notation printed on invoices & BOMs
                </span>
              </div>

              {/* Native Name / Bengali */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Native / Bengali Title (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={formNativeName}
                  onChange={(e) => setFormNativeName(e.target.value)}
                  placeholder="e.g. পিস, কেজি, মিটার, সেট"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Used in local challans and depot delivery slips
                </span>
              </div>

              {/* APPLICABLE TO */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Applicable Product / Material Type *
                </label>
                <select
                  value={formApplicableTo}
                  onChange={(e) => setFormApplicableTo(e.target.value as UOMApplicableTo)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sky-600 dark:text-sky-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Finish Product">Finished Battery Products</option>
                  <option value="Raw Material">Factory Raw Materials & Components</option>
                  <option value="Both">Both (Universal Measurement)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Defines where this unit will be available for selection
                </span>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Measurement Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Discrete Count">Discrete Count (Whole items)</option>
                  <option value="Weight / Mass">Weight / Mass (Kg, Gram)</option>
                  <option value="Length / Dimension">Length / Dimension (Meters, Coils)</option>
                  <option value="Volume / Fluid">Volume / Fluid (Liters, ml)</option>
                  <option value="Packaging & Container">Packaging & Container (Carton, Pallet)</option>
                  <option value="Electrical Assembly">Electrical Assembly (Sets, Modules)</option>
                </select>
              </div>

              {/* Decimals Configuration */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allowDecimalsCheck"
                    checked={formAllowDecimals}
                    onChange={(e) => {
                      setFormAllowDecimals(e.target.checked);
                      if (!e.target.checked) setFormDecimalPlaces(0);
                      else if (formDecimalPlaces === 0) setFormDecimalPlaces(2);
                    }}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <label
                    htmlFor="allowDecimalsCheck"
                    className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    Allow Decimal / Fractional Quantities
                  </label>
                </div>
                <p className="text-[10px] text-slate-500">
                  Enable for weights or lengths (e.g. 1.25 kg, 4.5 meters). Keep off for discrete battery units.
                </p>

                {formAllowDecimals && (
                  <div className="pt-2">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Decimal Precision
                    </label>
                    <select
                      value={formDecimalPlaces}
                      onChange={(e) => setFormDecimalPlaces(parseInt(e.target.value) || 2)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    >
                      <option value={1}>1 Decimal Place (0.1)</option>
                      <option value={2}>2 Decimal Places (0.01)</option>
                      <option value={3}>3 Decimal Places (0.001 - precision weights)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Standard Packaging / Multiplier */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Standard Packaging Multiplier
                </label>
                <input
                  type="number"
                  min={0.001}
                  step="any"
                  value={formStandardPackagingRate}
                  onChange={(e) => setFormStandardPackagingRate(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  e.g. 1 for base, 4 for Carton (contains 4 units), 24 for Pallet
                </span>
              </div>

              {/* Base Unit & Status */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex flex-col justify-center space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isBaseUnitCheck"
                    checked={formIsBaseUnit}
                    onChange={(e) => setFormIsBaseUnit(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <label
                    htmlFor="isBaseUnitCheck"
                    className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    Mark as Category Base Unit
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label
                    htmlFor="isActiveCheck"
                    className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    Active for Transactions & Inventory
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Technical Description & Application Notes
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Standard discrete unit for complete factory finished LiFePO4 battery modules or raw copper busbars..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-xs"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Form</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingUOM ? 'Update Unit' : 'Save New Unit'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW UNIT DETAILS                                                  */}
      {/* ========================================================================= */}
      {selectedUOMForDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[#0284c7]" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Unit Specification: {selectedUOMForDetails.name} ({selectedUOMForDetails.symbol})
                </h3>
              </div>
              <button
                onClick={() => setSelectedUOMForDetails(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Code</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">
                    {selectedUOMForDetails.code}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Symbol</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {selectedUOMForDetails.symbol}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Scope</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedUOMForDetails.applicableTo}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <span
                    className={`font-bold ${
                      selectedUOMForDetails.isActive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {selectedUOMForDetails.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Native / Bengali:</span>
                  <span className="font-bold">{selectedUOMForDetails.nativeName || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-bold">{selectedUOMForDetails.category || 'Discrete Count'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Allow Decimals:</span>
                  <span className="font-bold">
                    {selectedUOMForDetails.allowDecimals
                      ? `Yes (${selectedUOMForDetails.decimalPlaces || 2} places)`
                      : 'No (Whole items only)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Standard Packaging Ratio:</span>
                  <span className="font-bold">1 : {selectedUOMForDetails.standardPackagingRate || 1}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Standard Base Unit:</span>
                  <span className="font-bold">
                    {selectedUOMForDetails.isBaseUnit ? 'Yes (Primary reference)' : 'No'}
                  </span>
                </div>
              </div>

              {selectedUOMForDetails.description && (
                <div className="p-3 rounded-lg bg-sky-50/50 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-[10px] text-sky-800 dark:text-sky-300 uppercase block mb-1">
                    Application Note
                  </span>
                  <p className="text-xs leading-relaxed">{selectedUOMForDetails.description}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = selectedUOMForDetails;
                  setSelectedUOMForDetails(null);
                  handleOpenEdit(target);
                }}
                className="px-4 py-1.5 bg-[#0284c7] text-white rounded-lg text-xs font-bold hover:bg-[#0369a1]"
              >
                Edit Unit
              </button>
              <button
                type="button"
                onClick={() => setSelectedUOMForDetails(null)}
                className="px-4 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINT PREVIEW / OFFICIAL DIRECTORY SLIP                            */}
      {/* ========================================================================= */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Printer className="w-4 h-4 text-sky-600" />
                Unit of Measurement Master Directory Print Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 print:p-0">
              <div className="border-b-2 border-sky-600 pb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-lg font-black tracking-tight text-sky-600 dark:text-sky-400">
                    ENSEC LITHIUM BATTERIES BANGLADESH
                  </h1>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Enterprise Resource Planning • Basic Data Units of Measurement Directory
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="px-3 py-1 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-black text-xs uppercase tracking-wider block">
                    UOM DIRECTORY
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Date: {new Date().toISOString().slice(0, 10)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Approved Standard Units ({filteredUOMs.length} entries)
                </h4>
                <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-700">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase">
                    <tr>
                      <th className="p-2">Code</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Symbol</th>
                      <th className="p-2">Applicable To</th>
                      <th className="p-2">Category</th>
                      <th className="p-2">Decimals</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredUOMs.map((u) => (
                      <tr key={u.id}>
                        <td className="p-2 font-mono font-bold">{u.code}</td>
                        <td className="p-2 font-semibold">
                          {u.name} {u.nativeName ? `(${u.nativeName})` : ''}
                        </td>
                        <td className="p-2 font-mono">{u.symbol}</td>
                        <td className="p-2 font-semibold">{u.applicableTo}</td>
                        <td className="p-2">{u.category || 'Discrete Count'}</td>
                        <td className="p-2 font-mono">{u.allowDecimals ? `${u.decimalPlaces} dec` : 'Whole'}</td>
                        <td className="p-2 font-bold">{u.isActive ? 'Active' : 'Inactive'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-bold block">Supply Chain & Factory Authority</span>
                  <span className="text-[10px] text-slate-400">Head of Manufacturing & BOM</span>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-bold block">Enterprise Administration</span>
                  <span className="text-[10px] text-slate-400">Managing Director / Super Admin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
