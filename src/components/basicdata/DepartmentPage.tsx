import React, { useState, useMemo } from 'react';
import {
  Building2,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Users2,
  UserCheck,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Layers,
  FileText,
  Download,
  Filter,
  Eye,
  X,
  AlertCircle,
  Building,
  ShieldCheck,
  Check,
  Sparkles,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { Department } from '../../types/erp.ts';

const DIVISION_OPTIONS = [
  'Commercial & FMCG Distribution',
  'Corporate & Institutional Sales',
  'OEM & High-Capacity Storage',
  'Primary Automotive & E-Mobility',
  'Renewable & Utility Scale',
  'Manufacturing & Plant Engineering',
  'Finance & Commercial Accounts',
  'Supply Chain & SCM Logistics',
  'Customer Care & Technical Service',
];

const LOCATION_OPTIONS = [
  'Dhaka HQ - Tejgaon Industrial Area',
  'Dhaka HQ - Banani Corporate Tower',
  'Dhaka HQ - Motijheel Commercial Area',
  'Kushtia Factory Plant & Industrial Estate',
  'Chittagong Hub - Agrabad Commercial Area',
  'Sylhet Regional Depot - Zindabazar',
  'Khulna Regional Office - Sadar Road',
  'Rajshahi Operational Center - Shaheb Bazar',
];

export const DepartmentPage: React.FC = () => {
  const {
    departments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    fieldForceReps,
    distributors,
    addAuditLog,
  } = useERP();

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);

  // Form State (Used for both Create & Edit)
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDivision, setFormDivision] = useState(DIVISION_OPTIONS[0]);
  const [formHeadOfDept, setFormHeadOfDept] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLocation, setFormLocation] = useState(LOCATION_OPTIONS[0]);
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Calculate personnel count mapped to department
  const getDepartmentPersonnelCount = (deptFullName: string, deptCode: string) => {
    let repCount = 0;
    let distCount = 0;

    fieldForceReps.forEach((rep) => {
      const depts = rep.departments || (rep.department ? [rep.department] : []);
      if (
        depts.some(
          (d) =>
            d.toLowerCase().includes(deptCode.toLowerCase()) ||
            d.toLowerCase().includes(deptFullName.toLowerCase())
        )
      ) {
        repCount++;
      }
    });

    distributors.forEach((dist) => {
      const depts = dist.departments || [];
      if (
        depts.some(
          (d) =>
            d.toLowerCase().includes(deptCode.toLowerCase()) ||
            d.toLowerCase().includes(deptFullName.toLowerCase())
        )
      ) {
        distCount++;
      }
    });

    return { repCount, distCount, totalCount: repCount + distCount };
  };

  // Filtered Departments
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        dept.name.toLowerCase().includes(q) ||
        dept.code.toLowerCase().includes(q) ||
        dept.fullName.toLowerCase().includes(q) ||
        dept.headOfDepartment.toLowerCase().includes(q) ||
        dept.email.toLowerCase().includes(q) ||
        dept.division.toLowerCase().includes(q) ||
        (dept.location && dept.location.toLowerCase().includes(q));

      const matchesDivision =
        selectedDivisionFilter === 'ALL' || dept.division === selectedDivisionFilter;

      const matchesStatus =
        selectedStatusFilter === 'ALL' || dept.status === selectedStatusFilter;

      return matchesSearch && matchesDivision && matchesStatus;
    });
  }, [departments, searchTerm, selectedDivisionFilter, selectedStatusFilter]);

  // KPIs
  const activeDeptsCount = useMemo(
    () => departments.filter((d) => d.status === 'Active').length,
    [departments]
  );

  const uniqueDivisions = useMemo(() => {
    return Array.from(new Set(departments.map((d) => d.division)));
  }, [departments]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    // Generate next department code e.g. DEP-7
    const currentMax = departments.reduce((max, d) => {
      const match = d.code.match(/DEP-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    const nextCode = `DEP-${currentMax + 1}`;
    setFormCode(nextCode);
    setFormName('');
    setFormDivision(DIVISION_OPTIONS[0]);
    setFormHeadOfDept('');
    setFormEmail('');
    setFormPhone('');
    setFormLocation(LOCATION_OPTIONS[0]);
    setFormStatus('Active');
    setFormDescription('');
    setFormError('');
    setShowCreateModal(true);
  };

  // Submit Create
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      setFormError('Department code is required.');
      return;
    }
    if (!formName.trim()) {
      setFormError('Department name is required.');
      return;
    }

    // Check duplicate code
    if (departments.some((d) => d.code.toUpperCase() === formCode.trim().toUpperCase())) {
      setFormError(`Department code "${formCode.trim()}" already exists. Please use a unique code.`);
      return;
    }

    const cleanCode = formCode.trim().toUpperCase();
    const cleanName = formName.trim().toUpperCase();
    const fullName = `${cleanCode} - ${cleanName}`;

    addDepartment({
      code: cleanCode,
      name: cleanName,
      fullName,
      division: formDivision,
      headOfDepartment: formHeadOfDept.trim() || 'Unassigned',
      email: formEmail.trim() || `${cleanCode.toLowerCase()}@ensec-optimum.com`,
      phone: formPhone.trim() || '+880 1700-000000',
      status: formStatus,
      description: formDescription.trim(),
      location: formLocation,
      memberCount: 0,
      createdAt: new Date().toISOString().substring(0, 10),
    });

    setShowCreateModal(false);
  };

  // Open Edit Modal
  const handleOpenEditModal = (dept: Department) => {
    setEditingDepartment(dept);
    setFormCode(dept.code || '');
    setFormName(dept.name || '');
    setFormDivision(dept.division || DIVISION_OPTIONS[0]);
    setFormHeadOfDept(dept.headOfDepartment || '');
    setFormEmail(dept.email || '');
    setFormPhone(dept.phone || '+880 1');
    setFormLocation(dept.location || LOCATION_OPTIONS[0]);
    setFormStatus((dept.status as any) || 'Active');
    setFormDescription(dept.description || '');
    setFormError('');
  };

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;

    if (!formCode.trim()) {
      setFormError('Department code is required.');
      return;
    }
    if (!formName.trim()) {
      setFormError('Department name is required.');
      return;
    }

    const cleanCode = formCode.trim().toUpperCase();
    const cleanName = formName.trim().toUpperCase();
    const fullName = `${cleanCode} - ${cleanName}`;

    // Check if code was changed and is duplicate
    if (
      cleanCode !== editingDepartment.code &&
      departments.some((d) => d.id !== editingDepartment.id && d.code.toUpperCase() === cleanCode)
    ) {
      setFormError(`Department code "${cleanCode}" already exists on another department.`);
      return;
    }

    updateDepartment(editingDepartment.id, {
      code: cleanCode,
      name: cleanName,
      fullName,
      division: formDivision,
      headOfDepartment: formHeadOfDept.trim() || 'Unassigned',
      email: formEmail.trim(),
      phone: formPhone.trim(),
      status: formStatus,
      location: formLocation,
      description: formDescription.trim(),
    });

    setEditingDepartment(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!departmentToDelete) return;
    deleteDepartment(departmentToDelete.id);
    setDepartmentToDelete(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Department Code',
      'Department Name',
      'Full Name',
      'Division',
      'Head of Department',
      'Email',
      'Phone',
      'Status',
      'Location',
      'Description',
    ];
    const rows = filteredDepartments.map((d) => [
      `"${d.code}"`,
      `"${d.name}"`,
      `"${d.fullName}"`,
      `"${d.division}"`,
      `"${d.headOfDepartment}"`,
      `"${d.email}"`,
      `"${d.phone}"`,
      `"${d.status}"`,
      `"${d.location || ''}"`,
      `"${(d.description || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `departments_master_${new Date().toISOString().substring(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addAuditLog('CSV_EXPORT', 'Department Master', 'Exported Department Master to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>Department Registry</span>
            </h1>
            
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Field Force & Distributor Linked
            </span>
          </div>
          
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Department</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Total Departments</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {departments.length}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {activeDeptsCount} Active
            </span>
            <span>operating units</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Divisions & Wings</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {uniqueDivisions.length}
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
            Commercial, OEM & Factory
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Field Force Reps Mapped</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {fieldForceReps.length} Officers
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            Assigned across departments
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Distributor Accounts</span>
            <Users2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {distributors.length} Distributors
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
            Department permissions active
          </div>
        </div>
      </div>

    

      {/* Main Listing Section */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by code (DEP-1), name, head of department, division..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Division Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={selectedDivisionFilter}
                onChange={(e) => setSelectedDivisionFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Divisions</option>
                {uniqueDivisions.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>
            Showing <strong className="text-slate-700 dark:text-slate-200">{filteredDepartments.length}</strong> of{' '}
            {departments.length} departments
          </span>
          {searchTerm && (
            <span className="text-blue-600 dark:text-blue-400">
              Filtering by: "{searchTerm}"
            </span>
          )}
        </div>

        {/* Table View */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5">Code</th>
                  <th className="py-3 px-3.5">Department Name</th>
                  <th className="py-3 px-3.5">Division / Wing</th>
                  <th className="py-3 px-3.5">Head of Department (HOD)</th>
                  <th className="py-3 px-3.5">Location</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5 text-center">Mapped Entities</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          No departments found
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Try adjusting your search criteria or create a new department.
                        </p>
                        <button
                          onClick={handleOpenCreateModal}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Create Department</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((dept) => {
                    const { repCount, distCount, totalCount } = getDepartmentPersonnelCount(
                      dept.fullName,
                      dept.code
                    );

                    return (
                      <tr
                        key={dept.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Code */}
                        <td className="py-3 px-3.5 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900">
                            {dept.code}
                          </span>
                        </td>

                        {/* Name & Full Name */}
                        <td className="py-3 px-3.5 font-medium text-slate-900 dark:text-white">
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {dept.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {dept.fullName}
                          </div>
                          {dept.description && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 max-w-xs">
                              {dept.description}
                            </div>
                          )}
                        </td>

                        {/* Division */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                            <Layers className="w-3 h-3 text-indigo-500" />
                            {dept.division}
                          </span>
                        </td>

                        {/* Head of Department */}
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{dept.headOfDepartment || 'Unassigned'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            {dept.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" />
                                {dept.phone}
                              </span>
                            )}
                            {dept.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-2.5 h-2.5" />
                                {dept.email}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {dept.location || 'Dhaka HQ'}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {dept.status === 'Active' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Mapped Entities */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <span
                            title={`${repCount} Field Force Reps, ${distCount} Distributors`}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                          >
                            <Users2 className="w-3 h-3 text-blue-500" />
                            <span>{totalCount} mapped</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingDepartment(dept)}
                              title="View Details"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(dept)}
                              title="Edit Department"
                              className="p-1.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDepartmentToDelete(dept)}
                              title="Delete Department"
                              className="p-1.5 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 transition-colors"
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
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepartments.map((dept) => {
              const { repCount, distCount, totalCount } = getDepartmentPersonnelCount(
                dept.fullName,
                dept.code
              );

              return (
                <div
                  key={dept.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        {dept.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {dept.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Department Name */}
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2.5">
                      {dept.name}
                    </h3>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {dept.fullName}
                    </div>

                    {/* Division */}
                    <div className="mt-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                        <Layers className="w-3 h-3 text-indigo-500" />
                        {dept.division}
                      </span>
                    </div>

                    {/* Description */}
                    {dept.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                        {dept.description}
                      </p>
                    )}

                    {/* Info list */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold">{dept.headOfDepartment || 'Unassigned'}</span>
                      </div>
                      {dept.email && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{dept.email}</span>
                        </div>
                      )}
                      {dept.phone && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{dept.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{dept.location || 'Dhaka HQ'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Users2 className="w-3 h-3 text-blue-500" />
                      <span>{totalCount} mapped ({repCount} reps, {distCount} dist)</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(dept)}
                        className="px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDepartmentToDelete(dept)}
                        className="p-1 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 text-red-600 dark:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE NEW DEPARTMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Create New Department
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Register a new operational unit or division into the ERP basic data master.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEP-7"
                    value={formCode}
                    onChange={(e) => {
                      setFormCode(e.target.value.toUpperCase());
                      setFormError('');
                    }}
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">
                    Unique identifier (e.g. DEP-1, DEP-2, DEP-7)
                  </span>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Operational Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  >
                    <option value="Active">Active (Operational)</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              {/* Department Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ENERGY STORAGE & ESS SOLUTIONS"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    setFormError('');
                  }}
                  className="w-full px-3 py-2 text-xs uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                />
                {formCode && formName && (
                  <div className="mt-1 text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-1.5 rounded-lg border border-blue-200 dark:border-blue-900">
                    Full Tag: <strong>{formCode.trim()} - {formName.trim().toUpperCase()}</strong>
                  </div>
                )}
              </div>

              {/* Division / Wing */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Division / Functional Wing
                </label>
                <select
                  value={formDivision}
                  onChange={(e) => setFormDivision(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                >
                  {DIVISION_OPTIONS.map((div) => (
                    <option key={div} value={div}>
                      {div}
                    </option>
                  ))}
                </select>
              </div>

              {/* Head of Department & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Head of Department (HOD)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Shahinur Rashid"
                    value={formHeadOfDept}
                    onChange={(e) => setFormHeadOfDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Mobile / Contact
                  </label>
                  <input
                    type="text"
                    placeholder="+880 1711-XXXXXX"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Email & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="dept@ensec-optimum.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Operational Base / Location
                  </label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  >
                    {LOCATION_OPTIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Scope & Operational Responsibilities
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline key functions, product lines, or territorial mandate for this department..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Save Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEPARTMENT MODAL */}
      {editingDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Edit Department: {editingDepartment.code}
                  </h3>
                  
                </div>
              </div>
              <button
                onClick={() => setEditingDepartment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => {
                      setFormCode(e.target.value.toUpperCase());
                      setFormError('');
                    }}
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">
                    Note: Updating this will update tags on connected profiles.
                  </span>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Operational Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  >
                    <option value="Active">Active (Operational)</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              {/* Department Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    setFormError('');
                  }}
                  className="w-full px-3 py-2 text-xs uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                />
                {formCode && formName && (
                  <div className="mt-1 text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-1.5 rounded-lg border border-blue-200 dark:border-blue-900">
                    Full Tag: <strong>{formCode.trim()} - {formName.trim().toUpperCase()}</strong>
                  </div>
                )}
              </div>

              {/* Division / Wing */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Division / Functional Wing
                </label>
                <select
                  value={formDivision}
                  onChange={(e) => setFormDivision(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                >
                  {DIVISION_OPTIONS.map((div) => (
                    <option key={div} value={div}>
                      {div}
                    </option>
                  ))}
                </select>
              </div>

              {/* Head of Department & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Head of Department (HOD)
                  </label>
                  <input
                    type="text"
                    value={formHeadOfDept}
                    onChange={(e) => setFormHeadOfDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Mobile / Contact
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Email & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Operational Base / Location
                  </label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  >
                    {LOCATION_OPTIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Scope & Operational Responsibilities
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingDepartment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Update Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DEPARTMENT DETAILS MODAL */}
      {viewingDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {viewingDepartment.name}
                  </h3>
                  <div className="text-xs font-mono text-blue-600 dark:text-blue-400">
                    {viewingDepartment.code} • {viewingDepartment.fullName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingDepartment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div>
                  <span className="text-slate-400 text-[11px] block">Division / Wing</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewingDepartment.division}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Operational Status</span>
                  <span
                    className={`font-bold ${
                      viewingDepartment.status === 'Active' ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  >
                    {viewingDepartment.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Head of Department (HOD)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewingDepartment.headOfDepartment || 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Official Contact</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewingDepartment.phone || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewingDepartment.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Base Location</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewingDepartment.location || 'Dhaka HQ'}
                  </span>
                </div>
              </div>

              {viewingDepartment.description && (
                <div>
                  <span className="text-slate-400 text-[11px] block mb-1">Operational Scope</span>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {viewingDepartment.description}
                  </p>
                </div>
              )}

              {/* Mapped statistics */}
              <div>
                <span className="text-slate-400 text-[11px] block mb-1.5 font-semibold">
                  Entity Linkages in System
                </span>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {
                        fieldForceReps.filter((r) =>
                          (r.departments || [r.department || '']).some((d) =>
                            d.toLowerCase().includes(viewingDepartment.code.toLowerCase())
                          )
                        ).length
                      }
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Field Force Officers
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                      {
                        distributors.filter((d) =>
                          (d.departments || []).some((dept) =>
                            dept.toLowerCase().includes(viewingDepartment.code.toLowerCase())
                          )
                        ).length
                      }
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Tagged Distributors
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setViewingDepartment(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const target = viewingDepartment;
                  setViewingDepartment(null);
                  handleOpenEditModal(target);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Department</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {departmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Delete Department?
                </h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
              Are you sure you want to delete department{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {departmentToDelete.code} - {departmentToDelete.name}
              </strong>
              ?
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDepartmentToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold transition-colors shadow-sm"
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
