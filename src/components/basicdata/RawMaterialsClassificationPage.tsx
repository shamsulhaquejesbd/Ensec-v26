import React, { useState, useEffect } from 'react';
import {
  Layers,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  FolderTree,
  Box,
  MoreVertical,
  Power,
  Eye,
  AlertTriangle,
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
  Tag,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { RawMaterialClassification, RawMaterialCategory } from '../../types/erp.ts';
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  checkSupabaseConfigured,
} from '../../lib/supabase.ts';

export interface RawMaterialsClassificationPageProps {
  onNavigate?: (module: string) => void;
}

export const RawMaterialsClassificationPage: React.FC<RawMaterialsClassificationPageProps> = ({
  onNavigate,
}) => {
  const {
    rawMaterialClassifications,
    rawMaterialCategories,
    rawMaterials,
    addRawMaterialClassification,
    updateRawMaterialClassification,
    deleteRawMaterialClassification,
    toggleRawMaterialClassificationStatus,
    refreshRawMaterialClassifications,
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
  const [newlyAddedClsId, setNewlyAddedClsId] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClassification, setEditingClassification] = useState<RawMaterialClassification | null>(null);
  const [deletingClassification, setDeletingClassification] = useState<RawMaterialClassification | null>(null);
  const [viewingClassificationCategories, setViewingClassificationCategories] = useState<RawMaterialClassification | null>(null);
  const [activeOptionDropdownId, setActiveOptionDropdownId] = useState<string | null>(null);

  // Form Fields for Create Classification
  const [clsCode, setClsCode] = useState('');
  const [clsName, setClsName] = useState('');
  const [clsColorTag, setClsColorTag] = useState('amber');
  const [clsDescription, setClsDescription] = useState('');
  const [clsStatus, setClsStatus] = useState<'Active' | 'Inactive'>('Active');

  // Auto-sync with Supabase on mount & config changes
  useEffect(() => {
    if (refreshRawMaterialClassifications) {
      refreshRawMaterialClassifications();
    }
    setIsConfigured(checkSupabaseConfigured());
    const handleConfigChange = () => {
      if (refreshRawMaterialClassifications) {
        refreshRawMaterialClassifications();
      }
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
      if (refreshRawMaterialClassifications) {
        await refreshRawMaterialClassifications();
      }
      setIsConfigured(checkSupabaseConfigured());
      setToastMessage({ text: 'Classifications refreshed from database!', type: 'success' });
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
    if (refreshRawMaterialClassifications) {
      await refreshRawMaterialClassifications();
    }
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

  // Helper to get categories under a classification
  const getCategoriesForClassification = (classification: RawMaterialClassification): RawMaterialCategory[] => {
    return rawMaterialCategories.filter(
      (cat) =>
        cat.parentClassification?.trim().toLowerCase() === classification.name.trim().toLowerCase() ||
        cat.parentClassification?.trim().toLowerCase() === classification.code.trim().toLowerCase()
    );
  };

  // Helper to calculate raw materials under a classification
  const getMaterialsForClassification = (classification: RawMaterialClassification) => {
    const linkedCats = getCategoriesForClassification(classification);
    const catNames = new Set(linkedCats.map((c) => c.name.toLowerCase()));
    return rawMaterials.filter((m) => catNames.has(m.category?.toLowerCase() || ''));
  };

  // Open Create Modal handler
  const handleOpenCreateClassification = () => {
    const nextNumber = rawMaterialClassifications.length + 1;
    setClsCode(`CLS-GRP-0${nextNumber}`);
    setClsName('');
    setClsColorTag('amber');
    setClsDescription('');
    setClsStatus('Active');
    setModalError(null);
    setShowCreateModal(true);
  };

  // Submit Create Classification
  const handleCreateClassificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clsName.trim() || !clsCode.trim()) return;

    setIsSubmitting(true);
    setModalError(null);

    const submittedCode = clsCode.trim().toUpperCase();
    const submittedName = clsName.trim();

    try {
      const result = await addRawMaterialClassification({
        code: submittedCode,
        name: submittedName,
        colorTag: clsColorTag,
        description: clsDescription.trim(),
        status: clsStatus,
      });

      if (result.isRemoteSynced || result.success) {
        setSearchQuery('');
        setStatusFilter('ALL');
        setNewlyAddedClsId(result.id || submittedCode);
        setTimeout(() => setNewlyAddedClsId(null), 5000);

        setToastMessage({
          text: result.isRemoteSynced
            ? `Classification "${submittedName}" successfully created and synced to Supabase!`
            : `Classification "${submittedName}" saved in local registry.`,
          type: result.isRemoteSynced ? 'success' : 'warning',
        });
        setShowCreateModal(false);
      } else {
        setModalError(`Failed to save classification: ${result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to submit classification');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Classification
  const handleUpdateClassificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassification || !editingClassification.name.trim()) return;

    const updatedName = editingClassification.name.trim();
    const updatedCode = editingClassification.code.trim().toUpperCase();

    const res = await updateRawMaterialClassification(editingClassification.id, {
      code: updatedCode,
      name: updatedName,
      colorTag: editingClassification.colorTag || 'amber',
      description: editingClassification.description?.trim() || '',
      status: editingClassification.status || 'Active',
    });

    if (res && res.error) {
      setToastMessage({
        text: `Classification updated locally, but Supabase sync returned: ${res.error}`,
        type: 'warning',
      });
    } else {
      setToastMessage({
        text: `Classification "${updatedName}" updated and synced successfully! Any linked categories were updated.`,
        type: 'success',
      });
    }
    setEditingClassification(null);
  };

  // Delete Classification handler
  const handleConfirmDelete = async () => {
    if (!deletingClassification) return;
    const name = deletingClassification.name;
    await deleteRawMaterialClassification(deletingClassification.id);
    setToastMessage({ text: `Classification "${name}" deleted.`, type: 'warning' });
    setDeletingClassification(null);
  };

  // Filter Classifications
  const filteredClassifications = rawMaterialClassifications.filter((cls) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      cls.name.toLowerCase().includes(q) ||
      cls.code.toLowerCase().includes(q) ||
      (cls.description && cls.description.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ALL' || cls.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const colorTagStyles: Record<string, { bg: string; text: string; border: string }> = {
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-900/50' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-900/50' },
    slate: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-900/50' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-900/50' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-900/50' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-900/50' },
    cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/60', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-900/50' },
  };

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
            onClick={() => onNavigate?.('basic-data-raw-categories')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
          >
            <FolderTree className="w-4 h-4 text-amber-500" />
            <span>Raw Mate Category</span>
          </button>

          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs cursor-default"
          >
            <Layers className="w-4 h-4" />
            <span>Raw Mate Classification</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-700/80 text-white font-extrabold uppercase tracking-wider">Active</span>
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Raw Material Classification Registry
              </h1>
            </div>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenCreateClassification}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs transition-all shadow-xs hover:shadow cursor-pointer select-none"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Open New Raw Mate Classification</span>
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
            <span>Classifications</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {rawMaterialClassifications.length} Groups
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
            Lithium Pack Architecture
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Active Groups</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {rawMaterialClassifications.filter((c) => c.status === 'Active').length} Active
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            Available in Category dropdowns
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Linked Categories</span>
            <FolderTree className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {rawMaterialCategories.length} Categories
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
            Classified under these groups
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Linked Raw Materials</span>
            <Box className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {rawMaterials.length} SKUs
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
            Ensec Kushtia Inventory
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by classification code, name, or engineering scope..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Classifications Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-3">Classification Code</th>
                <th className="py-3 px-3">Classification Name</th>
                <th className="py-3 px-3 text-center">Linked Categories</th>
                <th className="py-3 px-3 text-center">Linked SKUs</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredClassifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Layers className="w-9 h-9 mx-auto mb-2 opacity-30 text-indigo-500" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No raw material classifications found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Adjust your search or click &quot;Open New Raw Mate Classification&quot;.
                    </p>
                    <button
                      onClick={handleOpenCreateClassification}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Open New Classification</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredClassifications.map((cls) => {
                  const linkedCategories = getCategoriesForClassification(cls);
                  const linkedMaterials = getMaterialsForClassification(cls);
                  const isDropdownOpen = activeOptionDropdownId === cls.id;
                  const isNewlyAdded = cls.id === newlyAddedClsId || cls.code === newlyAddedClsId;
                  const tagTheme = colorTagStyles[cls.colorTag || 'amber'] || colorTagStyles.amber;

                  return (
                    <tr
                      key={cls.id}
                      className={`transition-all group ${
                        isNewlyAdded
                          ? 'bg-indigo-100/70 dark:bg-indigo-950/60 ring-2 ring-inset ring-indigo-500/80'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Code */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${tagTheme.bg} ${tagTheme.text} ${tagTheme.border}`}>
                            {cls.code}
                          </span>
                          {isNewlyAdded && (
                            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-indigo-600 text-white animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name & Theme Pill */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{cls.name}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] text-slate-400 capitalize">
                            Tag Theme: {cls.colorTag || 'amber'}
                          </span>
                        </div>
                      </td>

                      {/* Linked Categories */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setViewingClassificationCategories(cls)}
                          title="Click to view linked categories"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 cursor-pointer"
                        >
                          <FolderTree className="w-3 h-3 text-amber-500" />
                          <span>{linkedCategories.length} Categories</span>
                        </button>
                      </td>

                      {/* Linked SKUs */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          <Box className="w-3 h-3 text-blue-500" />
                          <span>{linkedMaterials.length} SKUs</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            cls.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cls.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {cls.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct Edit Button */}
                          <button
                            onClick={() => setEditingClassification(cls)}
                            title="Edit raw material classification"
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/40 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* Options Dropdown */}
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() =>
                                setActiveOptionDropdownId(isDropdownOpen ? null : cls.id)
                              }
                              title="More options"
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isDropdownOpen && (
                              <div
                                onMouseLeave={() => setActiveOptionDropdownId(null)}
                                className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-20 text-xs"
                              >
                                <button
                                  onClick={() => {
                                    toggleRawMaterialClassificationStatus(cls.id);
                                    setActiveOptionDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
                                >
                                  <Power className="w-3.5 h-3.5 text-amber-500" />
                                  <span>
                                    {cls.status === 'Active' ? 'Mark as Inactive' : 'Mark as Active'}
                                  </span>
                                </button>
                                <button
                                  onClick={() => {
                                    setViewingClassificationCategories(cls);
                                    setActiveOptionDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                                  <span>View Linked Categories</span>
                                </button>
                                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                <button
                                  onClick={() => {
                                    setDeletingClassification(cls);
                                    setActiveOptionDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Classification</span>
                                </button>
                              </div>
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

      {/* CREATE CLASSIFICATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Create Raw Material Classification
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add a high-level grouping for Raw Material Categories & BOM components
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

            <form onSubmit={handleCreateClassificationSubmit} className="p-4 sm:p-5 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Classification Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={clsCode}
                    onChange={(e) => setClsCode(e.target.value.toUpperCase())}
                    placeholder="CLS-CELL"
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1.5 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Short unique code</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Color Accent Theme
                  </label>
                  <select
                    value={clsColorTag}
                    onChange={(e) => setClsColorTag(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1.5 focus:ring-indigo-500"
                  >
                    <option value="amber">Amber (Electrochemical / Active)</option>
                    <option value="blue">Blue (Electronics / Controls)</option>
                    <option value="slate">Slate (Mechanical & Enclosure)</option>
                    <option value="emerald">Emerald (Interconnects & Wiring)</option>
                    <option value="purple">Purple (Thermal & Insulation)</option>
                    <option value="indigo">Indigo (Hardware & Fasteners)</option>
                    <option value="rose">Rose (Consumables & Packaging)</option>
                    <option value="cyan">Cyan (Auxiliary & Telemetry)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Classification Name *
                </label>
                <input
                  type="text"
                  required
                  value={clsName}
                  onChange={(e) => setClsName(e.target.value)}
                  placeholder="e.g. Active Electrochemical Cells, Auxiliary Systems..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1.5 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Factory Scope Guidelines
                </label>
                <textarea
                  rows={3}
                  value={clsDescription}
                  onChange={(e) => setClsDescription(e.target.value)}
                  placeholder="Describe what category of raw materials belong under this classification (e.g. LiFePO4 cells, cylindrical packs, cooling pads)..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1.5 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={clsStatus}
                  onChange={(e) => setClsStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1.5 focus:ring-indigo-500"
                >
                  <option value="Active">Active (Available for categories)</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

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
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Classification...' : 'Save Classification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLASSIFICATION MODAL */}
      {editingClassification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Edit Raw Material Classification
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Modifying {editingClassification.name} ({editingClassification.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingClassification(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateClassificationSubmit} className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Classification Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingClassification.code}
                    onChange={(e) =>
                      setEditingClassification({
                        ...editingClassification,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1.5 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Color Accent Theme
                  </label>
                  <select
                    value={editingClassification.colorTag || 'amber'}
                    onChange={(e) =>
                      setEditingClassification({
                        ...editingClassification,
                        colorTag: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1.5 focus:ring-indigo-500"
                  >
                    <option value="amber">Amber (Electrochemical / Active)</option>
                    <option value="blue">Blue (Electronics / Controls)</option>
                    <option value="slate">Slate (Mechanical & Enclosure)</option>
                    <option value="emerald">Emerald (Interconnects & Wiring)</option>
                    <option value="purple">Purple (Thermal & Insulation)</option>
                    <option value="indigo">Indigo (Hardware & Fasteners)</option>
                    <option value="rose">Rose (Consumables & Packaging)</option>
                    <option value="cyan">Cyan (Auxiliary & Telemetry)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Classification Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingClassification.name}
                  onChange={(e) =>
                    setEditingClassification({
                      ...editingClassification,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1.5 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                  Note: Updating this name will also update all categories assigned to this classification.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Factory Scope Guidelines
                </label>
                <textarea
                  rows={3}
                  value={editingClassification.description || ''}
                  onChange={(e) =>
                    setEditingClassification({
                      ...editingClassification,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1.5 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={editingClassification.status || 'Active'}
                  onChange={(e) =>
                    setEditingClassification({
                      ...editingClassification,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1.5 focus:ring-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingClassification(null)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs hover:shadow transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingClassification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete Classification?
                </h3>
                <p className="text-xs text-slate-500">
                  {deletingClassification.name} ({deletingClassification.code})
                </p>
              </div>
            </div>

            {(() => {
              const linked = getCategoriesForClassification(deletingClassification);
              return (
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <p>
                    Are you sure you want to delete this classification? This operation cannot be undone.
                  </p>
                  {linked.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                      <p className="font-semibold">
                        Notice: {linked.length} categories currently reference this classification:
                      </p>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        {linked.slice(0, 4).map((c) => (
                          <li key={c.id}>
                            {c.name} ({c.code})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingClassification(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete Classification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW LINKED CATEGORIES DRAWER / MODAL */}
      {viewingClassificationCategories && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Categories under &quot;{viewingClassificationCategories.name}&quot;
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Code: {viewingClassificationCategories.code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingClassificationCategories(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-3">
              {(() => {
                const linkedCats = getCategoriesForClassification(viewingClassificationCategories);
                if (linkedCats.length === 0) {
                  return (
                    <div className="py-8 text-center text-slate-400">
                      <FolderTree className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No categories currently assigned
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Edit or create a Raw Material Category and set its Parent Classification to &quot;{viewingClassificationCategories.name}&quot;.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {linkedCats.map((cat) => (
                      <div
                        key={cat.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                              {cat.code}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white text-xs">
                              {cat.name}
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {cat.description}
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {cat.status || 'Active'}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setViewingClassificationCategories(null);
                  onNavigate?.('basic-data-raw-categories');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl transition-colors cursor-pointer"
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Open Raw Mate Category Registry</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingClassificationCategories(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPABASE CONFIG MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Supabase Database Configuration
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Connect to your PostgreSQL cloud instance for persistent syncing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-1.5 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-1.5 focus:ring-emerald-500"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <p className="font-semibold">
                    {testResult.success ? 'Connection Test Passed' : 'Connection Test Failed'}
                  </p>
                  <p className="mt-0.5 leading-relaxed">{testResult.message}</p>
                </div>
              )}

              {/* SQL Schema Guide */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Raw Material Classifications SQL Setup</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const sql = `CREATE TABLE IF NOT EXISTS public.raw_material_classifications (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color_tag TEXT DEFAULT 'amber',
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.raw_material_classifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON public.raw_material_classifications;
CREATE POLICY "Allow public access" ON public.raw_material_classifications FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER TABLE public.raw_material_classifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.raw_material_classifications;
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
                  Run this in your <strong>Supabase SQL Editor</strong> to create the <code>raw_material_classifications</code> table with full realtime sync:
                </p>
                <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[10px] font-mono overflow-x-auto select-all max-h-28">
{`CREATE TABLE IF NOT EXISTS public.raw_material_classifications (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color_tag TEXT DEFAULT 'amber',
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.raw_material_classifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON public.raw_material_classifications;
CREATE POLICY "Allow public access" ON public.raw_material_classifications FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.raw_material_classifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.raw_material_classifications;`}
                </pre>
              </div>

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
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
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
