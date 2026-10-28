import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  PlusCircle,
  Search,
  AlertTriangle,
  DollarSign,
  Layers,
  CheckCircle2,
  Package,
  Warehouse,
  Filter,
  Info,
  Check,
  Edit3,
  SlidersHorizontal,
  RotateCw,
  Database,
  X,
  Trash2,
  Copy,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  FolderTree,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { RawMaterial } from '../../types/erp.ts';
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  checkSupabaseConfigured,
} from '../../lib/supabase.ts';

export interface RawMaterialsPageProps {
  onNavigate?: (module: string) => void;
}

export const RawMaterialsPage: React.FC<RawMaterialsPageProps> = ({ onNavigate }) => {
  const {
    rawMaterials,
    addRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
    refreshRawMaterials,
    rawMaterialCategories,
    uoms,
  } = useERP();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(getSupabaseUrl());
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(getSupabaseAnonKey());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isConfigured, setIsConfigured] = useState(checkSupabaseConfigured());
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-sync with Supabase on mount & config changes
  useEffect(() => {
    refreshRawMaterials();
    setIsConfigured(checkSupabaseConfigured());
    const handleConfigChange = () => {
      refreshRawMaterials();
      setIsConfigured(checkSupabaseConfigured());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('ensec-supabase-config-changed', handleConfigChange);
      return () => {
        window.removeEventListener('ensec-supabase-config-changed', handleConfigChange);
      };
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRawMaterials();
      setIsConfigured(checkSupabaseConfigured());
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(supabaseUrlInput, supabaseKeyInput);
      setTestResult(res);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
      setTestResult({ success: false, message: 'Both Supabase URL and Anon Key are required.' });
      return;
    }
    saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
    setIsConfigured(true);
    setToastMessage({ text: 'Supabase credentials saved successfully!', type: 'success' });
    setShowConfigModal(false);
    await refreshRawMaterials();
  };

  const handleClearConfig = () => {
    clearSupabaseConfig();
    setSupabaseUrlInput('');
    setSupabaseKeyInput('');
    setIsConfigured(false);
    setTestResult(null);
    setShowConfigModal(false);
    setToastMessage({ text: 'Supabase credentials removed.', type: 'warning' });
  };

  const rawUOMs = useMemo(() => {
    return uoms.filter((u) => u.isActive && (u.applicableTo === 'Raw Material' || u.applicableTo === 'Both'));
  }, [uoms]);

  // Modals & form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<RawMaterial | null>(null);
  const [stockAdjustmentMaterial, setStockAdjustmentMaterial] = useState<RawMaterial | null>(null);
  const [adjustedStockQty, setAdjustedStockQty] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('Physical Stock Audit / Kushtia Count');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'ADEQUATE'>('ALL');

  // Create Material form fields
  const [matCategory, setMatCategory] = useState<RawMaterial['category']>('Cell');
  const [matCode, setMatCode] = useState('');
  const [matName, setMatName] = useState('');
  const [matUnit, setMatUnit] = useState('Pieces');
  const [matStockKushtia, setMatStockKushtia] = useState<number>(0);
  const [matReorderLevel, setMatReorderLevel] = useState<number>(100);
  const [matLastPurchaseUnitCostBDT, setMatLastPurchaseUnitCostBDT] = useState<number>(3850);
  const [matStandardCostBDT, setMatStandardCostBDT] = useState<number>(3800);

  // Auto-generate code prefix on category change
  const handleCategoryChange = (cat: RawMaterial['category']) => {
    setMatCategory(cat);
    const prefixMap: Record<RawMaterial['category'], string> = {
      Cell: 'RM-CELL',
      BMS: 'RM-BMS',
      Casing: 'RM-CASE',
      Connector: 'RM-CONN',
      'Wire & Busbar': 'RM-BUSBAR',
      PCB: 'RM-PCB',
      'Insulation & Pack': 'RM-INSUL',
    };
    const prefix = prefixMap[cat] || 'RM-MAT';
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setMatCode(`${prefix}-${randomSuffix}`);
  };

  const handleOpenCreateModal = () => {
    handleCategoryChange('Cell');
    setMatName('');
    setMatUnit('Pieces');
    setMatStockKushtia(0);
    setMatReorderLevel(100);
    setMatLastPurchaseUnitCostBDT(3850);
    setMatStandardCostBDT(3800);
    setModalError(null);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName.trim()) return;

    setIsSubmitting(true);
    setModalError(null);

    const generatedCode = matCode.trim() || `RM-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const result = await addRawMaterial({
        code: generatedCode,
        name: matName.trim(),
        category: matCategory,
        unit: matUnit,
        stockKushtia: Number(matStockKushtia) || 0,
        reorderLevel: Number(matReorderLevel) || 100,
        lastPurchaseUnitCostBDT: Number(matLastPurchaseUnitCostBDT) || 0,
        standardCostBDT: Number(matStandardCostBDT) || 0,
      });

      if (result.isRemoteSynced) {
        setToastMessage({
          text: `Raw material "${matName.trim()}" successfully created and synced to Supabase!`,
          type: 'success',
        });
        setShowCreateModal(false);
      } else {
        if (!checkSupabaseConfigured()) {
          setModalError(
            'Supabase is not configured yet. Material saved in local memory only.'
          );
        } else {
          setModalError(
            `Supabase sync failed: ${result.error || 'Unknown error'}. Check table permissions or connection.`
          );
        }
      }
    } catch (err: any) {
      setModalError(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    const res = await updateRawMaterial(editingMaterial.id, {
      name: editingMaterial.name,
      code: editingMaterial.code,
      category: editingMaterial.category,
      unit: editingMaterial.unit,
      stockKushtia: Number(editingMaterial.stockKushtia),
      reorderLevel: Number(editingMaterial.reorderLevel),
      lastPurchaseUnitCostBDT: Number(editingMaterial.lastPurchaseUnitCostBDT),
      standardCostBDT: Number(editingMaterial.standardCostBDT),
    });

    if (res.success) {
      setToastMessage({ text: `Updated specifications for ${editingMaterial.name}`, type: 'success' });
    } else {
      setToastMessage({ text: `Update error: ${res.error || 'Failed'}`, type: 'error' });
    }

    setEditingMaterial(null);
  };

  const handleSaveStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustmentMaterial) return;

    const res = await updateRawMaterial(stockAdjustmentMaterial.id, {
      stockKushtia: Math.max(0, Number(adjustedStockQty)),
    });

    if (res.success) {
      setToastMessage({
        text: `Kushtia stock buffer updated to ${adjustedStockQty} ${stockAdjustmentMaterial.unit}`,
        type: 'success',
      });
    }

    setStockAdjustmentMaterial(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMaterial) return;
    const res = await deleteRawMaterial(deletingMaterial.id);
    if (res.success) {
      setToastMessage({ text: `Deleted raw material ${deletingMaterial.name}`, type: 'success' });
    } else {
      setToastMessage({ text: `Delete failed: ${res.error || 'Unknown error'}`, type: 'error' });
    }
    setDeletingMaterial(null);
  };

  // KPI Calculations
  const totalRawStockUnits = rawMaterials.reduce((sum, m) => sum + (m.stockKushtia || 0), 0);
  const totalValuationBDT = rawMaterials.reduce(
    (sum, m) => sum + (m.stockKushtia || 0) * (m.lastPurchaseUnitCostBDT || 0),
    0
  );
  const lowStockItems = rawMaterials.filter((m) => (m.stockKushtia || 0) <= (m.reorderLevel || 0));

  // Filtered List
  const filteredMaterials = rawMaterials.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (m.name || '').toLowerCase().includes(q) ||
      (m.code || '').toLowerCase().includes(q) ||
      (m.category || '').toLowerCase().includes(q);

    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'LOW') {
      matchesStock = (m.stockKushtia || 0) <= (m.reorderLevel || 0);
    } else if (stockFilter === 'ADEQUATE') {
      matchesStock = (m.stockKushtia || 0) > (m.reorderLevel || 0);
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6">
      {/* Material Master Data Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs cursor-default"
          >
            <Box className="w-4 h-4" />
            <span>Raw Materials</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-blue-700/80 text-white font-extrabold uppercase tracking-wider">Active</span>
          </button>

          <button
            onClick={() => onNavigate?.('basic-data-raw-categories')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
          >
            <FolderTree className="w-4 h-4 text-amber-500" />
            <span>Raw Mate Category</span>
          </button>

          <button
            onClick={() => onNavigate?.('basic-data-raw-classifications')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Raw Mate Classification</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-medium px-3 hidden md:block">
          Basic Data &bull; Material Master Architecture
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Raw Materials Master & Factory Stock
            </h1>
            
          </div>
          
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-xs cursor-pointer select-none"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Raw Material</span>
          </button>
        </div>
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-medium border shadow-xs animate-in fade-in slide-in-from-top-1 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Raw Material SKUs</span>
            <Box className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {rawMaterials.length} Items
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            {isConfigured ? 'Live Supabase Inventory' : 'Local Catalog Items'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Kushtia Stock Units</span>
            <Warehouse className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {totalRawStockUnits.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">Physical factory buffer</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Inventory Valuation</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            ৳ {totalValuationBDT.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Standard BDT asset value</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
            {lowStockItems.length}
          </div>
          <div className="text-[11px] text-rose-600 font-medium">Under reorder threshold</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Table Title & Sync Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span>Raw Materials Master Registry</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {filteredMaterials.length} Items Listed
            </span>
          </h2>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span>{isConfigured ? 'Connected to table public.raw_materials' : 'Local memory mode'}</span>
          </div>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search raw materials by code (e.g. RM-CELL) or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            {[
              'ALL',
              ...Array.from(
                new Set([
                  'Cell',
                  'BMS',
                  'Casing',
                  'Wire & Busbar',
                  'Insulation & Pack',
                  'Connector',
                  'PCB',
                  ...(rawMaterialCategories || []).map((c) => c.name),
                ])
              ),
            ].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap text-[11px] transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as 'ALL' | 'LOW' | 'ADEQUATE')}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="LOW">Low Stock Only</option>
              <option value="ADEQUATE">Adequate Stock Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Material Code & Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Unit</th>
                <th className="p-3 text-right">Kushtia Stock</th>
                <th className="p-3 text-right">Reorder Level</th>
                <th className="p-3 text-right">Last Landed Cost</th>
                <th className="p-3 text-right">Standard Cost</th>
                <th className="p-3 text-right">Total Valuation</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
                        <Box className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL'
                            ? 'No raw materials match your filter criteria'
                            : isConfigured
                            ? 'No raw materials found in Supabase (0 items)'
                            : 'No raw materials in catalog (0 items)'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL'
                            ? 'Try clearing the search query or category filters to view all materials.'
                            : isConfigured
                            ? 'Your database table public.raw_materials currently has 0 rows. You can register your first material using the button below.'
                            : 'Connect your Supabase database or add raw materials to populate your factory catalog.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        {searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL' ? (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedCategory('ALL');
                              setStockFilter('ALL');
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            Clear Filters
                          </button>
                        ) : null}

                        <button
                          onClick={handleOpenCreateModal}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>+ Register First Raw Material</span>
                        </button>

                        {isConfigured ? (
                          <button
                            onClick={handleRefresh}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <RotateCw className="w-3.5 h-3.5 text-amber-600" />
                            <span>Check Database Again</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowConfigModal(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 cursor-pointer"
                          >
                            <Database className="w-3.5 h-3.5" />
                            <span>Connect Supabase</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((rm) => {
                  const isLow = (rm.stockKushtia || 0) <= (rm.reorderLevel || 0);
                  const itemValuationBDT = (rm.stockKushtia || 0) * (rm.lastPurchaseUnitCostBDT || 0);

                  return (
                    <tr key={rm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {rm.code}
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                          {rm.name}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {rm.category}
                        </span>
                      </td>

                      <td className="p-3 text-slate-500">{rm.unit}</td>

                      <td className="p-3 text-right">
                        <span
                          className={`font-mono font-black text-sm ${
                            isLow ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {(rm.stockKushtia || 0).toLocaleString()}
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono text-slate-500">
                        {(rm.reorderLevel || 0).toLocaleString()}
                      </td>

                      <td className="p-3 text-right font-mono text-slate-800 dark:text-slate-200 font-bold">
                        ৳ {(rm.lastPurchaseUnitCostBDT || 0).toLocaleString()}
                      </td>

                      <td className="p-3 text-right font-mono text-slate-500">
                        ৳ {(rm.standardCostBDT || 0).toLocaleString()}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ৳ {itemValuationBDT.toLocaleString()}
                      </td>

                      <td className="p-3 text-center">
                        {isLow ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 inline-flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Adequate</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setStockAdjustmentMaterial(rm);
                              setAdjustedStockQty(rm.stockKushtia);
                            }}
                            className="px-2 py-1 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Adjust Kushtia Factory Stock"
                          >
                            Adjust Stock
                          </button>

                          <button
                            onClick={() => setEditingMaterial(rm)}
                            className="px-2 py-1 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 transition-colors cursor-pointer"
                            title="Edit Material Specifications"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => setDeletingMaterial(rm)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Material"
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
      </div>

      {/* CREATE RAW MATERIAL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Register New Raw Material
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Material Category *
                  </label>
                  <select
                    value={matCategory}
                    onChange={(e) => handleCategoryChange(e.target.value as RawMaterial['category'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    {(rawMaterialCategories && rawMaterialCategories.length > 0
                      ? rawMaterialCategories
                      : [
                          { id: '1', name: 'Cell', description: 'Prismatic / Cylindrical' },
                          { id: '2', name: 'BMS', description: 'Battery Management System' },
                          { id: '3', name: 'Casing', description: 'Rack Steel / ABS Enclosure' },
                          { id: '4', name: 'Wire & Busbar', description: 'Nickel / Copper' },
                          { id: '5', name: 'Insulation & Pack', description: 'Epoxy / Pad' },
                          { id: '6', name: 'Connector', description: 'Laser Stud / Anderson' },
                          { id: '7', name: 'PCB', description: 'PCB & Monitoring Board' },
                        ]
                    ).map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name} {cat.description ? `- ${cat.description.slice(0, 30)}...` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Material Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RM-CELL-280"
                    value={matCode}
                    onChange={(e) => setMatCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Material Full Name / Specification *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LiFePO4 Prismatic Cell 3.2V 280Ah Grade A"
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Unit of Measure *
                  </label>
                  <select
                    value={matUnit}
                    onChange={(e) => setMatUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {rawUOMs.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                    {!rawUOMs.some((u) => u.name === matUnit) && (
                      <option value={matUnit}>{matUnit}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Initial Kushtia Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matStockKushtia}
                    onChange={(e) => setMatStockKushtia(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matReorderLevel}
                    onChange={(e) => setMatReorderLevel(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Last Landed Cost (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matLastPurchaseUnitCostBDT}
                    onChange={(e) => setMatLastPurchaseUnitCostBDT(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Standard Cost (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matStandardCostBDT}
                    onChange={(e) => setMatStandardCostBDT(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Status and Diagnostics */}
              {modalError ? (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Supabase Insert Warning</span>
                  </div>
                  <p className="leading-relaxed">{modalError}</p>
                  {!isConfigured && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowConfigModal(true);
                      }}
                      className="mt-1 text-xs font-bold text-rose-700 dark:text-rose-300 underline cursor-pointer hover:text-rose-900"
                    >
                      Click here to configure Supabase Connection →
                    </button>
                  )}
                </div>
              ) : isConfigured ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Ready to insert directly into Supabase table <strong>public.raw_materials</strong>.</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                  <Database className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Supabase is not yet connected</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                      This material will be saved in local memory only. Connect your Supabase database in the header to persist changes permanently.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>Save Raw Material</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RAW MATERIAL MODAL */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Edit Raw Material Specifications
              </h3>
              <button
                onClick={() => setEditingMaterial(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Code</label>
                <input
                  type="text"
                  value={editingMaterial.code}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, code: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Name</label>
                <input
                  type="text"
                  value={editingMaterial.name}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Last Landed Unit Cost (BDT)
                  </label>
                  <input
                    type="number"
                    value={editingMaterial.lastPurchaseUnitCostBDT}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        lastPurchaseUnitCostBDT: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    value={editingMaterial.reorderLevel}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        reorderLevel: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Update Specifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST KUSHTIA STOCK MODAL */}
      {stockAdjustmentMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Adjust Kushtia Factory Stock
              </h3>
              <button
                onClick={() => setStockAdjustmentMaterial(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="font-mono text-[10px] text-amber-600 font-bold">
                  {stockAdjustmentMaterial.code}
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  {stockAdjustmentMaterial.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Current Buffer: <b>{stockAdjustmentMaterial.stockKushtia} {stockAdjustmentMaterial.unit}</b>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  New Physical Stock Count ({stockAdjustmentMaterial.unit}) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustedStockQty}
                  onChange={(e) => setAdjustedStockQty(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Adjustment Reason / Audit Notes
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStockAdjustmentMaterial(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Confirm Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Delete Raw Material?
                </h4>
                <p className="text-[11px] text-slate-500">
                  This action removes the material from your master catalog and database.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="font-mono text-amber-600 font-bold">{deletingMaterial.code}</div>
              <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{deletingMaterial.name}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Stock: {deletingMaterial.stockKushtia} {deletingMaterial.unit}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingMaterial(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Delete Material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPABASE CONNECTION MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/60 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Database className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Supabase Database Connection
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Connect your Supabase project to persist Raw Materials in PostgreSQL
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Status</span>
                {isConfigured ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Credentials Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 font-semibold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Not Connected
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Project URL *
                </label>
                <input
                  type="url"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  placeholder="https://rcngtmnqukrudueendns.supabase.co"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-1.5 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Found in Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Anon (Public) Key *
                </label>
                <input
                  type="password"
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-1.5 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Found under Project API Keys &gt; <code>anon public</code>
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">
                        {testResult.success ? 'Connection Test Passed' : 'Connection Test Failed'}
                      </p>
                      <p className="mt-0.5 leading-relaxed">{testResult.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SQL Setup Helper */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Required Supabase SQL Setup</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.raw_materials (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Pieces',
  stock_kushtia INT DEFAULT 0,
  reorder_level INT DEFAULT 0,
  last_purchase_unit_cost_bdt NUMERIC(12, 2) DEFAULT 0.00,
  standard_cost_bdt NUMERIC(12, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'raw_materials' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.raw_materials FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;`);
                      setToastMessage({ text: 'SQL script copied to clipboard!', type: 'success' });
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy SQL</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  If the <code>raw_materials</code> table does not exist or inserts are blocked by RLS policies, copy the SQL above and run it in your <strong>Supabase SQL Editor</strong>.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  {isConfigured && (
                    <button
                      type="button"
                      onClick={handleClearConfig}
                      className="px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer"
                  >
                    Save &amp; Connect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
