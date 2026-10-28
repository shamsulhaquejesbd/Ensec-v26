import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Key,
  KeyRound,
  Shield,
  Smartphone,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  Building,
  MapPin,
  TrendingUp,
  Tag,
  DollarSign,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Eye,
  EyeOff,
  Copy,
  CheckCheck,
  Database,
  RefreshCw,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { isSupabaseConfigured } from '../../lib/supabase.ts';
import {
  User,
  Role,
  PageModuleId,
  FeaturePermissions,
  UserPermissions,
  ALL_PAGE_MODULES,
  getDefaultPermissionsForRole,
  resolveUserPermissions,
} from '../../types/erp.ts';

export const UserManagementModule: React.FC = () => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    updateUserPassword,
    updateUserPermissions,
    deleteUser,
    setCurrentUser,
    refreshUsers,
    syncAllUsersToSupabase,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'users' | 'salesmen' | 'matrix'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);

  // Dedicated Password Edit Modal State
  const [selectedUserForPasswordEdit, setSelectedUserForPasswordEdit] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [showPasswordToggle, setShowPasswordToggle] = useState<boolean>(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);
  const [sqlFixCode, setSqlFixCode] = useState<string | null>(null);
  const [hasCopiedSqlFix, setHasCopiedSqlFix] = useState<boolean>(false);

  // Supabase Database Sync Modal State
  const [showDbSyncModal, setShowDbSyncModal] = useState<boolean>(false);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [syncAllFeedback, setSyncAllFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasCopiedFullSchema, setHasCopiedFullSchema] = useState<boolean>(false);

  // Create User Form State
  const [newUserId, setNewUserId] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('ensec2026');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('Field Force');
  const [newUserDesignation, setNewUserDesignation] = useState('Territory Sales Officer');
  const [newUserDepartment, setNewUserDepartment] = useState('Field Sales');
  const [newUserRegion, setNewUserRegion] = useState('Dhaka Division');
  const [newUserArea, setNewUserArea] = useState('Dhaka North');
  const [newUserTerritory, setNewUserTerritory] = useState('Mirpur & Uttara');
  const [isSalesman, setIsSalesman] = useState(true);
  const [salesmanCode, setSalesmanCode] = useState('');
  const [salesTargetBDT, setSalesTargetBDT] = useState<number>(2000000);
  const [presetType, setPresetType] = useState<'role' | 'full' | 'custom'>('role');
  const [selectedModules, setSelectedModules] = useState<PageModuleId[]>([
    'dashboard',
    'mobile-field',
    'customers-crm',
    'sales-orders',
    'sales-orders-registry',
    'offers',
  ]);
  const [selectedFeatures, setSelectedFeatures] = useState<FeaturePermissions>(
    getDefaultPermissionsForRole('Field Force').features
  );

  // Edit Permissions Modal State
  const [editAllowedModules, setEditAllowedModules] = useState<PageModuleId[]>([]);
  const [editFeatures, setEditFeatures] = useState<FeaturePermissions>({
    canCreateSalesOrder: true,
    canApproveSalesOrder: false,
    canDispatchAndInvoice: false,
    canManageChannelPricing: false,
    canSetSpecialAgreementPrice: false,
    canCreateImportOrder: false,
    canUpdateLandedCost: false,
    canCreateProductionOrder: false,
    canUpdateBOM: false,
    canSettleOptimumJV: false,
    canCreateStockTransfer: false,
    canApproveStockTransfer: false,
    canAdjustStock: false,
    canViewGPSTracker: false,
    canLogFieldVisits: false,
    canManageOffers: false,
    canRecordCashPayments: false,
    canProcessPayroll: false,
    canExportReports: false,
    canManageUsersAndPermissions: false,
  });

  const openPermissionEditor = (user: User) => {
    setSelectedUserForPermissions(user);
    const userPerms = resolveUserPermissions(user);
    setEditAllowedModules([...userPerms.allowedModules]);
    setEditFeatures(userPerms.features);
  };

  const handleSavePermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPermissions) return;

    updateUserPermissions(selectedUserForPermissions.id, {
      allowedModules: editAllowedModules,
      features: editFeatures,
    });
    setSelectedUserForPermissions(null);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    let perms: UserPermissions;
    if (presetType === 'full' || newUserRole === 'Super Admin') {
      perms = getDefaultPermissionsForRole('Super Admin');
    } else if (presetType === 'role') {
      perms = getDefaultPermissionsForRole(newUserRole);
    } else {
      perms = {
        allowedModules: selectedModules,
        features: selectedFeatures,
      };
    }

    const code = salesmanCode || (isSalesman ? `REP-DHK-${Math.floor(100 + Math.random() * 900)}` : undefined);
    const assignedUserId = newUserId.trim().toUpperCase() || `EMP-${Math.floor(100 + Math.random() * 900)}`;

    addUser({
      userId: assignedUserId,
      password: newUserPassword.trim() || 'ensec2026',
      name: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      role: newUserRole,
      designation: newUserDesignation,
      department: newUserDepartment,
      region: isSalesman ? newUserRegion : undefined,
      area: isSalesman ? newUserArea : undefined,
      territory: isSalesman ? newUserTerritory : undefined,
      status: 'Active',
      isSalesman,
      salesmanCode: code,
      monthlySalesTargetBDT: isSalesman ? Number(salesTargetBDT) : undefined,
      permissions: perms,
    });

    setShowCreateModal(false);
    // Reset form
    setNewUserId('');
    setNewUserPassword('ensec2026');
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    updateUser(selectedUserForEdit.id, selectedUserForEdit);
    setSelectedUserForEdit(null);
  };

  // Open Password Editor Modal
  const openPasswordEditor = (user: User) => {
    setSelectedUserForPasswordEdit(user);
    setPasswordInput(user.password || '');
    setConfirmPasswordInput(user.password || '');
    setShowPasswordToggle(false);
    setPasswordFeedback(null);
    setSqlFixCode(null);
    setHasCopiedSqlFix(false);
  };

  // Generate random password helper
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'Ensec@';
    for (let i = 0; i < 4; i++) {
      res += Math.floor(Math.random() * 10);
    }
    setPasswordInput(res);
    setConfirmPasswordInput(res);
  };

  // Handle Save Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPasswordEdit) return;

    if (!passwordInput || passwordInput.trim().length < 4) {
      setPasswordFeedback({ type: 'error', message: 'Password must be at least 4 characters long.' });
      return;
    }

    if (passwordInput !== confirmPasswordInput) {
      setPasswordFeedback({ type: 'error', message: 'Passwords do not match. Please verify and retry.' });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordFeedback(null);
    setSqlFixCode(null);

    try {
      const res = await updateUserPassword(selectedUserForPasswordEdit.id, passwordInput.trim());
      if (res?.success) {
        setPasswordFeedback({
          type: 'success',
          message:
            res.warning ||
            `Password successfully updated and synced to Supabase public.users table for ${selectedUserForPasswordEdit.name}!`,
        });
        setTimeout(() => {
          setSelectedUserForPasswordEdit(null);
          setIsUpdatingPassword(false);
        }, 1100);
      } else {
        setPasswordFeedback({
          type: 'error',
          message: res?.error || 'Failed to update password.',
        });
        if (res?.sqlFix) {
          setSqlFixCode(res.sqlFix);
        }
        setIsUpdatingPassword(false);
      }
    } catch (err: any) {
      setPasswordFeedback({
        type: 'error',
        message: err.message || 'An error occurred while updating password.',
      });
      setIsUpdatingPassword(false);
    }
  };

  // Handle Sync All Users to Supabase
  const handleSyncAllUsers = async () => {
    if (!syncAllUsersToSupabase) return;
    setIsSyncingAll(true);
    setSyncAllFeedback(null);
    try {
      const res = await syncAllUsersToSupabase();
      if (res.success) {
        setSyncAllFeedback({
          type: 'success',
          message: `Successfully synchronized ${res.count} users with their current passwords to Supabase public.users table!`,
        });
      } else {
        setSyncAllFeedback({
          type: 'error',
          message: res.error || 'Failed to sync users to Supabase.',
        });
        if (res.sqlFix) {
          setSqlFixCode(res.sqlFix);
        }
      }
    } catch (err: any) {
      setSyncAllFeedback({
        type: 'error',
        message: err.message || 'An error occurred during synchronization.',
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.territory && u.territory.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const salesmenList = users.filter(
    (u) => u.isSalesman || u.role === 'Field Force' || u.role === 'Territory Sales Officer' || u.role === 'Sales Head'
  );

  const totalUsersCount = users.length;
  const totalSalesmenCount = salesmenList.length;
  const activeCount = users.filter((u) => u.status === 'Active').length;
  const superAdminCount = users.filter((u) => u.role === 'Super Admin').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              User & Salesman Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              RBAC & Feature Permissions
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enroll company staff and sales force, define hierarchical roles, and configure granular page & operational feature access by Super Admin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'users'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Users ({totalUsersCount})
            </button>
            <button
              onClick={() => setActiveTab('salesmen')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'salesmen'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Sales Force ({totalSalesmenCount})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'matrix'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Permission Matrix
            </button>
          </div>

          <button
            onClick={() => {
              setShowDbSyncModal(true);
              setSyncAllFeedback(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all shrink-0 cursor-pointer ${
              isSupabaseConfigured
                ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            }`}
            title="Manage Supabase Users Table Sync & SQL Schema"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase DB & Sync</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User / Salesman</span>
          </button>
        </div>
      </div>

      {/* KPI Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Staff Users</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">{totalUsersCount}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">{activeCount} Active in ERP</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Field Sales Force</span>
            <Smartphone className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{totalSalesmenCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">TSO & Field Reps</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Super Admins</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400">{superAdminCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Unrestricted Access</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Active Logged-In User</span>
            <Key className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">{currentUser.role}</div>
        </div>
      </div>

      {/* TAB 1: ALL USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-4 p-5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">User Directory & Security Clearance</h2>
              <span className="text-xs text-slate-400 font-mono">({filteredUsers.length} shown)</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, email, territory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="p-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="ALL">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Sales Head">Sales Head</option>
                <option value="Territory Sales Officer">Territory Sales Officer</option>
                <option value="Field Force">Field Force</option>
                <option value="Factory Manager">Factory Manager</option>
                <option value="Warehouse Manager">Warehouse Manager</option>
                <option value="Accounts / Finance">Accounts / Finance</option>
                <option value="Purchase Officer">Purchase Officer</option>
              </select>
            </div>
          </div>

          {/* User List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">System Role</th>
                  <th className="p-3">Department & Designation</th>
                  <th className="p-3">Assigned Territory / Area</th>
                  <th className="p-3">Page Access</th>
                  <th className="p-3">Feature Clearance</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Security Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredUsers.map((user) => {
                  const perms = resolveUserPermissions(user);
                  const allowedCount = (perms.allowedModules || []).length;
                  const activeFeaturesCount = Object.values(perms.features || {}).filter(Boolean).length;
                  const isCurrent = user.id === currentUser.id;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isCurrent ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-bold">
                                  YOU
                                </span>
                              )}
                              {user.isSalesman && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                                  SALESMAN
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                              <span className="font-semibold text-blue-600 dark:text-blue-400">ID: {user.userId || 'EMP-' + user.id.replace('u-', '00')}</span>
                              <span>•</span>
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            user.role === 'Super Admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : user.role === 'Sales Head' || user.role === 'Field Force' || user.role === 'Territory Sales Officer'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{user.designation}</div>
                        <div className="text-[10px] text-slate-400">{user.department}</div>
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {user.territory || user.region ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{user.territory || user.region}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">National HQ</span>
                        )}
                      </td>

                      <td className="p-3">
                        <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                          {user.role === 'Super Admin' ? 'ALL 16' : `${allowedCount} / 16`} Pages
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {user.role === 'Super Admin' ? 'All (20)' : `${activeFeaturesCount} / 20 Active`}
                        </span>
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openPasswordEditor(user)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                            title="Edit / Reset User Password"
                          >
                            <KeyRound className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>Password</span>
                          </button>

                          <button
                            onClick={() => openPermissionEditor(user)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                            title="Edit User Permissions"
                          >
                            <Key className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span>Permissions</span>
                          </button>

                          <button
                            onClick={() => setSelectedUserForEdit(user)}
                            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Edit Profile Info"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {user.role !== 'Super Admin' && (
                            <button
                              onClick={() => {
                                if (confirm(`Remove user account for ${user.name}?`)) {
                                  deleteUser(user.id);
                                }
                              }}
                              className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SALES FORCE ROSTER */}
      {activeTab === 'salesmen' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Field Sales Representatives & Quotas</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigned sales officers, designated territories, monthly sales quotas, and mobile device access.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsSalesman(true);
                  setNewUserRole('Field Force');
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm self-start sm:self-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Enroll New Salesman</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salesmenList.map((salesman) => {
                const perms = resolveUserPermissions(salesman);
                const hasMobileAccess = (perms.allowedModules || []).includes('mobile-field');
                const hasPricingRights = Boolean(perms.features?.canManageChannelPricing);

                return (
                  <div
                    key={salesman.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                          {salesman.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">{salesman.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {salesman.salesmanCode || `REP-${salesman.id}`}
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {salesman.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Territory:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {salesman.territory || 'Dhaka North'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Monthly Target:</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          ৳ {(salesman.monthlySalesTargetBDT || 2000000).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Mobile App Access:</span>
                        <span
                          className={`font-semibold ${
                            hasMobileAccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {hasMobileAccess ? '✓ Enabled' : '✕ Disabled'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Channel Price Rights:</span>
                        <span
                          className={`font-semibold ${
                            hasPricingRights ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'
                          }`}
                        >
                          {hasPricingRights ? '✓ Authorized' : 'Standard Only'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-1.5">
                      <span className="text-[10px] text-slate-400 truncate">Phone: {salesman.phone}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openPasswordEditor(salesman)}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                          title="Change Salesman Password"
                        >
                          <KeyRound className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                          <span>Password</span>
                        </button>
                        <button
                          onClick={() => openPermissionEditor(salesman)}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 shadow-xs cursor-pointer"
                        >
                          Rights
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FULL PERMISSION MATRIX GRID */}
      {activeTab === 'matrix' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">ERP System Module Access Grid</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive role and individual user security matrix across all 16 business modules.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-2.5 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">Staff / Role</th>
                  {ALL_PAGE_MODULES.map((mod) => (
                    <th key={mod.id} className="p-2 text-center whitespace-nowrap min-w-[70px]">
                      <span className="block text-[10px] font-bold uppercase">{mod.name.split(' ')[0]}</span>
                      <span className="text-[8px] text-slate-400 block">{mod.category}</span>
                    </th>
                  ))}
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                {users.map((u) => {
                  const perms = resolveUserPermissions(u);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-semibold sticky left-0 bg-white dark:bg-slate-900 z-10 whitespace-nowrap">
                        <div className="text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.role}</div>
                      </td>
                      {ALL_PAGE_MODULES.map((mod) => {
                        const allowed = u.role === 'Super Admin' || (perms.allowedModules || []).includes(mod.id);
                        return (
                          <td key={mod.id} className="p-2 text-center">
                            {allowed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 inline-block" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 inline-block" />
                            )}
                          </td>
                        );
                      })}
                      <td className="p-2 text-center whitespace-nowrap">
                        <button
                          onClick={() => openPermissionEditor(u)}
                          className="px-2 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: SUPERADMIN EDIT PERMISSIONS & CLEARANCE */}
      {selectedUserForPermissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 text-xs text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Super Admin Security & Permission Control
                  </h3>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Configuring security clearances for{' '}
                  <b className="text-slate-900 dark:text-white">{selectedUserForPermissions.name}</b> (Role:{' '}
                  {selectedUserForPermissions.role})
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForPermissions(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Quick Action Presets */}
            <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 dark:text-purple-200 text-xs">
                  Quick Security Presets:
                </span>
                <span className="text-[10px] text-purple-700 dark:text-purple-300">
                  {(editAllowedModules || []).length} Modules Allowed •{' '}
                  {Object.values(editFeatures || {}).filter(Boolean).length} Features Enabled
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const full = getDefaultPermissionsForRole('Super Admin');
                    setEditAllowedModules(full.allowedModules);
                    setEditFeatures(full.features);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-xs"
                >
                  Full Access (All 16 Modules)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const roleDefault = getDefaultPermissionsForRole(selectedUserForPermissions.role);
                    setEditAllowedModules(roleDefault.allowedModules);
                    setEditFeatures(roleDefault.features);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-xs"
                >
                  Reset to Role Default ({selectedUserForPermissions.role})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditAllowedModules(['dashboard', 'mobile-field', 'customers-crm', 'sales-orders', 'offers']);
                    setEditFeatures({
                      ...editFeatures,
                      canCreateSalesOrder: true,
                      canLogFieldVisits: true,
                      canApproveSalesOrder: false,
                      canDispatchAndInvoice: false,
                      canManageChannelPricing: false,
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200"
                >
                  Field Sales Representative Preset
                </button>
              </div>
            </div>

            <form onSubmit={handleSavePermissions} className="space-y-5">
              {/* SECTION 1: Page / Module Permissions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    1. Permitted ERP Pages & Modules
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditAllowedModules(ALL_PAGE_MODULES.map((m) => m.id))}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setEditAllowedModules(['dashboard'])}
                      className="text-[10px] text-slate-500 hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ALL_PAGE_MODULES.map((mod) => {
                    const isChecked = editAllowedModules.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                            : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditAllowedModules([...editAllowedModules, mod.id]);
                            } else {
                              setEditAllowedModules(editAllowedModules.filter((m) => m !== mod.id));
                            }
                          }}
                          className="mt-0.5 rounded text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">{mod.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {mod.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{mod.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: Granular Feature & Transactional Clearance */}
              <div className="space-y-3">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    2. Operational & Transactional Feature Clearances
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'canCreateSalesOrder', label: 'Create & Book Sales Orders', desc: 'Can place new sales orders from desk or field' },
                    { key: 'canApproveSalesOrder', label: 'Approve Sales Orders', desc: 'Management authorization for booked sales orders' },
                    { key: 'canDispatchAndInvoice', label: 'Dispatch & Tax Invoicing', desc: 'Can deduct stock and generate official commercial invoice' },
                    { key: 'canManageChannelPricing', label: 'Manage Channel Pricing Matrix', desc: 'Can edit trade prices across the 5 distribution channels' },
                    { key: 'canSetSpecialAgreementPrice', label: 'Set Special Agreement Overrides', desc: 'Can configure customer-specific contract prices' },
                    { key: 'canCreateImportOrder', label: 'Create China Import Orders', desc: 'Can book raw material purchase orders from CATL, EVE, Daly' },
                    { key: 'canUpdateLandedCost', label: 'Edit Landed SCM Cost & Duties', desc: 'Can update custom duties, freight & 50:50 cost shares' },
                    { key: 'canCreateProductionOrder', label: 'Issue Kushtia Production Orders', desc: 'Can schedule battery pack assembly batches' },
                    { key: 'canUpdateBOM', label: 'Modify Bill of Materials (BOM)', desc: 'Can adjust component requirements per battery model' },
                    { key: 'canSettleOptimumJV', label: 'Authorize Optimum JV Settlements', desc: 'Can disburse monthly JV funds to Optimum partner' },
                    { key: 'canCreateStockTransfer', label: 'Request Multi-Hub Transfers', desc: 'Can request stock moving from Kushtia to Dhaka hubs' },
                    { key: 'canApproveStockTransfer', label: 'Approve & Dispatch Stock Transfers', desc: 'Can approve warehouse trucks and decrement stock' },
                    { key: 'canAdjustStock', label: 'Manual Stock Adjustments', desc: 'Can adjust damage, scrap, or variance count' },
                    { key: 'canViewGPSTracker', label: 'View Live Salesman GPS Telemetry', desc: 'Can track live coordinates and route logs of reps' },
                    { key: 'canLogFieldVisits', label: 'Perform Customer Field Check-Ins', desc: 'Can record field visits and attendance' },
                    { key: 'canManageOffers', label: 'Configure Promotional Offers', desc: 'Can create and toggle volume slabs & promo engine' },
                    { key: 'canRecordCashPayments', label: 'Post Cash Receipts & Vouchers', desc: 'Can receive cash/cheque into Ensec bank/cash accounts' },
                    { key: 'canProcessPayroll', label: 'Process Automated Payroll & Salaries', desc: 'Can run HR monthly salary calculations and disbursements' },
                    { key: 'canExportReports', label: 'Export Confidential Reports', desc: 'Can download executive sales and stock reports' },
                    { key: 'canManageUsersAndPermissions', label: 'Manage User Accounts & RBAC', desc: 'Superadmin authority to create users and assign rights' },
                  ].map((feat) => {
                    const isEnabled = Boolean(editFeatures[feat.key as keyof FeaturePermissions]);
                    return (
                      <label
                        key={feat.key}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          isEnabled
                            ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800'
                            : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => {
                            setEditFeatures({
                              ...editFeatures,
                              [feat.key]: e.target.checked,
                            });
                          }}
                          className="mt-0.5 rounded text-purple-600"
                        />
                        <div className="flex-1">
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">
                            {feat.label}
                          </span>
                          <span className="text-[10px] text-slate-500 block leading-tight">{feat.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPermissions(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save Security Clearances</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE NEW USER OR SALESMAN */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Create User / Salesman Account
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* User ID and Password Fields */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                <div>
                  <label className="font-semibold text-blue-900 dark:text-blue-300 block mb-1">
                    Staff User ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-015 or ashraf"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">Used for system login</span>
                </div>

                <div>
                  <label className="font-semibold text-blue-900 dark:text-blue-300 block mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ensec2026"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">Default: ensec2026</span>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahfuzur Rahman"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="mahfuz@ensecbd.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+880 1711-..."
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    System Role *
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => {
                      const r = e.target.value as Role;
                      setNewUserRole(r);
                      if (r === 'Field Force' || r === 'Territory Sales Officer' || r === 'Sales Head') {
                        setIsSalesman(true);
                        setNewUserDepartment('Field Sales');
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Field Force">Field Force (Sales Representative)</option>
                    <option value="Territory Sales Officer">Territory Sales Officer (TSO)</option>
                    <option value="Area Sales Manager">Area Sales Manager (ASM)</option>
                    <option value="Regional Manager">Regional Manager (RM)</option>
                    <option value="Sales Head">Sales Head</option>
                    <option value="Factory Manager">Factory Manager (Kushtia Plant)</option>
                    <option value="Warehouse Manager">Warehouse Manager</option>
                    <option value="Accounts / Finance">Accounts / Finance</option>
                    <option value="Purchase Officer">Purchase Officer</option>
                    <option value="Super Admin">Super Admin (Full Access)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Job Designation
                  </label>
                  <input
                    type="text"
                    value={newUserDesignation}
                    onChange={(e) => setNewUserDesignation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Salesman Specific Section */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-emerald-900 dark:text-emerald-200">
                  <input
                    type="checkbox"
                    checked={isSalesman}
                    onChange={(e) => setIsSalesman(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Register as Active Field Force Salesman</span>
                </label>

                {isSalesman && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5">
                        Salesman Code
                      </label>
                      <input
                        type="text"
                        placeholder="REP-DHK-003"
                        value={salesmanCode}
                        onChange={(e) => setSalesmanCode(e.target.value)}
                        className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5">
                        Assigned Territory
                      </label>
                      <input
                        type="text"
                        value={newUserTerritory}
                        onChange={(e) => setNewUserTerritory(e.target.value)}
                        className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5">
                        Monthly Target (BDT)
                      </label>
                      <input
                        type="number"
                        value={salesTargetBDT}
                        onChange={(e) => setSalesTargetBDT(Number(e.target.value))}
                        className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Initial Permission Preset */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Initial Security Clearance Preset:
                </label>
                <div className="flex gap-2">
                  <label className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="preset"
                      checked={presetType === 'role'}
                      onChange={() => setPresetType('role')}
                    />
                    <div>
                      <span className="font-bold text-xs block">Apply Role Defaults</span>
                      <span className="text-[10px] text-slate-500">Standard for {newUserRole}</span>
                    </div>
                  </label>

                  <label className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="preset"
                      checked={presetType === 'full'}
                      onChange={() => setPresetType('full')}
                    />
                    <div>
                      <span className="font-bold text-xs block">Unrestricted Super Admin</span>
                      <span className="text-[10px] text-slate-500">All 16 pages + all features</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create User Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT PROFILE INFO */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Edit User Profile</h3>
              <button onClick={() => setSelectedUserForEdit(null)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div className="grid grid-cols-2 gap-3 p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                <div>
                  <label className="font-semibold text-blue-900 dark:text-blue-300 block mb-1">Staff User ID</label>
                  <input
                    type="text"
                    value={selectedUserForEdit.userId || ''}
                    onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, userId: e.target.value.toUpperCase() })}
                    className="w-full p-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-blue-900 dark:text-blue-300 block mb-1">Account Password</label>
                  <input
                    type="text"
                    placeholder="e.g. ensec2026"
                    value={selectedUserForEdit.password || ''}
                    onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, password: e.target.value })}
                    className="w-full p-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={selectedUserForEdit.name}
                  onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Phone</label>
                <input
                  type="text"
                  value={selectedUserForEdit.phone}
                  onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Designation</label>
                <input
                  type="text"
                  value={selectedUserForEdit.designation}
                  onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, designation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Territory</label>
                <input
                  type="text"
                  value={selectedUserForEdit.territory || ''}
                  onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, territory: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Account Status</label>
                <select
                  value={selectedUserForEdit.status}
                  onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, status: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive (Suspended)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT / RESET USER PASSWORD */}
      {selectedUserForPasswordEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 flex items-center justify-center shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Edit User Password
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Change credentials for {selectedUserForPasswordEdit.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForPasswordEdit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target User Details */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">
                  {selectedUserForPasswordEdit.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  User ID: {selectedUserForPasswordEdit.userId || selectedUserForPasswordEdit.id} • {selectedUserForPasswordEdit.email}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {selectedUserForPasswordEdit.role}
              </span>
            </div>

            {/* Current Password Info Banner */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px]">
              <span className="text-amber-800 dark:text-amber-300 font-medium">Current saved password:</span>
              <span className="font-mono font-bold text-amber-900 dark:text-amber-200 bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                {selectedUserForPasswordEdit.password || 'ensec2026'}
              </span>
            </div>

            {/* Feedback messages */}
            {passwordFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  passwordFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passwordFeedback.message}</span>
              </div>
            )}

            {/* In-app SQL Schema Fix Card if Supabase table is missing password column */}
            {sqlFixCode && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 font-semibold text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-amber-600" />
                    <span>Run this in Supabase SQL Editor:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(sqlFixCode);
                      setHasCopiedSqlFix(true);
                      setTimeout(() => setHasCopiedSqlFix(false), 2000);
                    }}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-100 flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                  >
                    {hasCopiedSqlFix ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{hasCopiedSqlFix ? 'Copied!' : 'Copy SQL'}</span>
                  </button>
                </div>
                <pre className="p-2 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap select-all">
                  {sqlFixCode}
                </pre>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-3.5">
              {/* New Password Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Random</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPasswordToggle ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter new password (min. 4 characters)"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordToggle(!showPasswordToggle)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPasswordToggle ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPasswordToggle ? 'text' : 'password'}
                    required
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Re-enter new password"
                    className={`w-full pl-3 pr-10 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 ${
                      confirmPasswordInput && confirmPasswordInput !== passwordInput
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  />
                  {confirmPasswordInput && confirmPasswordInput === passwordInput && (
                    <div className="absolute right-3 text-emerald-500">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
                {confirmPasswordInput && confirmPasswordInput !== passwordInput && (
                  <p className="text-[10px] text-rose-500">Passwords do not match</p>
                )}
              </div>

              {/* Quick Template Presets */}
              <div className="space-y-1 pt-0.5">
                <span className="text-[10px] text-slate-400 font-medium">Quick password presets:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordInput('ensec2026');
                      setConfirmPasswordInput('ensec2026');
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-medium transition-colors cursor-pointer"
                  >
                    ensec2026 (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordInput('123456');
                      setConfirmPasswordInput('123456');
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-medium transition-colors cursor-pointer"
                  >
                    123456
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const idPin = selectedUserForPasswordEdit.userId?.toLowerCase() || 'admin';
                      setPasswordInput(`${idPin}#2026`);
                      setConfirmPasswordInput(`${idPin}#2026`);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-medium transition-colors cursor-pointer"
                  >
                    {selectedUserForPasswordEdit.userId?.toLowerCase() || 'user'}#2026
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPasswordEdit(null)}
                  disabled={isUpdatingPassword}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword || (!!confirmPasswordInput && confirmPasswordInput !== passwordInput)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isUpdatingPassword ? 'Saving Password...' : 'Save New Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: SUPABASE DATABASE SYNC & SCHEMA SETUP */}
      {showDbSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 flex items-center justify-center shadow-xs">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Supabase Database: Users & Passwords Synchronization
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verify cloud database connection, seed all staff credentials, or inspect PostgreSQL table schema.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDbSyncModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Connection Status Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                    {isSupabaseConfigured ? 'Supabase Credentials Configured' : 'Local Mode (Supabase Credentials Pending)'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isSupabaseConfigured
                      ? 'Users table updates will persist to your Supabase PostgreSQL instance in real-time.'
                      : 'Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable live cloud persistence.'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    if (refreshUsers) {
                      await refreshUsers();
                      setSyncAllFeedback({ type: 'success', message: 'Users refreshed from Supabase table!' });
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Users</span>
                </button>
                <button
                  type="button"
                  onClick={handleSyncAllUsers}
                  disabled={isSyncingAll}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 text-xs shadow-xs"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{isSyncingAll ? 'Syncing...' : 'Push All Users & Passwords'}</span>
                </button>
              </div>
            </div>

            {/* Sync Feedback */}
            {syncAllFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  syncAllFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                {syncAllFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{syncAllFeedback.message}</span>
              </div>
            )}

            {/* Required SQL Schema Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Supabase SQL Migration for Users & Passwords:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const fullSql = `-- 1. Add password column if table already exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'ensec2026';

-- 2. Create users table if not exists
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  uid TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT DEFAULT 'ensec2026',
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Field Force',
  designation TEXT,
  department TEXT DEFAULT 'Operations',
  status TEXT DEFAULT 'Active',
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS and allow public access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON public.users FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;`;
                    navigator.clipboard.writeText(fullSql);
                    setHasCopiedFullSchema(true);
                    setTimeout(() => setHasCopiedFullSchema(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer hover:bg-blue-100"
                >
                  {hasCopiedFullSchema ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{hasCopiedFullSchema ? 'Copied to Clipboard!' : 'Copy Complete SQL'}</span>
                </button>
              </div>

              <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre max-h-48 border border-slate-800">
{`-- Add password column to existing users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'ensec2026';

-- Enable RLS and grant read/write access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.users FOR ALL USING (true) WITH CHECK (true);`}
              </pre>
              <p className="text-[10px] text-slate-500">
                Paste and run this snippet in your <strong>Supabase Dashboard &rarr; SQL Editor</strong> if you see a missing column or RLS warning.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDbSyncModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
