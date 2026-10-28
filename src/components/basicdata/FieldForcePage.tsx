import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  PlusCircle,
  Search,
  Phone,
  Building2,
  Tag,
  Key,
  TrendingUp,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  X,
  Download,
  LayoutGrid,
  List,
  Briefcase,
  Smartphone,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Upload,
  Calendar,
  Layers,
  MapPin,
  Save,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { FieldForceRep, Distributor, OrgNode } from '../../types/erp.ts';
import { getStoredMarketHierarchies, STANDARD_DEPARTMENTS } from '../../data/marketHierarchy.ts';

const ACTION_TYPES = [
  'Primary Order Booking',
  'Secondary Sales & Delivery',
  'Corporate Key Accounts',
  'Market Survey & Field Audit',
  'Supervisory Inspection',
];

const FIELD_FORCE_TYPES = [
  { value: 'Order Booker', label: 'Order Booker' },
  { value: 'CaptureAndApprove', label: 'Capture & Approve' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Delivery Man', label: 'Delivery Man' },
  { value: 'Capture', label: 'Field Scout / Capture' },
];

const APP_PERMISSIONS_LIST = [
  'Full Mobile Order & GPS Telemetry',
  'Order Booker Only',
  'Delivery & Cash Collection',
  'Supervisor & Approver Access',
];

const FIELD_FORCE_TAGS_LIST = [
  'Core Field Force',
  'Senior Executive SR',
  'Contractual Officer',
  'Probationary Team',
];

const CUSTOMER_TAGS_LIST = [
  'All Customer Channels',
  'Dealers & Retailers Only',
  'Direct Corporate Accounts Only',
  'Workshops & Mechanics',
];

export const FieldForcePage: React.FC = () => {
  const {
    fieldForceReps,
    addFieldForceRep,
    updateFieldForceRep,
    deleteFieldForceRep,
    distributors,
    departments,
    orgHierarchy,
    addAuditLog,
    users,
    currentUser,
  } = useERP();

  // Search and Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketFilter, setSelectedMarketFilter] = useState<string>('ALL');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRep, setEditingRep] = useState<FieldForceRep | null>(null);
  const [viewingRep, setViewingRep] = useState<FieldForceRep | null>(null);
  const [repToDelete, setRepToDelete] = useState<FieldForceRep | null>(null);

  // Quick Tag TADA Approver Modal State (Super Admin Action)
  const [repToTagTadaApprover, setRepToTagTadaApprover] = useState<FieldForceRep | null>(null);
  const [quickSelectedApproverId, setQuickSelectedApproverId] = useState<string>('');
  const [quickTagSuccessMsg, setQuickTagSuccessMsg] = useState<string>('');

  // Form State for Add / Edit
  const [formCode, setFormCode] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formName, setFormName] = useState('');
  const [formNativeName, setFormNativeName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState(new Date().toISOString().substring(0, 10));
  const [formDiscontinueDate, setFormDiscontinueDate] = useState('');
  const [formFieldType, setFormFieldType] = useState('Order Booker');
  const [formActionType, setFormActionType] = useState('Primary Order Booking');
  const [formTadaApproverId, setFormTadaApproverId] = useState<string>('');
  
  // Market Hierarchy (Search & Tag)
  const [formMarketHierarchy, setFormMarketHierarchy] = useState('');
  const [marketHierarchySearch, setMarketHierarchySearch] = useState('');
  const [showMarketDropdown, setShowMarketDropdown] = useState(false);

  // Departments (Checklist with "All")
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [allDepartmentsChecked, setAllDepartmentsChecked] = useState(false);

  // Markets & Distributors
  const [allMarketsChecked, setAllMarketsChecked] = useState(false);
  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  const [selectedDistributorName, setSelectedDistributorName] = useState('');

  // Subordinate & Hierarchy
  const [parentCode, setParentCode] = useState('');
  const [invoiceWithinDays, setInvoiceWithinDays] = useState<number>(0);
  const [appPermissions, setAppPermissions] = useState('');
  const [fieldForceTags, setFieldForceTags] = useState('');
  const [customerTags, setCustomerTags] = useState('');

  // Compensation & Target
  const [monthlyTargetBDT, setMonthlyTargetBDT] = useState<number>(0);
  const [basicSalaryBDT, setBasicSalaryBDT] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');

  // Dynamic merged market hierarchy options (from stored list + orgHierarchy tree)
  const allMarketHierarchyOptions = useMemo(() => {
    const list = [...getStoredMarketHierarchies()];
    // Gather from orgHierarchy tree
    const gatherNodes = (node: OrgNode) => {
      if (node.type === 'Territory' || node.type === 'Area') {
        const full = `${node.code} - ${node.name}`;
        if (!list.some((item) => item.fullName.toLowerCase() === full.toLowerCase())) {
          list.push({
            code: node.code,
            name: node.name,
            fullName: full,
            region: 'Dhaka',
            area: node.name,
          });
        }
      }
      if (node.children) {
        node.children.forEach(gatherNodes);
      }
    };
    if (orgHierarchy) gatherNodes(orgHierarchy);
    return list;
  }, [orgHierarchy]);

  // Filtered market hierarchy list based on search term in modal
  const filteredMarketHierarchyOptions = useMemo(() => {
    if (!marketHierarchySearch.trim()) return allMarketHierarchyOptions;
    const query = marketHierarchySearch.toLowerCase();
    return allMarketHierarchyOptions.filter(
      (m) =>
        m.fullName.toLowerCase().includes(query) ||
        m.code.toLowerCase().includes(query) ||
        m.name.toLowerCase().includes(query)
    );
  }, [allMarketHierarchyOptions, marketHierarchySearch]);

  // Dynamic department options from ERPContext or fallback
  const availableDepartmentOptions = useMemo(() => {
    if (departments && departments.length > 0) {
      return departments.map((d) => d.fullName || `${d.code} - ${d.name}`);
    }
    return STANDARD_DEPARTMENTS;
  }, [departments]);

  // Handle department checkbox toggle
  const toggleDepartment = (dept: string) => {
    if (selectedDepartments.includes(dept)) {
      setSelectedDepartments(selectedDepartments.filter((d) => d !== dept));
      setAllDepartmentsChecked(false);
    } else {
      const next = [...selectedDepartments, dept];
      setSelectedDepartments(next);
      if (next.length === availableDepartmentOptions.length) {
        setAllDepartmentsChecked(true);
      }
    }
  };

  const toggleAllDepartments = () => {
    if (allDepartmentsChecked) {
      setSelectedDepartments([]);
      setAllDepartmentsChecked(false);
    } else {
      setSelectedDepartments([...availableDepartmentOptions]);
      setAllDepartmentsChecked(true);
    }
  };

  // Reset Add Form
  const resetForm = () => {
    const nextNum = fieldForceReps.length + 101;
    setFormCode(`FF-${nextNum}`);
    setFormPin('');
    setFormName('');
    setFormNativeName('');
    setFormMobile('');
    setFormJoiningDate(new Date().toISOString().substring(0, 10));
    setFormDiscontinueDate('');
    setFormFieldType('Order Booker');
    setFormActionType('Primary Order Booking');
    setFormMarketHierarchy('');
    setMarketHierarchySearch('');
    setShowMarketDropdown(false);
    setSelectedDepartments([]);
    setAllDepartmentsChecked(false);
    setAllMarketsChecked(false);
    setSelectedDistributorId('');
    setSelectedDistributorName('');
    setParentCode('');
    setInvoiceWithinDays(0);
    setAppPermissions('');
    setFieldForceTags('');
    setCustomerTags('');
    setMonthlyTargetBDT(0);
    setBasicSalaryBDT(0);
    setFormStatus('Active');
    const defaultApprover = users.find((u) => u.role === 'Sales Head' || u.role === 'Super Admin') || users[0];
    setFormTadaApproverId(defaultApprover?.id || '');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (rep: FieldForceRep) => {
    setEditingRep(rep);
    setFormCode(rep.code);
    setFormPin(rep.pin || '1234');
    setFormName(rep.name);
    setFormNativeName(rep.nativeName || '');
    setFormMobile(rep.phone);
    setFormJoiningDate(rep.joiningDate || new Date().toISOString().substring(0, 10));
    setFormDiscontinueDate(rep.discontinueDate || '');
    setFormFieldType(rep.fieldForceType || 'Order Booker');
    setFormActionType(rep.actionType || 'Primary Order Booking');
    setFormTadaApproverId(rep.tadaApproverId || '');
    
    const hierarchyVal = rep.marketHierarchy || rep.territory || '';
    setFormMarketHierarchy(hierarchyVal);
    setMarketHierarchySearch('');
    setShowMarketDropdown(false);

    setSelectedDepartments(rep.departments || [rep.department || 'DEP-1 - MOUSUMI NETWORK LTD']);
    setAllDepartmentsChecked(rep.departments?.length === STANDARD_DEPARTMENTS.length);
    setAllMarketsChecked(true);
    setSelectedDistributorId(rep.distributorId || distributors[0]?.id || '');
    setSelectedDistributorName(rep.distributorName || distributors[0]?.name || '');
    setParentCode(rep.parentCode || fieldForceReps[0]?.code || 'MGT-01');
    setInvoiceWithinDays(rep.invoiceWithinDays || 3);
    setAppPermissions(rep.appPermissions?.[0] || 'Full Mobile Order & GPS Telemetry');
    setFieldForceTags(rep.fieldForceTags?.[0] || 'Core Field Force');
    setCustomerTags(rep.customerTags?.[0] || 'All Customer Channels');
    setMonthlyTargetBDT(rep.monthlyTargetBDT || 2500000);
    setBasicSalaryBDT(rep.basicSalaryBDT || 30000);
    setFormStatus((rep.status as any) || 'Active');
  };

  const handleOpenQuickTagTadaApprover = (rep: FieldForceRep) => {
    setRepToTagTadaApprover(rep);
    setQuickSelectedApproverId(rep.tadaApproverId || users[0]?.id || '');
    setQuickTagSuccessMsg('');
  };

  const handleSaveQuickTagTadaApprover = () => {
    if (!repToTagTadaApprover) return;
    const selectedUser = users.find((u) => u.id === quickSelectedApproverId);
    if (!selectedUser) return;

    updateFieldForceRep(repToTagTadaApprover.id, {
      tadaApproverId: selectedUser.id,
      tadaApproverName: `${selectedUser.name} (${selectedUser.role})`,
    });

    addAuditLog(
      'FIELD_FORCE_TADA_APPROVER_TAGGED',
      'Field Force Directory',
      `Super Admin tagged ${selectedUser.name} (${selectedUser.role}) as TADA Approver for ${repToTagTadaApprover.name} (${repToTagTadaApprover.code})`
    );

    setQuickTagSuccessMsg(`Tagged ${selectedUser.name} as TADA Approver successfully!`);
    setTimeout(() => {
      setRepToTagTadaApprover(null);
      setQuickTagSuccessMsg('');
    }, 900);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    const assignedDist = distributors.find((d) => d.id === selectedDistributorId);
    const matchedHierarchy = allMarketHierarchyOptions.find(
      (m) => m.fullName.toLowerCase() === formMarketHierarchy.toLowerCase()
    );

    // Derive region and territory safely from the market hierarchy tag
    const resolvedRegion = matchedHierarchy?.region || 'Dhaka North';
    const resolvedArea = matchedHierarchy?.area || 'Mirpur';
    const resolvedTerritory = matchedHierarchy?.name || formMarketHierarchy;
    const selectedTadaApprover = users.find((u) => u.id === formTadaApproverId);

    addFieldForceRep({
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      nativeName: formNativeName.trim() || undefined,
      pin: formPin.trim(),
      phone: formMobile.trim(),
      designation: formFieldType,
      department: selectedDepartments[0] || 'Primary Battery Sales',
      departments: selectedDepartments,
      fieldForceType: formFieldType,
      actionType: formActionType,
      marketHierarchy: formMarketHierarchy,
      region: resolvedRegion,
      area: resolvedArea,
      territory: resolvedTerritory,
      distributorId: assignedDist?.id || selectedDistributorId,
      distributorName: assignedDist?.name || selectedDistributorName,
      distributors: assignedDist ? [assignedDist.name] : [],
      parentCode: parentCode.trim() || undefined,
      joiningDate: formJoiningDate,
      discontinueDate: formDiscontinueDate || undefined,
      invoiceWithinDays,
      appPermissions: [appPermissions],
      fieldForceTags: [fieldForceTags],
      customerTags: [customerTags],
      monthlyTargetBDT: Number(monthlyTargetBDT) || 0,
      monthlyAchievedBDT: 0,
      basicSalaryBDT: Number(basicSalaryBDT) || 0,
      conveyanceBDT: 6000,
      taDaBDT: 5000,
      mobileAllowanceBDT: 1500,
      tadaApproverId: selectedTadaApprover?.id || undefined,
      tadaApproverName: selectedTadaApprover ? `${selectedTadaApprover.name} (${selectedTadaApprover.role})` : undefined,
      status: formStatus,
      isActive: formStatus === 'Active',
      todayVisitsCount: 0,
      productiveVisitsCount: 0,
      currentLocation: {
        latitude: 23.8103,
        longitude: 90.4125,
        address: `${formMarketHierarchy}, Bangladesh`,
        lastUpdated: 'New Registration',
        speedKmH: 0,
        batteryLevel: 100,
        isOnline: true,
      },
    });

    addAuditLog(
      'FIELD_FORCE_CREATED',
      'Field Force Directory',
      `Registered field force officer ${formName} (${formCode}) tagged with Market Hierarchy: ${formMarketHierarchy} and TADA Approver: ${selectedTadaApprover ? selectedTadaApprover.name : 'Unassigned'}`
    );

    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRep) return;

    const assignedDist = distributors.find((d) => d.id === selectedDistributorId);
    const matchedHierarchy = allMarketHierarchyOptions.find(
      (m) => m.fullName.toLowerCase() === formMarketHierarchy.toLowerCase()
    );

    const resolvedRegion = matchedHierarchy?.region || editingRep.region || 'Dhaka North';
    const resolvedArea = matchedHierarchy?.area || editingRep.area || 'Mirpur';
    const resolvedTerritory = matchedHierarchy?.name || formMarketHierarchy;
    const selectedTadaApprover = users.find((u) => u.id === formTadaApproverId);

    updateFieldForceRep(editingRep.id, {
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      nativeName: formNativeName.trim() || undefined,
      pin: formPin.trim(),
      phone: formMobile.trim(),
      designation: formFieldType,
      department: selectedDepartments[0] || editingRep.department,
      departments: selectedDepartments,
      fieldForceType: formFieldType,
      actionType: formActionType,
      marketHierarchy: formMarketHierarchy,
      region: resolvedRegion,
      area: resolvedArea,
      territory: resolvedTerritory,
      distributorId: assignedDist?.id || selectedDistributorId,
      distributorName: assignedDist?.name || selectedDistributorName,
      distributors: assignedDist ? [assignedDist.name] : editingRep.distributors,
      parentCode: parentCode.trim() || undefined,
      joiningDate: formJoiningDate,
      discontinueDate: formDiscontinueDate || undefined,
      invoiceWithinDays,
      appPermissions: [appPermissions],
      fieldForceTags: [fieldForceTags],
      customerTags: [customerTags],
      monthlyTargetBDT: Number(monthlyTargetBDT) || 0,
      basicSalaryBDT: Number(basicSalaryBDT) || 0,
      tadaApproverId: selectedTadaApprover?.id || undefined,
      tadaApproverName: selectedTadaApprover ? `${selectedTadaApprover.name} (${selectedTadaApprover.role})` : undefined,
      status: formStatus,
      isActive: formStatus === 'Active',
    });

    addAuditLog(
      'FIELD_FORCE_UPDATED',
      'Field Force Directory',
      `Updated profile for ${editingRep.name} (${formCode}) -> TADA Approver: ${selectedTadaApprover ? selectedTadaApprover.name : 'Unassigned'}`
    );

    setEditingRep(null);
  };

  const handleToggleStatus = (rep: FieldForceRep) => {
    const nextStatus = rep.status === 'Active' ? 'Inactive' : 'Active';
    updateFieldForceRep(rep.id, {
      status: nextStatus,
      isActive: nextStatus === 'Active',
    });
    addAuditLog(
      'FIELD_FORCE_STATUS_TOGGLED',
      'Field Force Master',
      `Changed status of ${rep.name} (${rep.code}) to ${nextStatus}`
    );
  };

  const handleDeleteConfirm = () => {
    if (!repToDelete) return;
    deleteFieldForceRep(repToDelete.id);
    setRepToDelete(null);
  };

  // Filtered List
  const filteredReps = useMemo(() => {
    return fieldForceReps.filter((rep) => {
      // Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          rep.name.toLowerCase().includes(query) ||
          rep.code.toLowerCase().includes(query) ||
          rep.phone.toLowerCase().includes(query) ||
          (rep.nativeName && rep.nativeName.toLowerCase().includes(query)) ||
          (rep.marketHierarchy && rep.marketHierarchy.toLowerCase().includes(query)) ||
          rep.territory.toLowerCase().includes(query) ||
          (rep.distributorName && rep.distributorName.toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      // Market Hierarchy filter
      if (selectedMarketFilter !== 'ALL') {
        const repHier = rep.marketHierarchy || rep.territory;
        if (!repHier || !repHier.toLowerCase().includes(selectedMarketFilter.toLowerCase())) {
          return false;
        }
      }

      // Designation filter
      if (selectedDesignation !== 'ALL' && rep.designation !== selectedDesignation) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        const isRepActive = rep.status === 'Active' || rep.isActive !== false;
        if (selectedStatus === 'Active' && !isRepActive) return false;
        if (selectedStatus === 'Inactive' && isRepActive) return false;
      }

      return true;
    });
  }, [fieldForceReps, searchQuery, selectedMarketFilter, selectedDesignation, selectedStatus]);

  // High-Level KPIs
  const totalReps = fieldForceReps.length;
  const activeRepsCount = fieldForceReps.filter(
    (r) => r.status === 'Active' || r.isActive !== false
  ).length;
  const totalTargetBDT = fieldForceReps.reduce((acc, r) => acc + (r.monthlyTargetBDT || 0), 0);
  const totalAchievedBDT = fieldForceReps.reduce((acc, r) => acc + (r.monthlyAchievedBDT || 0), 0);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Code',
      'Name',
      'Native Name',
      'Designation',
      'Market Hierarchy Tag',
      'Action Type',
      'Phone',
      'Distributor',
      'Monthly Target (BDT)',
      'Status',
    ];
    const rows = filteredReps.map((r) => [
      r.code,
      `"${r.name}"`,
      `"${r.nativeName || ''}"`,
      `"${r.designation}"`,
      `"${r.marketHierarchy || r.territory}"`,
      `"${r.actionType || 'Primary Booking'}"`,
      `"${r.phone}"`,
      `"${r.distributorName || ''}"`,
      r.monthlyTargetBDT || 0,
      r.status || 'Active',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `field_force_directory_${new Date().toISOString().substring(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <span>Basic Data Master</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">Field Force Directory</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Field Force Master Directory
            </h1>
            
          </div>
          
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Field Officer</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Officers */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Field Officers</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalReps} <span className="text-xs font-normal text-slate-500">Personnel</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{activeRepsCount} Active on duty</span>
          </div>
        </div>

        {/* Card 2: Market Hierarchy Covered */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Market Hierarchy Tagged</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {allMarketHierarchyOptions.length} <span className="text-xs font-normal text-slate-500">Nodes</span>
          </div>
          
        </div>

        {/* Card 3: Monthly Target */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Target</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ৳ {(totalTargetBDT / 100000).toFixed(1)}L <span className="text-xs font-normal text-slate-500">BDT</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Achieved: ৳ {(totalAchievedBDT / 100000).toFixed(1)}L
          </div>
        </div>

        {/* Card 4: Mobile App */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mobile App Logins</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            100% <span className="text-xs font-normal text-slate-500">Enabled</span>
          </div>
          
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code (e.g. SPO10589, FF-101), name, mobile, Market Hierarchy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-slate-500 mr-1">
              Showing <b>{filteredReps.length}</b> of {fieldForceReps.length}
            </span>
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Grid Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Market Hierarchy Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Market Hierarchy Filter
            </label>
            <select
              value={selectedMarketFilter}
              onChange={(e) => setSelectedMarketFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Market Hierarchy Nodes</option>
              {allMarketHierarchyOptions.map((opt) => (
                <option key={opt.code} value={opt.name}>
                  {opt.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Designation */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Field Force Type / Role
            </label>
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Roles</option>
              {FIELD_FORCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active Officers Only</option>
              <option value="Inactive">Inactive / Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Content */}
      {filteredReps.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            No Field Force Officers Found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or register a new field officer to this market hierarchy.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedMarketFilter('ALL');
              setSelectedDesignation('ALL');
              setSelectedStatus('ALL');
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Officer / Employee</th>
                  <th className="py-3 px-4">Role & Action Type</th>
                  <th className="py-3 px-4">Market Hierarchy Tag</th>
                  <th className="py-3 px-4">Distributor Mapped</th>
                  <th className="py-3 px-4">TADA Approve Person</th>
                  <th className="py-3 px-4">Monthly Target</th>
                  <th className="py-3 px-4">Mobile PIN</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredReps.map((rep) => {
                  const isActive = rep.status === 'Active' || rep.isActive !== false;
                  const targetBDT = rep.monthlyTargetBDT || 2500000;
                  const achievedBDT = rep.monthlyAchievedBDT || 0;
                  const progressPct = Math.min(100, Math.round((achievedBDT / (targetBDT || 1)) * 100));
                  const hierarchyDisplay = rep.marketHierarchy || rep.territory || 'Not Assigned';

                  return (
                    <tr
                      key={rep.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Officer Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {rep.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{rep.name}</span>
                              {rep.nativeName && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                   ({rep.nativeName})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                                {rep.code}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {rep.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Action Type */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {rep.fieldForceType || rep.designation}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-medium border border-blue-200 dark:border-blue-800">
                            {rep.actionType || 'Primary Order Booking'}
                          </span>
                        </div>
                      </td>

                      {/* Market Hierarchy Tag */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
                          <Tag className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span>{hierarchyDisplay}</span>
                        </div>
                      </td>

                      {/* Mapped Distributor */}
                      <td className="py-3 px-4">
                        {rep.distributorName ? (
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate max-w-[160px] font-medium">
                              {rep.distributorName}
                            </span>
                          </div>
                        ) : rep.distributors && rep.distributors.length > 0 ? (
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate max-w-[160px] font-medium">
                              {rep.distributors[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Direct / Unassigned</span>
                        )}
                      </td>

                      {/* TADA Approve Person (Super Admin Tagged) */}
                      <td className="py-3 px-4">
                        {rep.tadaApproverName ? (
                          <div className="flex items-center gap-1.5">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-slate-800 dark:text-slate-200 text-[11px] font-medium max-w-[170px]">
                              <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="truncate font-semibold" title={rep.tadaApproverName}>
                                {rep.tadaApproverName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenQuickTagTadaApprover(rep)}
                              title="Super Admin: Reassign / Tag TADA Approver"
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenQuickTagTadaApprover(rep)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                            title="Super Admin: Tag TADA Approver for this officer"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>+ Tag Approver</span>
                          </button>
                        )}
                      </td>

                      {/* Monthly Target */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          ৳ {(targetBDT / 1000).toLocaleString()}k
                        </div>
                        <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {progressPct}% target met
                        </div>
                      </td>

                      {/* PIN & Login */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          PIN: {rep.pin || '1234'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(rep)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                          title="Click to toggle Active/Inactive"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingRep(rep)}
                            title="View Full Profile"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(rep)}
                            title="Edit Officer Profile"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRepToDelete(rep)}
                            title="Delete Officer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReps.map((rep) => {
            const isActive = rep.status === 'Active' || rep.isActive !== false;
            const targetBDT = rep.monthlyTargetBDT || 2500000;
            const achievedBDT = rep.monthlyAchievedBDT || 0;
            const progressPct = Math.min(100, Math.round((achievedBDT / (targetBDT || 1)) * 100));
            const hierarchyDisplay = rep.marketHierarchy || rep.territory || 'Not Assigned';

            return (
              <div
                key={rep.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-blue-400 transition-all space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs shrink-0">
                        {rep.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs">
                          {rep.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                            {rep.code}
                          </span>
                          {rep.nativeName && <span>• {rep.nativeName}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(rep)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Market Hierarchy & Role */}
                  <div className="mt-3 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <Tag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Market Hierarchy</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs truncate block">
                          {hierarchyDisplay}
                        </span>
                      </div>
                    </div>

                    <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rep.fieldForceType || rep.designation}</span>
                      <span className="text-[10px] text-slate-400">({rep.actionType || 'Primary Booking'})</span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rep.phone}</span>
                    </div>

                    {rep.distributorName && (
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="truncate">{rep.distributorName}</span>
                      </div>
                    )}

                    {/* TADA Approver Badge */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-slate-500 shrink-0">TADA Approver:</span>
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                          {rep.tadaApproverName || 'Not Tagged'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenQuickTagTadaApprover(rep)}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 ml-1 cursor-pointer"
                      >
                        {rep.tadaApproverName ? 'Change' : 'Tag'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Target Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-500">Target Progress</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                      ৳ {(achievedBDT / 1000).toLocaleString()}k / ৳ {(targetBDT / 1000).toLocaleString()}k
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2">
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      PIN: {rep.pin || '1234'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewingRep(rep)}
                        className="px-2.5 py-1 text-xs rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-semibold"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => handleOpenEdit(rep)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setRepToDelete(rep)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NEW FIELDFORCE (EXACTLY MATCHING USER'S SCREENSHOT) */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-4 max-h-[94vh] flex flex-col">
            {/* Modal Title Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                New FieldForce
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveAdd} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* 2-Column Grid as in Screenshot */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                {/* ================= LEFT COLUMN ================= */}
                <div className="space-y-4">
                  {/* 1. Code* */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Code<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Code"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Last Code: SPO10589
                    </span>
                  </div>

                  {/* 2. Name* */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* 3. Mobile */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Mobile
                    </label>
                    <input
                      type="text"
                      placeholder="Please enter mobile number"
                      value={formMobile}
                      onChange={(e) => setFormMobile(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* 4. Discontinue Date */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Discontinue Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formDiscontinueDate}
                        onChange={(e) => setFormDiscontinueDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* 5. Action Type */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Action Type
                    </label>
                    <select
                      value={formActionType}
                      onChange={(e) => setFormActionType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Please select type</option>
                      {ACTION_TYPES.map((act) => (
                        <option key={act} value={act}>
                          {act}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 6. Departments (Checklist with All) */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Departments
                    </label>
                    <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50/60 dark:bg-slate-800/40 max-h-36 overflow-y-auto space-y-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-1.5">
                        <input
                          type="checkbox"
                          checked={allDepartmentsChecked}
                          onChange={toggleAllDepartments}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span>All</span>
                      </label>
                      {availableDepartmentOptions.map((dept) => (
                        <label
                          key={dept}
                          className="flex items-center gap-2 text-[11px] cursor-pointer text-slate-600 dark:text-slate-300"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDepartments.includes(dept)}
                            onChange={() => toggleDepartment(dept)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <span>{dept}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 7. Markets */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Markets
                    </label>
                    <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50/60 dark:bg-slate-800/40 max-h-36 overflow-y-auto space-y-2">
                      <span className="text-[11px] text-slate-400 block italic">
                        Select distributor to load markets
                      </span>
                      <label className="flex items-center gap-2 text-xs cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={allMarketsChecked}
                          onChange={(e) => setAllMarketsChecked(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span>All</span>
                      </label>
                    </div>
                  </div>

                  {/* 8. Parent Code */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Parent Code
                    </label>
                    <select
                      value={parentCode}
                      onChange={(e) => setParentCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select parent</option>
                      {fieldForceReps.map((r) => (
                        <option key={r.id} value={r.code}>
                          {r.code} - {r.name} ({r.designation})
                        </option>
                      ))}
                      <option value="MGT-01">MGT-01 - National Sales Director</option>
                    </select>
                  </div>

                  {/* 9. Image Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Image
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => alert('Image uploaded successfully.')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-medium"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Upload image</span>
                      </button>
                      <span className="text-[10px] text-slate-400">
                        Allowed PNG. Max size of 1MB
                      </span>
                    </div>
                  </div>

                  {/* 10. Invoice Within* */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Invoice Within<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={30}
                      value={invoiceWithinDays}
                      onChange={(e) => setInvoiceWithinDays(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                </div>

                {/* ================= RIGHT COLUMN ================= */}
                <div className="space-y-4">
                  {/* 1. Pin* */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Pin<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Pin"
                      value={formPin}
                      onChange={(e) => setFormPin(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* 2. Native Name* */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Native Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Please enter Native Name"
                      value={formNativeName}
                      onChange={(e) => setFormNativeName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* 3. Joining Date */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={formJoiningDate}
                      onChange={(e) => setFormJoiningDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* 4. FieldForce Type* */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      FieldForce Type<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formFieldType}
                      onChange={(e) => setFormFieldType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select Field Force Type</option>
                      {FIELD_FORCE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ============================================================== */}
                  {/* 5. MARKET HIERARCHY (EXACT HIGHLIGHTED BOX LIKE IN SCREENSHOT) */}
                  {/* ============================================================== */}
                  <div className="p-3 rounded-xl border-2 border-red-500 bg-red-50/20 dark:bg-red-950/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-blue-600 dark:text-blue-400">
                        Market Hierarchy
                      </label>
                      <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider">
                        Tagged Market Beat
                      </span>
                    </div>

                    {/* Search Bar with clear 'x' and arrow controls */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search market hierarchy..."
                        value={marketHierarchySearch}
                        onChange={(e) => {
                          setMarketHierarchySearch(e.target.value);
                          setShowMarketDropdown(true);
                        }}
                        onFocus={() => setShowMarketDropdown(true)}
                        className="w-full pl-3 pr-14 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="absolute right-2 top-2 flex items-center gap-1 text-slate-400">
                        {marketHierarchySearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setMarketHierarchySearch('');
                            }}
                            className="p-0.5 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Clear"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowMarketDropdown(!showMarketDropdown)}
                          className="p-0.5 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showMarketDropdown ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Active Selected Hierarchy Badge */}
                    {formMarketHierarchy && (
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-mono text-xs">
                        <Tag className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold">{formMarketHierarchy}</span>
                      </div>
                    )}

                    {/* Dropdown Options List (As shown in Screenshot) */}
                    {showMarketDropdown && (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-md max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                        {filteredMarketHierarchyOptions.length === 0 ? (
                          <div className="p-3 text-center text-[11px] text-slate-400">
                            No market hierarchy found for &quot;{marketHierarchySearch}&quot;
                          </div>
                        ) : (
                          filteredMarketHierarchyOptions.map((opt) => {
                            const isSelected = formMarketHierarchy === opt.fullName;
                            return (
                              <div
                                key={opt.code + opt.fullName}
                                onClick={() => {
                                  setFormMarketHierarchy(opt.fullName);
                                  setMarketHierarchySearch(opt.name.toLowerCase());
                                }}
                                className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <span className="font-mono">{opt.fullName}</span>
                                {isSelected && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* 6. Distributors */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Distributors
                    </label>
                    <select
                      value={selectedDistributorId}
                      onChange={(e) => {
                        setSelectedDistributorId(e.target.value);
                        const dist = distributors.find((d) => d.id === e.target.value);
                        if (dist) setSelectedDistributorName(dist.name);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select Distributor</option>
                      {distributors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.dbPoint || d.district})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 7. Subordinate Field Force */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Subordinate Field Force
                    </label>
                    <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50/60 dark:bg-slate-800/40 text-[11px] text-slate-400 italic">
                      Select market to load field force
                    </div>
                  </div>

                  {/* 8. App Permissions */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      App Permissions
                    </label>
                    <select
                      value={appPermissions}
                      onChange={(e) => setAppPermissions(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {APP_PERMISSIONS_LIST.map((perm) => (
                        <option key={perm} value={perm}>
                          {perm}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 9. Field Force Tags */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Field Force Tags
                    </label>
                    <select
                      value={fieldForceTags}
                      onChange={(e) => setFieldForceTags(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {FIELD_FORCE_TAGS_LIST.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 10. Customer Tags */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Customer Tags
                    </label>
                    <select
                      value={customerTags}
                      onChange={(e) => setCustomerTags(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {CUSTOMER_TAGS_LIST.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Targets & Compensation Section */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Monthly Sales Target & Remuneration (BDT)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Monthly Sales Target (BDT)
                    </label>
                    <input
                      type="number"
                      value={monthlyTargetBDT}
                      onChange={(e) => setMonthlyTargetBDT(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Basic Salary (BDT)
                    </label>
                    <input
                      type="number"
                      value={basicSalaryBDT}
                      onChange={(e) => setBasicSalaryBDT(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Account Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Active">Active Duty</option>
                      <option value="Inactive">Inactive / Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* TADA Approve Person Section (Super Admin Tagging) */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>TADA Approve Person (Super Admin Tagging)</span>
                    </h4>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      Approval Workflow
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2.5">
                    Super admin tags which user will review and approve Travel Allowance & Daily Allowance (TADA) claims for this field force officer.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select TADA Approve Person<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formTadaApproverId}
                      onChange={(e) => setFormTadaApproverId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- No Approver Tagged (Unassigned) --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.role} ({u.designation || u.department || 'User'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md text-xs transition-all"
                >
                  Save FieldForce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT FIELDFORCE PROFILE */}
      {/* ======================================================== */}
      {editingRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-4 max-h-[94vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                Edit FieldForce: {editingRep.name} ({editingRep.code})
              </h2>
              <button
                onClick={() => setEditingRep(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Code<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Mobile
                    </label>
                    <input
                      type="text"
                      value={formMobile}
                      onChange={(e) => setFormMobile(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Action Type
                    </label>
                    <select
                      value={formActionType}
                      onChange={(e) => setFormActionType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {ACTION_TYPES.map((act) => (
                        <option key={act} value={act}>
                          {act}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Departments
                    </label>
                    <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50/60 dark:bg-slate-800/40 max-h-36 overflow-y-auto space-y-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer font-semibold border-b pb-1">
                        <input
                          type="checkbox"
                          checked={allDepartmentsChecked}
                          onChange={toggleAllDepartments}
                          className="rounded text-blue-600 w-3.5 h-3.5"
                        />
                        <span>All</span>
                      </label>
                      {availableDepartmentOptions.map((dept) => (
                        <label key={dept} className="flex items-center gap-2 text-[11px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDepartments.includes(dept)}
                            onChange={() => toggleDepartment(dept)}
                            className="rounded text-blue-600 w-3.5 h-3.5"
                          />
                          <span>{dept}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Parent Code
                    </label>
                    <input
                      type="text"
                      value={parentCode}
                      onChange={(e) => setParentCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Pin<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formPin}
                      onChange={(e) => setFormPin(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Native Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formNativeName}
                      onChange={(e) => setFormNativeName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      FieldForce Type<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formFieldType}
                      onChange={(e) => setFormFieldType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {FIELD_FORCE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Market Hierarchy Section */}
                  <div className="p-3 rounded-xl border-2 border-red-500 bg-red-50/20 dark:bg-red-950/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-blue-600 dark:text-blue-400">
                        Market Hierarchy
                      </label>
                      <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold uppercase">
                        Tagged Market Beat
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search market hierarchy..."
                        value={marketHierarchySearch}
                        onChange={(e) => {
                          setMarketHierarchySearch(e.target.value);
                          setShowMarketDropdown(true);
                        }}
                        onFocus={() => setShowMarketDropdown(true)}
                        className="w-full pl-3 pr-14 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      />
                      <div className="absolute right-2 top-2 flex items-center gap-1 text-slate-400">
                        {marketHierarchySearch && (
                          <button
                            type="button"
                            onClick={() => setMarketHierarchySearch('')}
                            className="p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowMarketDropdown(!showMarketDropdown)}
                          className="p-0.5"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {formMarketHierarchy && (
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-mono text-xs">
                        <Tag className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                        <span className="font-semibold">{formMarketHierarchy}</span>
                      </div>
                    )}

                    {showMarketDropdown && (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-md max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                        {filteredMarketHierarchyOptions.map((opt) => {
                          const isSelected = formMarketHierarchy === opt.fullName;
                          return (
                            <div
                              key={opt.code + opt.fullName}
                              onClick={() => {
                                setFormMarketHierarchy(opt.fullName);
                                setShowMarketDropdown(false);
                              }}
                              className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              <span className="font-mono">{opt.fullName}</span>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Distributor
                    </label>
                    <select
                      value={selectedDistributorId}
                      onChange={(e) => {
                        setSelectedDistributorId(e.target.value);
                        const dist = distributors.find((d) => d.id === e.target.value);
                        if (dist) setSelectedDistributorName(dist.name);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {distributors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* TADA Approve Person Section (Super Admin Tagging) */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>TADA Approve Person (Super Admin Tagging)</span>
                    </h4>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      Approval Workflow
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2.5">
                    Super admin tags which user will review and approve Travel Allowance & Daily Allowance (TADA) claims for this field force officer.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select TADA Approve Person<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formTadaApproverId}
                      onChange={(e) => setFormTadaApproverId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- No Approver Tagged (Unassigned) --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.role} ({u.designation || u.department || 'User'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRep(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIEW OFFICER PROFILE */}
      {/* ======================================================== */}
      {viewingRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs text-white font-bold text-lg flex items-center justify-center border border-white/30">
                  {viewingRep.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {viewingRep.name}
                  </h3>
                  <div className="text-xs text-blue-100 flex items-center gap-2 mt-0.5">
                    <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                      {viewingRep.code}
                    </span>
                    <span>•</span>
                    <span>{viewingRep.fieldForceType || viewingRep.designation}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingRep(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Market Hierarchy Highlight */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                      Tagged Market Hierarchy
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {viewingRep.marketHierarchy || viewingRep.territory || 'Not Assigned'}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {viewingRep.status || 'Active'}
                </span>
              </div>

              {/* Personal & App details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Mobile & PIN</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{viewingRep.phone}</div>
                  <div className="font-mono text-slate-500">PIN: {viewingRep.pin || '1234'}</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Mapped Distributor</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {viewingRep.distributorName || 'Direct Channel'}
                  </div>
                  <div className="text-[11px] text-slate-500">Parent: {viewingRep.parentCode || 'MGT-01'}</div>
                </div>
              </div>

              {/* Target & Compensation */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Monthly Sales Target</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ৳ {(viewingRep.monthlyTargetBDT || 2500000).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Basic Salary</span>
                    <b className="text-slate-800 dark:text-slate-200">
                      ৳ {(viewingRep.basicSalaryBDT || 30000).toLocaleString()}
                    </b>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Invoice Within</span>
                    <b className="text-slate-800 dark:text-slate-200">{viewingRep.invoiceWithinDays || 3} Days</b>
                  </div>
                </div>
              </div>

              {/* TADA Approver Authority */}
              <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 space-y-1">
                <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300 block">
                  TADA APPROVE PERSON (SUPER ADMIN TAGGED)
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {viewingRep.tadaApproverName || 'Not Tagged (Super Admin can assign)'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const target = viewingRep;
                      setViewingRep(null);
                      handleOpenQuickTagTadaApprover(target);
                    }}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold"
                  >
                    {viewingRep.tadaApproverName ? 'Change Approver' : 'Tag Approver'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    const target = viewingRep;
                    setViewingRep(null);
                    handleOpenEdit(target);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK TAG TADA APPROVER MODAL (SUPER ADMIN DIRECT ACTION) */}
      {repToTagTadaApprover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-blue-50/70 dark:bg-blue-950/50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Tag TADA Approve Person
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Assign approval authority for {repToTagTadaApprover.name} ({repToTagTadaApprover.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRepToTagTadaApprover(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              {quickTagSuccessMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{quickTagSuccessMsg}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">FIELD OFFICER</span>
                  <span className="font-bold text-slate-900 dark:text-white">{repToTagTadaApprover.name}</span>
                  <span className="text-[11px] text-slate-500 block">Code: {repToTagTadaApprover.code} • {repToTagTadaApprover.fieldForceType || 'Officer'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">CURRENT APPROVER</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {repToTagTadaApprover.tadaApproverName || 'Not Tagged'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select User to Tag as TADA Approver*
                </label>
                <select
                  value={quickSelectedApproverId}
                  onChange={(e) => setQuickSelectedApproverId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Approver User --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.role} ({u.designation || u.department || 'User'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  Super Admin Setting: TADA claims created by this officer will be automatically tagged to this user for approval.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/30">
              <button
                type="button"
                onClick={() => setRepToTagTadaApprover(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickTagTadaApprover}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Approver Tag</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {repToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Field Officer?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <b>{repToDelete.name}</b> ({repToDelete.code}) from the Field Force Directory?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRepToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
