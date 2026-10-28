import React, { useState, useEffect } from 'react';
import {
  Warehouse as WarehouseIcon,
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
  Building2,
  MapPin,
  UserCheck,
  Phone,
  Mail,
  BarChart2,
  SlidersHorizontal,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRightLeft,
  LayoutGrid,
  List,
  Database,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Radio,
  ArrowUpRight,
  CloudOff,
  UploadCloud,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { Warehouse } from '../../types/erp.ts';
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  checkSupabaseConfigured,
} from '../../lib/supabase.ts';

const BANGLADESH_DISTRICTS = [
  'Dhaka',
  'Kushtia',
  'Chittagong',
  'Gazipur',
  'Narayanganj',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Rangpur',
  'Mymensingh',
  'Comilla',
  'Bogra',
  'Jessore',
  'Dinajpur',
  'Cox\'s Bazar',
  'Tangail',
  'Faridpur',
  'Pabna',
  'Noakhali',
];

export const WarehousePage: React.FC = () => {
  const {
    warehouses,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    toggleWarehouseStatus,
    refreshWarehouses,
    syncAllWarehousesToSupabase,
  } = useERP();

  // Supabase Database State
  const [isConfigured, setIsConfigured] = useState(checkSupabaseConfigured());
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(getSupabaseUrl());
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(getSupabaseAnonKey());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Sync with Supabase on mount & config changes
  useEffect(() => {
    if (refreshWarehouses) {
      refreshWarehouses();
    }
    setIsConfigured(checkSupabaseConfigured());
    const handleConfigChange = () => {
      if (refreshWarehouses) refreshWarehouses();
      setIsConfigured(checkSupabaseConfigured());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('ensec-supabase-config-changed', handleConfigChange);
      return () => {
        window.removeEventListener('ensec-supabase-config-changed', handleConfigChange);
      };
    }
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refreshWarehouses) await refreshWarehouses();
      setIsConfigured(checkSupabaseConfigured());
      setToastMessage({ text: 'Warehouse directory refreshed from Supabase!', type: 'success' });
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
    if (refreshWarehouses) await refreshWarehouses();
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

  const handleSyncAllToSupabase = async () => {
    if (!syncAllWarehousesToSupabase) return;
    setIsSyncingAll(true);
    try {
      const res = await syncAllWarehousesToSupabase();
      if (res.errors.length === 0) {
        setToastMessage({
          text: `All ${res.successCount} warehouse(s) successfully synced to Supabase table "warehouses"!`,
          type: 'success',
        });
      } else {
        setToastMessage({
          text: `Synced ${res.successCount} warehouse(s). ${res.failCount} failed: ${res.errors[0]}`,
          type: 'warning',
        });
      }
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handlePushSingleWarehouse = async (wh: Warehouse) => {
    try {
      const res = await addWarehouse({
        code: wh.code,
        name: wh.name,
        type: wh.type,
        district: wh.district,
        location: wh.location,
        managerName: wh.managerName,
        phone: wh.phone,
        email: wh.email,
        capacityUnits: wh.capacityUnits,
        currentStockUnits: wh.currentStockUnits,
        status: wh.status,
        description: wh.description,
      });
      if (res?.isRemoteSynced) {
        setToastMessage({
          text: `Warehouse "${wh.name}" (${wh.code}) successfully saved to Supabase "warehouses" table!`,
          type: 'success',
        });
      } else {
        setToastMessage({
          text: `Supabase save notice: ${res?.error || 'Database error'}`,
          type: 'warning',
        });
      }
    } catch (e: any) {
      setToastMessage({
        text: `Error saving to Supabase: ${e.message}`,
        type: 'error',
      });
    }
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [viewingWarehouse, setViewingWarehouse] = useState<Warehouse | null>(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Form Fields for Create
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<Warehouse['type']>('Regional Hub');
  const [district, setDistrict] = useState('Dhaka');
  const [location, setLocation] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [capacityUnits, setCapacityUnits] = useState<number>(0);
  const [currentStockUnits, setCurrentStockUnits] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  // Form Fields for Edit
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<Warehouse['type']>('Regional Hub');
  const [editDistrict, setEditDistrict] = useState('Dhaka');
  const [editLocation, setEditLocation] = useState('');
  const [editManagerName, setEditManagerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCapacityUnits, setEditCapacityUnits] = useState<number>(3000);
  const [editCurrentStockUnits, setEditCurrentStockUnits] = useState<number>(0);
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');

  // KPI Calculations
  const totalWarehouses = warehouses.length;
  const activeWarehouses = warehouses.filter((w) => w.status !== 'Inactive').length;
  const totalCapacity = warehouses.reduce((sum, w) => sum + (Number(w.capacityUnits) || 0), 0);
  const totalStock = warehouses.reduce((sum, w) => sum + (Number(w.currentStockUnits) || 0), 0);
  const overallOccupancyPct = totalCapacity > 0 ? Math.min(100, Math.round((totalStock / totalCapacity) * 100)) : 0;

  // Filtered List
  const filteredWarehouses = warehouses.filter((w) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      w.name.toLowerCase().includes(q) ||
      w.code.toLowerCase().includes(q) ||
      w.district.toLowerCase().includes(q) ||
      w.location.toLowerCase().includes(q) ||
      w.managerName.toLowerCase().includes(q) ||
      w.phone.toLowerCase().includes(q) ||
      (w.email && w.email.toLowerCase().includes(q));

    const matchesType = typeFilter === 'ALL' || w.type === typeFilter;
    const matchesDistrict = districtFilter === 'ALL' || w.district === districtFilter;
    const currentStatus = w.status || 'Active';
    const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;

    return matchesSearch && matchesType && matchesDistrict && matchesStatus;
  });

  // Open Create Modal with smart pre-population
  const handleOpenCreateModal = () => {
    const count = warehouses.length + 1;
    const prefix =
      type === 'Factory Plant'
        ? 'WH-FAC'
        : type === 'Central Hub'
        ? 'WH-CEN'
        : type === 'DB Point'
        ? 'WH-DB'
        : 'WH-REG';
    setCode(`${prefix}-0${count}`);
    setName('');
    setType('Regional Hub');
    setDistrict('Dhaka');
    setLocation('');
    setManagerName('');
    setPhone('');
    setEmail('');
    setCapacityUnits(0);
    setCurrentStockUnits(0);
    setDescription('');
    setStatus('Active');
    setModalError(null);
    setShowCreateModal(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    setModalError(null);
    try {
      const res = await addWarehouse({
        code: code.trim(),
        name: name.trim(),
        type,
        district,
        location: location.trim() || `${district} Logistics Center, Bangladesh`,
        managerName: managerName.trim() || 'Officer in Charge',
        phone: phone.trim() || '+880 1700-000000',
        email: email.trim() || undefined,
        capacityUnits: Number(capacityUnits) || 1000,
        currentStockUnits: Number(currentStockUnits) || 0,
        status,
        description: description.trim() || undefined,
      });

      if (res?.isRemoteSynced) {
        setToastMessage({
          text: `Warehouse "${name.trim()}" (${code.trim()}) successfully saved to Supabase "warehouses" table!`,
          type: 'success',
        });
        setShowCreateModal(false);
      } else if (res?.error) {
        setModalError(`Saved locally. Supabase notice: ${res.error}. Make sure the table "warehouses" has been created in your Supabase project.`);
        setToastMessage({
          text: `Saved locally. Supabase error: ${res.error}`,
          type: 'warning',
        });
      } else {
        setToastMessage({
          text: `Warehouse "${name.trim()}" created successfully!`,
          type: 'success',
        });
        setShowCreateModal(false);
      }
    } catch (err: any) {
      setModalError(err?.message || 'Failed to register warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (wh: Warehouse) => {
    setEditingWarehouse(wh);
    setEditCode(wh.code);
    setEditName(wh.name);
    setEditType(wh.type);
    setEditDistrict(wh.district);
    setEditLocation(wh.location);
    setEditManagerName(wh.managerName);
    setEditPhone(wh.phone);
    setEditEmail(wh.email || '');
    setEditCapacityUnits(wh.capacityUnits);
    setEditCurrentStockUnits(wh.currentStockUnits);
    setEditDescription(wh.description || '');
    setEditStatus((wh.status as any) || 'Active');
    setActiveDropdownId(null);
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarehouse || !editName.trim() || !editCode.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await updateWarehouse(editingWarehouse.id, {
        code: editCode.trim(),
        name: editName.trim(),
        type: editType,
        district: editDistrict,
        location: editLocation.trim(),
        managerName: editManagerName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
        capacityUnits: Number(editCapacityUnits) || 1,
        currentStockUnits: Number(editCurrentStockUnits) || 0,
        description: editDescription.trim() || undefined,
        status: editStatus,
      });

      if (res?.isRemoteSynced) {
        setToastMessage({
          text: `Warehouse "${editName.trim()}" updated and synced to Supabase!`,
          type: 'success',
        });
      } else {
        setToastMessage({
          text: `Warehouse "${editName.trim()}" updated successfully!`,
          type: 'success',
        });
      }
      setEditingWarehouse(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deletingWarehouse) return;
    const deletedName = deletingWarehouse.name;
    const res = await deleteWarehouse(deletingWarehouse.id);
    if (res?.isRemoteSynced) {
      setToastMessage({
        text: `Warehouse "${deletedName}" deleted and removed from Supabase!`,
        type: 'success',
      });
    } else {
      setToastMessage({
        text: `Warehouse "${deletedName}" deleted successfully!`,
        type: 'success',
      });
    }
    setDeletingWarehouse(null);
    setActiveDropdownId(null);
  };

  // Handle Toggle Status
  const handleToggleStatus = async (wh: Warehouse) => {
    const nextStatus = wh.status === 'Inactive' ? 'Active' : 'Inactive';
    await toggleWarehouseStatus(wh.id);
    setToastMessage({
      text: `Warehouse "${wh.name}" status changed to ${nextStatus}`,
      type: 'success',
    });
  };

  const getTypeBadgeClass = (whType: Warehouse['type']) => {
    switch (whType) {
      case 'Factory Plant':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Central Hub':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Regional Hub':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'DB Point':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Basic Data Master / Logistics Network</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <WarehouseIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Warehouse Master & Hub Directory</span>
          </h1>
        </div>

        {/* Action Buttons: Refresh, Supabase DB Connection, and Create New Warehouse */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh warehouses from Supabase"
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            title="Configure Supabase Database & SQL Table"
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              isConfigured
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isConfigured ? 'Supabase Connected' : 'Connect Supabase'}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create New Warehouse</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Supabase Status & Action Banners */}
      {!isConfigured && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Supabase Database is Not Connected</p>
              <p className="text-amber-800/90 dark:text-amber-300/90 text-[11px] mt-0.5">
                New warehouses are currently saved in your local browser session only and will not show in your Supabase table. Connect your Supabase project to persist them in PostgreSQL.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConfigModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 shadow-xs cursor-pointer transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Connect Supabase &amp; Copy SQL</span>
          </button>
        </div>
      )}

      {isConfigured && warehouses.some((w) => w.id.startsWith('wh-')) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <span className="font-bold">
                {warehouses.filter((w) => w.id.startsWith('wh-')).length} warehouse(s)
              </span>{' '}
              are in local session memory and not yet confirmed in Supabase table "warehouses".
            </div>
          </div>
          <button
            onClick={handleSyncAllToSupabase}
            disabled={isSyncingAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shrink-0 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>{isSyncingAll ? 'Syncing...' : 'Sync All to Supabase Table'}</span>
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-slate-900/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
              Total Warehouses
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {totalWarehouses}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> {activeWarehouses} Active Nodes
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <WarehouseIcon className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-slate-900/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
              Total Storage Capacity
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {totalCapacity.toLocaleString()} <span className="text-xs font-normal text-slate-500">Units</span>
            </p>
            
          </div>
          <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-slate-900/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
              Current Stock Stored
            </p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {totalStock.toLocaleString()} <span className="text-xs font-normal text-slate-500">Units</span>
            </p>
            
          </div>
          <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-slate-900/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="w-full mr-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                Network Utilization
              </p>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {overallOccupancyPct}%
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {(totalCapacity - totalStock).toLocaleString()} <span className="text-xs font-normal text-slate-500">Free</span>
            </p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full transition-all duration-500 ${
                  overallOccupancyPct > 90
                    ? 'bg-rose-500'
                    : overallOccupancyPct > 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${overallOccupancyPct}%` }}
              />
            </div>
          </div>
          <div className="w-11 h-11 shrink-0 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search warehouse by name, code, district, location, manager..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Hub Types</option>
            <option value="Factory Plant">Factory Plant</option>
            <option value="Central Hub">Central Hub</option>
            <option value="Regional Hub">Regional Hub</option>
            <option value="DB Point">DB Point</option>
          </select>

          {/* District Filter */}
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Districts</option>
            {BANGLADESH_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 ml-1">
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Warehouses Content */}
      {filteredWarehouses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <WarehouseIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            No warehouses matched your filters
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Try adjusting your search criteria, or click below to register a new warehouse facility in the basic data master.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Warehouse</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Code & Facility</th>
                  <th className="px-4 py-3.5">Type & District</th>
                  <th className="px-4 py-3.5">Location Address</th>
                  <th className="px-4 py-3.5">In-Charge / Manager</th>
                  <th className="px-4 py-3.5">Capacity & Stock</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredWarehouses.map((wh) => {
                  const capacity = Number(wh.capacityUnits) || 1;
                  const stock = Number(wh.currentStockUnits) || 0;
                  const occupancy = Math.min(100, Math.round((stock / capacity) * 100));
                  const isInactive = wh.status === 'Inactive';

                  return (
                    <tr
                      key={wh.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Code & Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <WarehouseIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {wh.code}
                              </span>
                              {wh.id.startsWith('wh-') ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800"
                                  title="Stored in local browser memory only. Click options to push to Supabase."
                                >
                                  <CloudOff className="w-2.5 h-2.5" />
                                  Local
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800"
                                  title="Confirmed in Supabase PostgreSQL table"
                                >
                                  <Database className="w-2.5 h-2.5" />
                                  Synced
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mt-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {wh.name}
                            </p>
                            {wh.description && (
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                                {wh.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type & District */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-md border ${getTypeBadgeClass(
                              wh.type
                            )}`}
                          >
                            {wh.type}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{wh.district}</span>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                          {wh.location}
                        </p>
                      </td>

                      {/* In-Charge / Contact */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{wh.managerName}</span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{wh.phone}</span>
                          </p>
                          {wh.email && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[130px]">{wh.email}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Capacity & Stock Bar */}
                      <td className="px-4 py-3.5 min-w-[170px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {stock.toLocaleString()} <span className="font-normal text-slate-400">/ {capacity.toLocaleString()}</span>
                            </span>
                            <span
                              className={`text-[11px] font-bold ${
                                occupancy > 90
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : occupancy > 70
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {occupancy}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                occupancy > 90
                                  ? 'bg-rose-500'
                                  : occupancy > 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${occupancy}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Free Space: {(capacity - stock).toLocaleString()} units
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isInactive
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isInactive ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'
                            }`}
                          />
                          {isInactive ? 'Inactive' : 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(wh)}
                            title="Edit Warehouse"
                            className="p-1.5 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Details Button */}
                          <button
                            onClick={() => setViewingWarehouse(wh)}
                            title="View Facility Details"
                            className="p-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Options Dropdown Trigger */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveDropdownId(
                                  activeDropdownId === wh.id ? null : wh.id
                                )
                              }
                              title="More Options"
                              className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeDropdownId === wh.id && (
                              <div
                                className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30"
                                onMouseLeave={() => setActiveDropdownId(null)}
                              >
                                <button
                                  onClick={() => handleOpenEditModal(wh)}
                                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Edit Warehouse</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setViewingWarehouse(wh);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                                  <span>View Details & Specs</span>
                                </button>

                                <button
                                  onClick={() => {
                                    toggleWarehouseStatus(wh.id);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                                >
                                  <Power className="w-3.5 h-3.5 text-amber-500" />
                                  <span>
                                    {wh.status === 'Inactive'
                                      ? 'Set as Active'
                                      : 'Set as Inactive'}
                                  </span>
                                </button>

                                {wh.id.startsWith('wh-') && (
                                  <button
                                    onClick={() => {
                                      handlePushSingleWarehouse(wh);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2 cursor-pointer font-medium"
                                  >
                                    <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Sync to Supabase Now</span>
                                  </button>
                                )}

                                <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

                                <button
                                  onClick={() => {
                                    setDeletingWarehouse(wh);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Warehouse</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID / CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWarehouses.map((wh) => {
            const capacity = Number(wh.capacityUnits) || 1;
            const stock = Number(wh.currentStockUnits) || 0;
            const occupancy = Math.min(100, Math.round((stock / capacity) * 100));
            const isInactive = wh.status === 'Inactive';

            return (
              <div
                key={wh.id}
                className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <WarehouseIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {wh.code}
                          </span>
                          {wh.id.startsWith('wh-') ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800"
                              title="Stored in local browser memory only."
                            >
                              <CloudOff className="w-2.5 h-2.5" />
                              Local
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800"
                              title="Confirmed in Supabase PostgreSQL table"
                            >
                              <Database className="w-2.5 h-2.5" />
                              Synced
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mt-0.5 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {wh.name}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-md border shrink-0 ${getTypeBadgeClass(
                        wh.type
                      )}`}
                    >
                      {wh.type}
                    </span>
                  </div>

                  {/* Location & District */}
                  <div className="space-y-1.5 mb-4 text-xs">
                    <p className="text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{wh.location}</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 font-medium pl-5">
                      District: <span className="text-slate-800 dark:text-slate-200 font-semibold">{wh.district}</span>
                    </p>
                  </div>

                  {/* In-Charge Details */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1 mb-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Facility Manager:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{wh.managerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{wh.phone}</span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-600 dark:text-slate-400">
                        Stock Occupancy:
                      </span>
                      <span
                        className={`font-bold ${
                          occupancy > 90
                            ? 'text-rose-600 dark:text-rose-400'
                            : occupancy > 70
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {stock.toLocaleString()} / {capacity.toLocaleString()} ({occupancy}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          occupancy > 90
                            ? 'bg-rose-500'
                            : occupancy > 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isInactive
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isInactive ? 'bg-slate-400' : 'bg-emerald-500'
                      }`}
                    />
                    {isInactive ? 'Inactive' : 'Active'}
                  </span>

                  <div className="flex items-center gap-1">
                    {wh.id.startsWith('wh-') && (
                      <button
                        onClick={() => handlePushSingleWarehouse(wh)}
                        className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-blue-200 dark:border-blue-800"
                        title="Sync this warehouse to Supabase table"
                      >
                        <UploadCloud className="w-3 h-3 text-blue-500" />
                        <span>Sync</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditModal(wh)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-emerald-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setViewingWarehouse(wh)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingWarehouse(wh)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== CREATE WAREHOUSE MODAL ===================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <WarehouseIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Register New Warehouse Node
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add a new storage plant, distribution hub or DB point to Basic Data
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Supabase Target Indicator */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Database Target:</span>
                </span>
                {isConfigured ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase Table (public.warehouses)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowConfigModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-[11px] hover:underline cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Local Session Only &bull; Click to connect Supabase
                  </button>
                )}
              </div>

              {/* Modal Error Alert */}
              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-900 dark:text-rose-200">Supabase Save Notice</p>
                    <p className="mt-0.5 leading-relaxed">{modalError}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateModal(false);
                          setShowConfigModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] cursor-pointer transition-colors"
                      >
                        <Database className="w-3 h-3" />
                        <span>Setup "warehouses" Table &amp; RLS</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModalError(null);
                          setShowCreateModal(false);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-[11px] cursor-pointer transition-colors"
                      >
                        <span>Keep in Local Memory &amp; Close</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Row 1: Code & Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Warehouse Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. WH-SYL-01"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Unique identifier used across stock transfers & invoices
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Facility Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as Warehouse['type'])}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Factory Plant">Factory Plant (Manufacturing)</option>
                    <option value="Central Hub">Central Hub (Primary Stock)</option>
                    <option value="Regional Hub">Regional Hub (Zonal Distribution)</option>
                    <option value="DB Point">DB Point (Distributor Buffer Point)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Warehouse Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Warehouse Facility Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sylhet Regional Distribution Hub (BSCIC)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Row 3: District & Location Address */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    District <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {BANGLADESH_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Detailed Physical Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Plot 18-20, BSCIC Industrial Area, Sylhet"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Manager & Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Manager / In-Charge Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="e.g. Kazi Nazrul Islam"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Contact Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +880 1711-234567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. sylhet.hub@ensec-bd.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Capacity, Initial Stock, Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Capacity (Units) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={capacityUnits}
                    onChange={(e) => setCapacityUnits(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Initial Stock (Units)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={currentStockUnits}
                    onChange={(e) => setCurrentStockUnits(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Active">Active (Operational)</option>
                    <option value="Inactive">Inactive (Under Setup/Maintenance)</option>
                  </select>
                </div>
              </div>

              {/* Row 6: Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Description / Operational Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes on facility loading dock, security arrangements, backup generator, regional coverage..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? 'Saving to Database...' : 'Save & Register Warehouse'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== EDIT WAREHOUSE MODAL ===================== */}
      {editingWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Edit Warehouse: {editingWarehouse.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    ID: {editingWarehouse.id} • Code: {editingWarehouse.code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingWarehouse(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Row 1: Code & Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Warehouse Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Facility Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as Warehouse['type'])}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Factory Plant">Factory Plant (Manufacturing)</option>
                    <option value="Central Hub">Central Hub (Primary Stock)</option>
                    <option value="Regional Hub">Regional Hub (Zonal Distribution)</option>
                    <option value="DB Point">DB Point (Distributor Buffer Point)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Warehouse Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Warehouse Facility Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Row 3: District & Location Address */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    District <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {BANGLADESH_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Detailed Physical Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Manager & Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Manager Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editManagerName}
                    onChange={(e) => setEditManagerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Contact Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Capacity, Stock, Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Capacity (Units) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editCapacityUnits}
                    onChange={(e) => setEditCapacityUnits(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Current Stock (Units)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editCurrentStockUnits}
                    onChange={(e) => setEditCurrentStockUnits(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Operational Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Active">Active (Operational)</option>
                    <option value="Inactive">Inactive (Under Setup/Maintenance)</option>
                  </select>
                </div>
              </div>

              {/* Row 6: Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Description / Operational Notes
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingWarehouse(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? 'Saving to Database...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== VIEW DETAILS MODAL ===================== */}
      {viewingWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <WarehouseIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {viewingWarehouse.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded">
                      {viewingWarehouse.code}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.2 rounded-md border ${getTypeBadgeClass(
                        viewingWarehouse.type
                      )}`}
                    >
                      {viewingWarehouse.type}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingWarehouse(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-400 font-medium">District</p>
                  <p className="text-slate-900 dark:text-slate-100 font-bold text-sm mt-0.5">
                    {viewingWarehouse.district}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-400 font-medium">Status</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-0.5">
                    {viewingWarehouse.status || 'Active'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Physical Address:</span>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-medium">
                    {viewingWarehouse.location}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-medium">Manager & Contact:</span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
                    {viewingWarehouse.managerName}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                    {viewingWarehouse.phone}
                  </p>
                  {viewingWarehouse.email && (
                    <p className="text-slate-500 mt-0.5">{viewingWarehouse.email}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-medium">Storage Capacity & Utilization:</span>
                  <div className="flex items-center justify-between mt-1 text-sm font-bold">
                    <span className="text-slate-900 dark:text-slate-100">
                      {viewingWarehouse.currentStockUnits.toLocaleString()} / {viewingWarehouse.capacityUnits.toLocaleString()} Units
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {Math.round(
                        (viewingWarehouse.currentStockUnits / viewingWarehouse.capacityUnits) * 100
                      )}%
                    </span>
                  </div>
                </div>

                {viewingWarehouse.description && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-medium">Operational Notes:</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5 italic">
                      "{viewingWarehouse.description}"
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    const target = viewingWarehouse;
                    setViewingWarehouse(null);
                    handleOpenEditModal(target);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
                <button
                  onClick={() => setViewingWarehouse(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {deletingWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Delete Warehouse Node?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete{' '}
                <strong className="text-slate-900 dark:text-slate-100">
                  {deletingWarehouse.name} ({deletingWarehouse.code})
                </strong>
                ?
              </p>
              {deletingWarehouse.currentStockUnits > 0 && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-lg text-left text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Warning: Facility currently holds {deletingWarehouse.currentStockUnits} units of stock!
                  </p>
                  <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
                    Deleting this hub will remove it from the directory. Make sure to transfer or reconcile inventory beforehand.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingWarehouse(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SUPABASE DATABASE CONFIGURATION & SQL MODAL ===================== */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/60 dark:bg-emerald-950/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Supabase Database Connection &amp; Warehouses Table
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Connect your Supabase project to persist warehouses in your PostgreSQL database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Connection Status Pill */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Database Status</span>
                {isConfigured ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 font-semibold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Not Configured (Local Memory Only)
                  </span>
                )}
              </div>

              {/* Project URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Project URL *
                </label>
                <input
                  type="url"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  placeholder="https://rcngtmnqukrudueendns.supabase.co"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Found in Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
                </p>
              </div>

              {/* Project Anon Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Anon (Public) Key *
                </label>
                <input
                  type="password"
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Found in Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API keys &gt; <code>anon public</code>
                </p>
              </div>

              {/* Test Result Message */}
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
                    <span>Supabase SQL Setup for "warehouses"</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const sql = `CREATE TABLE IF NOT EXISTS public.warehouses (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  district TEXT DEFAULT 'Dhaka',
  incharge_name TEXT,
  incharge_phone TEXT,
  is_factory_plant BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Enable Row Level Security and allow public access
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access on warehouses" ON public.warehouses;
CREATE POLICY "Allow public access on warehouses" ON public.warehouses FOR ALL USING (true) WITH CHECK (true);

-- 2. Enable Realtime Replication
ALTER TABLE public.warehouses REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouses;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;`;
                      navigator.clipboard.writeText(sql);
                      setToastMessage({
                        text: 'SQL script copied to clipboard! Paste it into Supabase SQL Editor.',
                        type: 'success',
                      });
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold hover:bg-emerald-200 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy SQL Script</span>
                  </button>
                </div>
                <p className="leading-relaxed text-[10.5px]">
                  If your table is showing blank or does not exist yet, run this in your <strong>Supabase SQL Editor</strong> to create the table, allow RLS access, and enable <strong>Realtime Replication</strong>:
                </p>
                <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[10px] font-mono overflow-x-auto select-all max-h-36">
{`CREATE TABLE IF NOT EXISTS public.warehouses (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  district TEXT DEFAULT 'Dhaka',
  incharge_name TEXT,
  incharge_phone TEXT,
  is_factory_plant BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Enable RLS and public access
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access on warehouses" ON public.warehouses;
CREATE POLICY "Allow public access on warehouses" ON public.warehouses FOR ALL USING (true) WITH CHECK (true);

-- 2. Enable Realtime Replication
ALTER TABLE public.warehouses REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouses;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;`}
                </pre>
              </div>

              {/* Sync All Button */}
              {isConfigured && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-200">
                      Bulk Sync Existing Warehouses
                    </p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300">
                      Push all {warehouses.length} current warehouse node(s) directly into Supabase
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncAllToSupabase}
                    disabled={isSyncingAll || warehouses.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                    <span>{isSyncingAll ? 'Syncing...' : 'Sync to Supabase'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || !supabaseUrlInput || !supabaseKeyInput}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
                >
                  {isTestingConnection ? 'Testing...' : 'Test Connection'}
                </button>
                {isConfigured && (
                  <button
                    type="button"
                    onClick={handleClearConfig}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Disconnect
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Credentials</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
