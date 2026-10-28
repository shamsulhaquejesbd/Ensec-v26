import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Check,
  Package,
  Layers,
  Box,
  MoreVertical,
  Power,
  Eye,
  AlertTriangle,
  DollarSign,
  Warehouse,
  Filter,
  CheckCircle2,
  X,
  Sparkles,
  RotateCw,
  Database,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Copy,
  Zap,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { RawMaterialCategory } from '../../types/erp.ts';
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  checkSupabaseConfigured,
} from '../../lib/supabase.ts';

export interface RawMaterialsCategoryPageProps {
  onNavigate?: (module: string) => void;
}

export const RawMaterialsCategoryPage: React.FC<RawMaterialsCategoryPageProps> = ({
  onNavigate,
}) => {
  const {
    rawMaterials,
    rawMaterialCategories,
    rawMaterialClassifications,
    addRawMaterialCategory,
    updateRawMaterialCategory,
    deleteRawMaterialCategory,
    toggleRawMaterialCategoryStatus,
    refreshRawMaterialCategories,
    refreshRawMaterials,
  } = useERP();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(getSupabaseUrl());
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(getSupabaseAnonKey());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isConfigured, setIsConfigured] = useState(checkSupabaseConfigured());
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [newlyAddedCatId, setNewlyAddedCatId] = useState<string | null>(null);

  // Auto-sync with Supabase on mount & config changes
  useEffect(() => {
    refreshRawMaterialCategories();
    setIsConfigured(checkSupabaseConfigured());
    const handleConfigChange = () => {
      refreshRawMaterialCategories();
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
      await Promise.all([refreshRawMaterialCategories(), refreshRawMaterials()]);
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
    await Promise.all([refreshRawMaterialCategories(), refreshRawMaterials()]);
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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [classificationFilter, setClassificationFilter] = useState<string>('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<RawMaterialCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<RawMaterialCategory | null>(null);
  const [viewingCategoryMaterials, setViewingCategoryMaterials] = useState<RawMaterialCategory | null>(null);
  const [activeOptionDropdownId, setActiveOptionDropdownId] = useState<string | null>(null);

  // Form Fields for Create Category
  const [catCode, setCatCode] = useState('');
  const [catName, setCatName] = useState('');
  const [catClassification, setCatClassification] = useState('');
  const [catStatus, setCatStatus] = useState<'Active' | 'Inactive'>('Active');

  // Dynamic Classification List from Registry
  const standardClassifications = Array.from(
    new Set((rawMaterialClassifications || []).map((c) => c.name).filter(Boolean))
  );

  // Helper to calculate materials under a category
  const getMaterialsForCategory = (category: RawMaterialCategory) => {
    return rawMaterials.filter(
      (m) =>
        m.category.toLowerCase() === category.name.toLowerCase() ||
        m.category.toLowerCase() === category.code.toLowerCase() ||
        (category.name === 'Cell' && m.category === 'Cell') ||
        (category.name === 'BMS' && m.category === 'BMS') ||
        (category.name === 'Casing' && m.category === 'Casing') ||
        (category.name === 'Wire & Busbar' && m.category === 'Wire & Busbar') ||
        (category.name === 'Connector' && m.category === 'Connector') ||
        (category.name === 'PCB' && m.category === 'PCB') ||
        (category.name === 'Insulation & Pack' && m.category === 'Insulation & Pack')
    );
  };

  // Helper stats
  const totalStockUnitsAll = rawMaterials.reduce((acc, m) => acc + (m.stockKushtia || 0), 0);
  const totalValuationAll = rawMaterials.reduce(
    (acc, m) => acc + (m.stockKushtia || 0) * (m.standardCostBDT || 0),
    0
  );

  // Open Create Modal handler
  const handleOpenCreateCategory = () => {
    const nextNumber = rawMaterialCategories.length + 1;
    setCatCode(`RMC-CAT-0${nextNumber}`);
    setCatName('');
    setCatClassification('Active Electrochemical Cells');
    setCatStatus('Active');
    setModalError(null);
    setShowCreateModal(true);
  };

  // Submit Create Category
  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catCode.trim()) return;

    setIsSubmitting(true);
    setModalError(null);

    const submittedCode = catCode.trim().toUpperCase();
    const submittedName = catName.trim();

    try {
      const result = await addRawMaterialCategory({
        code: submittedCode,
        name: submittedName,
        parentClassification: catClassification,
        description: '',
        status: catStatus,
      });

      if (result.isRemoteSynced || result.success) {
        // Reset any filters that might hide the new row from view
        setSearchQuery('');
        setStatusFilter('ALL');
        setClassificationFilter('ALL');

        // Highlight the newly created row
        setNewlyAddedCatId(result.id || submittedCode);
        setTimeout(() => setNewlyAddedCatId(null), 5000);

        setToastMessage({
          text: result.isRemoteSynced
            ? `Category "${submittedName}" successfully created & synced to Supabase (Row ID: ${result.id})!`
            : `Category "${submittedName}" saved in local memory. (Connect Supabase to persist permanently)`,
          type: result.isRemoteSynced ? 'success' : 'warning',
        });
        setShowCreateModal(false);
      } else {
        // Not remote synced: show error in modal
        if (!checkSupabaseConfigured()) {
          setModalError(
            'Supabase credentials are NOT configured. Category saved in temporary local memory only. Click "Connect Supabase" in the header to save permanently to your database.'
          );
        } else {
          setModalError(
            `Supabase rejected the insert: ${result.error || 'Unknown error'}. If this is an RLS policy error, run the SQL script to allow public inserts on table raw_material_categories.`
          );
        }
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to submit category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Category
  const handleUpdateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    updateRawMaterialCategory(editingCategory.id, {
      code: editingCategory.code.trim().toUpperCase(),
      name: editingCategory.name.trim(),
      parentClassification: editingCategory.parentClassification,
      description: editingCategory.description,
      status: editingCategory.status,
    });

    setEditingCategory(null);
  };

  // Delete category handler
  const handleConfirmDelete = () => {
    if (!deletingCategory) return;
    deleteRawMaterialCategory(deletingCategory.id);
    setDeletingCategory(null);
  };

  // Filter Categories
  const filteredCategories = rawMaterialCategories.filter((cat) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      cat.name.toLowerCase().includes(q) ||
      cat.code.toLowerCase().includes(q) ||
      (cat.parentClassification && cat.parentClassification.toLowerCase().includes(q)) ||
      Boolean(cat.description && cat.description.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'ALL' || cat.status === statusFilter;

    const matchesClassification =
      classificationFilter === 'ALL' || cat.parentClassification === classificationFilter;

    return matchesSearch && matchesStatus && matchesClassification;
  });

  return (
    <div className="space-y-6">
      {/* Material Master Data Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onNavigate?.('basic-data-raw-materials')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Box className="w-4 h-4 text-slate-400" />
            <span>Raw Materials</span>
          </button>

          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-xs cursor-default"
          >
            <FolderTree className="w-4 h-4" />
            <span>Raw Mate Category</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-600/90 text-white font-extrabold uppercase tracking-wider">Active</span>
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xs">
              <FolderTree className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Raw Material Categories Registry
                </h1>
                
              </div>
              
            </div>
          </div>
        </div>

        {/* Top Right Actions: Sync Database, Supabase Status, Open New Category */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Database Sync Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Fetch latest categories from Supabase database"
          >
            <RotateCw className={`w-3.5 h-3.5 text-amber-600 dark:text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Database'}</span>
          </button>

          {/* Supabase Connection & Realtime Status */}
          <button
            onClick={() => setShowConfigModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shadow-xs cursor-pointer ${
              isConfigured
                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
            }`}
            title="Configure Supabase Database Connection & Realtime Streaming"
          >
            <Database className={`w-3.5 h-3.5 ${isConfigured ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
            <span>{isConfigured ? 'Supabase Connected' : 'Connect Supabase'}</span>
            {isConfigured && (
              <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                <Zap className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500 animate-pulse" />
                <span>Live</span>
              </span>
            )}
          </button>

          <button
            onClick={handleOpenCreateCategory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-xs transition-all shadow-xs hover:shadow cursor-pointer select-none"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Open New Raw Materials Category</span>
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
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
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
            <span>Total Categories</span>
            <FolderTree className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {rawMaterialCategories.length} Categories
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
            Ensec Kushtia Factory Specs
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Active Categories</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {rawMaterialCategories.filter((c) => c.status === 'Active').length} Active
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            Approved for Procurement & BOM
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Linked Material SKUs</span>
            <Box className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {rawMaterials.length} Items
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
            {totalStockUnitsAll.toLocaleString()} Kushtia Units
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Total Stock Valuation</span>
            <DollarSign className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            ৳ {(totalValuationAll / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-0.5">
            ৳ {totalValuationAll.toLocaleString()} Total
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        {/* Section Header & Search / Filters Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>Raw Material Category Catalog</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                ({filteredCategories.length} displayed)
              </span>
            </h2>
            
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search category code, name, group..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Classification Filter */}
            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-amber-500"
            >
              <option value="ALL">All Classifications</option>
              {standardClassifications.map((sc) => (
                <option key={sc} value={sc}>
                  {sc}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'Active' | 'Inactive')}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-amber-500"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Categories Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-3">Category Code</th>
                <th className="py-3 px-3">Category Name & Classification</th>
                <th className="py-3 px-3 text-center">Linked SKUs</th>
                <th className="py-3 px-3 text-right">Factory Stock</th>
                <th className="py-3 px-3 text-right">Valuation (BDT)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions / Option</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FolderTree className="w-9 h-9 mx-auto mb-2 opacity-30 text-amber-500" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No raw material categories found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your search criteria or click &quot;Open New Raw Materials Category&quot;.
                    </p>
                    <button
                      onClick={handleOpenCreateCategory}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Open New Category</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const linkedMaterials = getMaterialsForCategory(cat);
                  const catStockUnits = linkedMaterials.reduce(
                    (acc, m) => acc + (m.stockKushtia || 0),
                    0
                  );
                  const catValuationBDT = linkedMaterials.reduce(
                    (acc, m) => acc + (m.stockKushtia || 0) * (m.standardCostBDT || 0),
                    0
                  );
                  const isDropdownOpen = activeOptionDropdownId === cat.id;

                  const isNewlyAdded = cat.id === newlyAddedCatId || cat.code === newlyAddedCatId;

                  return (
                    <tr
                      key={cat.id}
                      className={`transition-all group ${
                        isNewlyAdded
                          ? 'bg-amber-100/70 dark:bg-amber-950/60 ring-2 ring-inset ring-amber-500/80'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Code */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50">
                            {cat.code}
                          </span>
                          {isNewlyAdded && (
                            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-amber-500 text-white animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name & Classification */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <FolderTree className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{cat.name}</span>
                        </div>
                        {cat.parentClassification && (
                          <button
                            type="button"
                            onClick={() => onNavigate?.('basic-data-raw-classifications')}
                            title={`View classification "${cat.parentClassification}" in Raw Mate Classification`}
                            className="inline-flex items-center gap-1 mt-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-medium cursor-pointer transition-colors"
                          >
                            <Layers className="w-2.5 h-2.5" />
                            <span>{cat.parentClassification}</span>
                          </button>
                        )}
                      </td>

                      {/* Linked SKUs */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setViewingCategoryMaterials(cat)}
                          title="Click to view linked materials"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 hover:underline cursor-pointer"
                        >
                          <Box className="w-3 h-3 text-blue-500" />
                          <span>{linkedMaterials.length} SKUs</span>
                        </button>
                      </td>

                      {/* Stock Units */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {catStockUnits.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">units</span>
                      </td>

                      {/* Valuation */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          ৳ {catValuationBDT.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {(catValuationBDT / 1000000).toFixed(2)}M BDT
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            cat.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cat.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {cat.status}
                        </span>
                      </td>

                      {/* Actions / Option */}
                      <td className="py-3 px-3 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct Edit Button */}
                          <button
                            onClick={() => setEditingCategory(cat)}
                            title="Edit raw material category"
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* Option Dropdown Trigger */}
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() =>
                                setActiveOptionDropdownId(isDropdownOpen ? null : cat.id)
                              }
                              title="More options"
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setActiveOptionDropdownId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 text-xs text-left">
                                  <div className="px-3 py-1 font-semibold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 mb-1">
                                    Category Options
                                  </div>

                                  <button
                                    onClick={() => {
                                      setActiveOptionDropdownId(null);
                                      setEditingCategory(cat);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Edit Category</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveOptionDropdownId(null);
                                      setViewingCategoryMaterials(cat);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                                    <span>View Linked Materials ({linkedMaterials.length})</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveOptionDropdownId(null);
                                      toggleRawMaterialCategoryStatus(cat.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                  >
                                    <Power className="w-3.5 h-3.5 text-slate-400" />
                                    <span>
                                      {cat.status === 'Active' ? 'Set as Inactive' : 'Set as Active'}
                                    </span>
                                  </button>

                                  <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                                  <button
                                    onClick={() => {
                                      setActiveOptionDropdownId(null);
                                      setDeletingCategory(cat);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                    <span>Delete Category</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
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

      {/* MODAL 1: OPEN NEW RAW MATERIAL CATEGORY */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                  <FolderTree className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Open New Raw Materials Category
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Register a new material classification for Kushtia assembly &amp; China procurement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategorySubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value.toUpperCase())}
                    placeholder="e.g. RMC-THERMAL"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-1.5 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Unique system code identifier</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Thermal Pad & Heat Sinks"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1.5 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Short display name in BOM &amp; Stock</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Parent Classification / Group
                </label>
                <select
                  value={catClassification}
                  onChange={(e) => setCatClassification(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1.5 focus:ring-amber-500"
                >
                  {standardClassifications.map((sc) => (
                    <option key={sc} value={sc}>
                      {sc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="status"
                      checked={catStatus === 'Active'}
                      onChange={() => setCatStatus('Active')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Active (Available in Raw Material Master)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="status"
                      checked={catStatus === 'Inactive'}
                      onChange={() => setCatStatus('Inactive')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Inactive (Under Development)</span>
                  </label>
                </div>
              </div>

              {/* Database sync notification banner */}
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
                      Click here to configure Supabase Connection &rarr;
                    </button>
                  )}
                </div>
              ) : !isConfigured ? (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                  <Database className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Supabase is not yet connected</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                      This category will be saved in local memory only. Connect your Supabase database in the header to sync changes permanently.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Ready to insert directly into Supabase table <strong>public.raw_material_categories</strong>.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <span>Create &amp; Sync Category</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUPABASE DATABASE CONNECTION SETTINGS */}
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
                    Connect your Supabase project to persist Ensec ERP data in PostgreSQL
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
              {/* Status pill */}
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

              {/* Input URL */}
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

              {/* Input Key */}
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

              {/* Test Result Alert */}
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

              {/* SQL Schema and RLS Guide */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Required Supabase SQL Setup</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const sql = `CREATE TABLE IF NOT EXISTS public.raw_material_categories (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  parent_classification TEXT NOT NULL DEFAULT 'Power Electronics & Control',
  description TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Enable RLS and public access
ALTER TABLE public.raw_material_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON public.raw_material_categories;
CREATE POLICY "Allow public access" ON public.raw_material_categories FOR ALL USING (true) WITH CHECK (true);

-- 2. Enable Realtime Replication (Instant live updates in Supabase Table Editor & Web without refresh!)
ALTER TABLE public.raw_material_categories REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.raw_material_categories;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;`;
                      navigator.clipboard.writeText(sql);
                      setToastMessage({ text: 'SQL script copied to clipboard! Paste it into Supabase SQL Editor.', type: 'success' });
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold hover:bg-emerald-200 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy SQL</span>
                  </button>
                </div>
                <p className="leading-relaxed text-[10.5px]">
                  Run this in your <strong>Supabase SQL Editor</strong> to create the table, allow RLS access, and enable <strong>Realtime Replication</strong> so changes appear live in both Supabase Table Editor and the web app without manual page refresh:
                </p>
                <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[10px] font-mono overflow-x-auto select-all max-h-36">
{`CREATE TABLE IF NOT EXISTS public.raw_material_categories (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  parent_classification TEXT NOT NULL DEFAULT 'Power Electronics & Control',
  description TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.raw_material_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON public.raw_material_categories;
CREATE POLICY "Allow public access" ON public.raw_material_categories FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime (No manual refresh needed)
ALTER TABLE public.raw_material_categories REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.raw_material_categories;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;`}
                </pre>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  {isConfigured && (
                    <button
                      type="button"
                      onClick={handleClearConfig}
                      className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                    >
                      Disconnect
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection || !supabaseUrlInput || !supabaseKeyInput}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                    <span>{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer"
                  >
                    Save &amp; Connect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT RAW MATERIAL CATEGORY */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Edit Raw Material Category
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Modifying {editingCategory.name} ({editingCategory.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategorySubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCategory.code}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-1.5 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1.5 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Parent Classification / Group
                </label>
                <select
                  value={editingCategory.parentClassification || ''}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      parentClassification: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1.5 focus:ring-amber-500"
                >
                  {standardClassifications.map((sc) => (
                    <option key={sc} value={sc}>
                      {sc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="editStatus"
                      checked={editingCategory.status === 'Active'}
                      onChange={() =>
                        setEditingCategory({
                          ...editingCategory,
                          status: 'Active',
                        })
                      }
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="editStatus"
                      checked={editingCategory.status === 'Inactive'}
                      onChange={() =>
                        setEditingCategory({
                          ...editingCategory,
                          status: 'Inactive',
                        })
                      }
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW LINKED MATERIALS MODAL */}
      {viewingCategoryMaterials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Box className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Linked Raw Materials: {viewingCategoryMaterials.name}</span>
                    <span className="font-mono text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      {viewingCategoryMaterials.code}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live Kushtia factory stock, reorder levels, and standard cost values for this category
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingCategoryMaterials(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {getMaterialsForCategory(viewingCategoryMaterials).length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Box className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No raw materials currently mapped to {viewingCategoryMaterials.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    When creating items in Raw Materials &amp; Stock, select &quot;{viewingCategoryMaterials.name}&quot; to link them here.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                        <th className="py-2.5 px-3">Item Code</th>
                        <th className="py-2.5 px-3">Material Name</th>
                        <th className="py-2.5 px-3 text-right">Factory Stock</th>
                        <th className="py-2.5 px-3 text-right">Reorder Level</th>
                        <th className="py-2.5 px-3 text-right">Standard Cost</th>
                        <th className="py-2.5 px-3 text-right">Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {getMaterialsForCategory(viewingCategoryMaterials).map((mat) => {
                        const isLowStock = mat.stockKushtia <= mat.reorderLevel;
                        const valuation = mat.stockKushtia * mat.standardCostBDT;
                        return (
                          <tr key={mat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {mat.code}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {mat.name}
                              </div>
                              <div className="text-[10px] text-slate-400">Unit: {mat.unit}</div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`font-mono font-bold ${
                                  isLowStock ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {mat.stockKushtia.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-1">{mat.unit}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                              {mat.reorderLevel.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                              ৳ {mat.standardCostBDT.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              ৳ {valuation.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                onClick={() => setViewingCategoryMaterials(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION MODAL */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Delete Raw Material Category?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to remove &quot;{deletingCategory.name}&quot; ({deletingCategory.code})?
                </p>
              </div>
            </div>

            {getMaterialsForCategory(deletingCategory).length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Warning: Category has linked items!
                </p>
                <p className="mt-1 text-[11px]">
                  There are currently {getMaterialsForCategory(deletingCategory).length} raw material SKUs assigned to this category. Deleting this category may orphan those records in the BOM catalog.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-xs"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
