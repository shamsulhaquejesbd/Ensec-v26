import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Cpu,
  Handshake,
  Warehouse,
  Users2,
  Users,
  Contact2,
  Navigation,
  Smartphone,
  FileText,
  ClipboardList,
  FileSignature,
  Tag,
  DollarSign,
  Briefcase,
  BarChart3,
  Network,
  ShieldCheck,
  BatteryCharging,
  ChevronDown,
  ChevronRight,
  Shield,
  Database,
  Package,
  Award,
  Box,
  FolderTree,
  Building2,
  Ship,
  X,
  Landmark,
  ShoppingCart,
  PlusSquare,
  List,
  Bookmark,
  Send,
  PackageCheck,
  Boxes,
  Receipt,
  Car,
  Layers,
  Archive,
  Upload,
  FolderOutput,
  CornerDownLeft,
  GitFork,
  Truck,
  SlidersHorizontal,
  Ruler,
  AlertCircle,
  FileSpreadsheet,
  Search,
  Wrench,
  Calculator,
  CheckCircle2,
  BookOpen,
  History,
  Settings,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: string;
  onSelectModule: (module: string) => void;
}

interface SubItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isAction?: boolean;
  isDropdown?: boolean;
  children?: SubItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeModule,
  onSelectModule,
}) => {
  const {
    setShowArchitectureModal,
    currentUser,
    setCurrentUser,
    users,
    currentUserHasPermission,
    logout,
    updateUserPassword,
  } = useERP();
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Keep all sidebar dropdown menus collapsed by default; open only upon user click
  const [dropdownsOpen, setDropdownsOpen] = useState<{ [id: string]: boolean }>({});

  // Change My Password Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [myNewPassword, setMyNewPassword] = useState('');
  const [myConfirmPassword, setMyConfirmPassword] = useState('');
  const [showMyPasswordToggle, setShowMyPasswordToggle] = useState(false);
  const [myPasswordFeedback, setMyPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSavingMyPassword, setIsSavingMyPassword] = useState(false);

  const handleSaveMyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myNewPassword || myNewPassword.trim().length < 4) {
      setMyPasswordFeedback({ type: 'error', message: 'Password must be at least 4 characters long.' });
      return;
    }
    if (myNewPassword !== myConfirmPassword) {
      setMyPasswordFeedback({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    setIsSavingMyPassword(true);
    setMyPasswordFeedback(null);
    try {
      const res = await updateUserPassword(currentUser.id, myNewPassword.trim());
      if (res?.success) {
        setMyPasswordFeedback({
          type: 'success',
          message: res.warning || 'Your password was updated and synced to Supabase users table successfully!',
        });
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setIsSavingMyPassword(false);
          setMyNewPassword('');
          setMyConfirmPassword('');
        }, 1100);
      } else {
        setMyPasswordFeedback({ type: 'error', message: res?.error || 'Failed to update password.' });
        setIsSavingMyPassword(false);
      }
    } catch (err: any) {
      setMyPasswordFeedback({ type: 'error', message: err.message || 'Error updating password.' });
      setIsSavingMyPassword(false);
    }
  };

  const toggleDropdown = (id: string) => {
    setDropdownsOpen((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const navSections: NavSection[] = [
    {
      title: 'CORE PLATFORM',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        {
          id: 'basic-data',
          label: 'Basic Data',
          icon: Database,
          isDropdown: true,
          children: [
            { id: 'basic-data-raw-materials', label: 'Raw Materials', icon: Box },
            { id: 'basic-data-raw-categories', label: 'Raw Mate Category', icon: FolderTree },
            { id: 'basic-data-raw-classifications', label: 'Raw Mate Classification', icon: Layers },
            { id: 'basic-data-products', label: 'Finished Products', icon: Package },
            { id: 'basic-data-categories', label: 'Product Categories', icon: Tag },
            { id: 'basic-data-brands', label: 'Product Brands', icon: Award },
            { id: 'basic-data-warehouses', label: 'Warehouse', icon: Warehouse },
            { id: 'basic-data-distributors', label: 'Distributor Mgt', icon: Users2 },
            { id: 'basic-data-customers', label: 'Customer', icon: Contact2 },
            { id: 'basic-data-pricing-matrix', label: 'Customer Categories', icon: Tag },
            { id: 'basic-data-org-hierarchy', label: 'Org Hierarchy', icon: Network },
            { id: 'basic-data-field-force', label: 'Field Force', icon: Users },
            { id: 'basic-data-departments', label: 'Department', icon: Building2 },
            { id: 'basic-data-banks', label: 'Bank List', icon: Landmark },
            { id: 'basic-data-uom', label: 'Unit', icon: Ruler },
            { id: 'basic-data-offers', label: 'Offer & Promo Engine', icon: Tag },
          ],
        },
      ],
    },
    {
      title: 'SUPPLY CHAIN & FACTORY',
      items: [
        { id: 'procurement', label: 'Import Consignments & SCM', icon: Ship },
        { id: 'manufacturing', label: 'Factory & BOM', icon: Cpu },
      ],
    },
    {
      title: 'STOCK, INDENT & PAYMENT',
      items: [
        {
          id: 'stock',
          label: 'Stock',
          icon: Box,
          isDropdown: true,
          children: [
            { id: 'stock-cid-receive', label: 'CID Receive', icon: Archive },
            { id: 'stock-create-opening', label: 'Create Opening Stock', icon: Archive },
            { id: 'stock-upload-opening', label: 'Upload Opening Stock', icon: Upload },
            { id: 'stock-upload-primary', label: 'Upload Primary', icon: Upload },
            { id: 'stock-issued', label: 'Issued', icon: FolderOutput },
            { id: 'stock-received', label: 'Received', icon: Box },
            { id: 'stock-primary-return', label: 'Primary Return', icon: CornerDownLeft },
            { id: 'stock-damage-return', label: 'Damage Return', icon: GitFork },
            { id: 'stock-transfer', label: 'Stock Transfer', icon: Truck },
            { id: 'stock-adjustment', label: 'Stock Adjustment', icon: SlidersHorizontal },
          ],
        },
        {
          id: 'inventory-stock',
          label: 'Inventory Stock',
          icon: Boxes,
        },
        { id: 'warehouse', label: 'Multi-Warehouse Hubs', icon: Warehouse },
        {
          id: 'requisition',
          label: 'Requisition',
          icon: ShoppingCart,
          isDropdown: true,
          children: [
            { id: 'requisition-create', label: 'Create New Requisition', icon: PlusSquare },
            { id: 'requisition-list', label: 'Requisitions', icon: List },
            { id: 'requisition-approve', label: 'Approve Requisition', icon: Bookmark },
            { id: 'requisition-issue', label: 'Issue Requisition', icon: Send },
            { id: 'requisition-issued', label: 'Issued Requisition', icon: PackageCheck },
            { id: 'requisition-received', label: 'Received Requisition', icon: Boxes },
          ],
        },
        {
          id: 'payment',
          label: 'Payment',
          icon: Receipt,
          isDropdown: true,
          children: [
            { id: 'payment-create', label: 'Create Payment', icon: PlusSquare },
            { id: 'payment-list', label: 'Payment List', icon: List },
          ],
        },
      ],
    },
    {
      title: 'FIELD FORCE & SALES',
      items: [
        { id: 'field-tracker', label: 'Salesman GPS Tracker', icon: Navigation },
        { id: 'mobile-field', label: 'Mobile Field Force App', icon: Smartphone },
        { id: 'sales-orders', label: 'Sales Orders & Invoicing', icon: FileText },
        { id: 'sales-orders-registry', label: 'Sales Orders Registry', icon: ClipboardList },
        { id: 'crm-agreements', label: 'CRM Agreements', icon: FileSignature },
        { id: 'tada', label: 'TADA', icon: Car },
      ],
    },
    {
      title: 'WARRANTY & SERVICE MANAGEMENT',
      items: [
        {
          id: 'warranty',
          label: 'Warranty & Service',
          icon: Wrench,
          isDropdown: true,
          children: [
            { id: 'warranty-dashboard', label: 'Warranty Dashboard', icon: LayoutDashboard },
            { id: 'warranty-complaints', label: 'Customer Complaints', icon: AlertCircle },
            { id: 'warranty-jobcards', label: 'Service Job Cards', icon: FileSpreadsheet },
            { id: 'warranty-receiving', label: 'Battery Receiving', icon: PackageCheck },
            { id: 'warranty-verification', label: 'Warranty Verification', icon: ShieldCheck },
            { id: 'warranty-inspection', label: 'Technical Inspection', icon: Search },
            { id: 'warranty-repair', label: 'Repair & Parts Replacement', icon: Wrench },
            { id: 'warranty-parts-consumption', label: 'Spare Parts Consumption', icon: Boxes },
            { id: 'warranty-estimation', label: 'Repair Cost Estimation', icon: Calculator },
            { id: 'warranty-billing', label: 'Customer Billing & Payments', icon: Receipt },
            { id: 'warranty-qc', label: 'Quality Control', icon: CheckCircle2 },
            { id: 'warranty-dispatch', label: 'Battery Delivery & Dispatch', icon: Truck },
            { id: 'warranty-policies', label: 'Warranty Policies', icon: BookOpen },
            { id: 'warranty-history', label: 'Service History', icon: History },
            { id: 'warranty-reports', label: 'Reports & Analytics', icon: BarChart3 },
            { id: 'warranty-settings', label: 'Service Settings', icon: Settings },
          ],
        },
      ],
    },
    {
      title: 'FINANCE & ADMINISTRATION',
      items: [
        { id: 'finance-cashbook', label: 'Finance & Cash Book', icon: DollarSign },
        { id: 'payroll', label: 'Automated Payroll & HR', icon: Briefcase },
        { id: 'reports', label: 'Management Reports', icon: BarChart3 },
        { id: 'users-permissions', label: 'Users & Permissions', icon: ShieldCheck },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-68 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-14 pl-3.5 pr-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div
            onClick={() => {
              onSelectModule('dashboard');
              onClose();
            }}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-xs">
              <BatteryCharging className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-sm tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  ENSEC
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                  ERP
                </span>
              </div>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-none">
                Lithium Battery BD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto pl-3 pr-4 py-3 space-y-5">
          {navSections.map((section, sIdx) => {
            const permittedItems = section.items.filter(
              (item) => item.isAction || currentUserHasPermission(item.id)
            );
            if (permittedItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {permittedItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeModule === item.id;
                    const isChildActive = Boolean(
                      item.children?.some(
                        (c) =>
                          c.id === activeModule ||
                          (c.id === 'basic-data-distributors' && activeModule === 'distributors') ||
                          (c.id === 'basic-data-customers' && activeModule === 'customers-crm') ||
                          (c.id === 'basic-data-pricing-matrix' && activeModule === 'customers-crm')
                      )
                    );

                    if (item.isDropdown) {
                      const isDropdownOpen =
                        dropdownsOpen[item.id] !== undefined
                          ? dropdownsOpen[item.id]
                          : (isActive || isChildActive);
                      return (
                        <div key={item.id} className="space-y-0.5">
                          <button
                            onClick={() => {
                              toggleDropdown(item.id);
                              onSelectModule(item.id);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                              isActive || isChildActive
                                ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon
                                className={`w-4 h-4 transition-colors ${
                                  isActive || isChildActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                                }`}
                              />
                              <span>{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isDropdownOpen ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                          </button>

                          {/* Dropdown collapsible children */}
                          {isDropdownOpen && item.children && (
                            <div className="pl-3.5 pr-1 py-0.5 space-y-0.5 border-l-2 border-slate-200 dark:border-slate-800 ml-4 my-0.5 animate-in fade-in slide-in-from-top-1">
                              {item.children.map((sub) => {
                                const SubIcon = sub.icon;
                                const isSubActive =
                                  activeModule === sub.id ||
                                  (sub.id === 'basic-data-distributors' && activeModule === 'distributors');
                                return (
                                  <button
                                    key={sub.id}
                                    onClick={() => {
                                      onSelectModule(sub.id);
                                      onClose();
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                      isSubActive
                                        ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {SubIcon && <SubIcon className="w-3.5 h-3.5" />}
                                      <span>{sub.label}</span>
                                    </div>
                                    {sub.badge && (
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                          isSubActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                        }`}
                                      >
                                        {sub.badge}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.isAction) {
                            setShowArchitectureModal(true);
                          } else {
                            onSelectModule(item.id);
                            onClose();
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs font-semibold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 transition-colors ${
                              isActive
                                ? 'text-white'
                                : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : item.badge === 'LIVE'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : item.badge === 'RBAC'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Current User Security Clearance & Role Switcher */}
        <div className="relative pl-3 pr-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full text-left p-1.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium truncate">
                  {currentUser.role === 'Super Admin' ? 'Super Admin' : currentUser.role}
                </div>
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                showUserMenu ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showUserMenu && (
            <div className="absolute bottom-full left-2 right-2 mb-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Active Profile</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                  <Shield className="w-3 h-3" />
                  <span>Role: {currentUser.role}</span>
                </div>
              </div>

              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Test Role
              </div>

              <div className="max-h-56 overflow-y-auto py-1">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentUser(user);
                      setShowUserMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors ${
                      user.id === currentUser.id
                        ? 'bg-blue-50/70 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-medium truncate">{user.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.role}</div>
                    </div>
                    {user.id === currentUser.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 ml-1.5"></span>
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-700 px-2 space-y-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setMyNewPassword('');
                    setMyConfirmPassword('');
                    setMyPasswordFeedback(null);
                    setShowMyPasswordToggle(false);
                    setShowChangePasswordModal(true);
                  }}
                  className="w-full py-1.5 px-2.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>Change Password</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full py-1.5 px-2.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* CHANGE MY PASSWORD MODAL */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 flex items-center justify-center shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Change My Password
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Account: {currentUser.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Account Info Pill */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  ID: {currentUser.userId || currentUser.id} • {currentUser.email}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {currentUser.role}
              </span>
            </div>

            {/* Feedback messages */}
            {myPasswordFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  myPasswordFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                {myPasswordFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{myPasswordFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveMyPassword} className="space-y-3.5">
              {/* New Password */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showMyPasswordToggle ? 'text' : 'password'}
                    required
                    value={myNewPassword}
                    onChange={(e) => setMyNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 4 chars)"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMyPasswordToggle(!showMyPasswordToggle)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showMyPasswordToggle ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showMyPasswordToggle ? 'text' : 'password'}
                    required
                    value={myConfirmPassword}
                    onChange={(e) => setMyConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={`w-full pl-3 pr-10 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 ${
                      myConfirmPassword && myConfirmPassword !== myNewPassword
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  />
                </div>
                {myConfirmPassword && myConfirmPassword !== myNewPassword && (
                  <p className="text-[10px] text-rose-500">Passwords do not match</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  disabled={isSavingMyPassword}
                  className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMyPassword || (!!myConfirmPassword && myConfirmPassword !== myNewPassword)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isSavingMyPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
