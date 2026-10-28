import React, { useState } from 'react';
import {
  Contact2,
  PlusCircle,
  Sparkles,
  Search,
  Building2,
  Building,
  Users,
  ShieldCheck,
  CreditCard,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  ChevronRight,
  Filter,
  Edit2,
  X,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { Customer, PricingTier, Product, getCustomerProductPricing } from '../../types/erp.ts';

interface CustomerDirectoryPageProps {
  onNavigateToPricingMatrix?: () => void;
}

export const CustomerDirectoryPage: React.FC<CustomerDirectoryPageProps> = ({
  onNavigateToPricingMatrix,
}) => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    refreshCustomers,
    products,
    distributors,
    customerCategories,
    setCustomerCustomProductPrice,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleManualRefresh = async () => {
    if (refreshCustomers) {
      setIsRefreshing(true);
      try {
        await refreshCustomers();
        setToastMessage({ text: 'Customer directory refreshed from Supabase.', type: 'success' });
        setTimeout(() => setToastMessage(null), 3000);
      } catch (e: any) {
        setToastMessage({ text: 'Refresh failed: ' + e?.message, type: 'error' });
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Special Price Override Modal State
  const [overrideCustomer, setOverrideCustomer] = useState<Customer | null>(null);
  const [overrideProductId, setOverrideProductId] = useState(products[0]?.id || '');
  const [overridePriceBDT, setOverridePriceBDT] = useState<number>(0);

  // Edit Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustEmail, setEditCustEmail] = useState('');
  const [editCustChannel, setEditCustChannel] = useState<'Direct Sales' | 'Distributor Sales'>('Direct Sales');
  const [editCustType, setEditCustType] = useState<
    'Corporate Customer' | 'Project Customer' | 'Dealer' | 'Retailer' | 'Workshop' | 'End Customer'
  >('Corporate Customer');
  const [editCustDistrict, setEditCustDistrict] = useState('Dhaka');
  const [editCustAddress, setEditCustAddress] = useState('');
  const [editCreditLimitBDT, setEditCreditLimitBDT] = useState(0);
  const [editCustPricingTier, setEditCustPricingTier] = useState<PricingTier>('Corporate Channel');
  const [editAssignedDistId, setEditAssignedDistId] = useState('');
  const [editCustStatus, setEditCustStatus] = useState<'Active' | 'Inactive'>('Active');

  const openEditCustomerModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditCustName(customer.name);
    setEditCustPhone(customer.phone);
    setEditCustEmail(customer.email || '');
    setEditCustChannel((customer.channel as any) || 'Direct Sales');
    setEditCustType((customer.customerType as any) || 'Corporate Customer');
    setEditCustDistrict(customer.district || 'Dhaka');
    setEditCustAddress(customer.address || '');
    setEditCreditLimitBDT(customer.creditLimitBDT || 0);
    setEditCustPricingTier((customer.pricingTier as any) || 'Corporate Channel');
    setEditCustCategoryId(customer.customerCategoryId || '');
    setEditAssignedDistId(customer.assignedDistributorId || '');
    setEditCustStatus((customer.status as any) || 'Active');
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setIsSubmitting(true);
    const dist = distributors.find((d) => d.id === editAssignedDistId);
    const cat = customerCategories.find((c) => c.id === editCustCategoryId);

    try {
      const res = await updateCustomer(editingCustomer.id, {
        name: editCustName.trim(),
        phone: editCustPhone.trim(),
        email: editCustEmail.trim() || undefined,
        channel: editCustChannel,
        customerType: editCustType,
        district: editCustDistrict,
        address: editCustAddress.trim() || undefined,
        creditLimitBDT: Number(editCreditLimitBDT) || 0,
        pricingTier: editCustPricingTier,
        customerCategoryId: cat ? cat.id : undefined,
        customerCategoryName: cat ? cat.name : undefined,
        assignedDistributorId: dist ? dist.id : undefined,
        assignedDistributorName: dist ? dist.name : undefined,
        marketHierarchy: dist?.marketHierarchy || editingCustomer.marketHierarchy || undefined,
        status: editCustStatus,
      });

      if (res && res.error) {
        setToastMessage({ text: `Customer updated locally (${res.error})`, type: 'warning' });
      } else {
        setToastMessage({ text: `Customer "${editCustName}" updated and synced to Supabase!`, type: 'success' });
      }

      setEditingCustomer(null);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage({ text: err?.message || 'Failed to update customer', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // New Customer Form State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custChannel, setCustChannel] = useState<'Direct Sales' | 'Distributor Sales'>('Direct Sales');
  const [custType, setCustType] = useState<
    'Corporate Customer' | 'Project Customer' | 'Dealer' | 'Retailer' | 'Workshop' | 'End Customer'
  >('Corporate Customer');
  const [custDistrict, setCustDistrict] = useState('Dhaka');
  const [custAddress, setCustAddress] = useState('');
  const [creditLimitBDT, setCreditLimitBDT] = useState(0);
  const [custPricingTier, setCustPricingTier] = useState<PricingTier>('Corporate Channel');
  const [custCategoryId, setCustCategoryId] = useState('');
  const [editCustCategoryId, setEditCustCategoryId] = useState('');
  const [assignedDistId, setAssignedDistId] = useState('');

  const openOverrideModal = (customer: Customer) => {
    setOverrideCustomer(customer);
    const prod = products[0];
    if (prod) {
      setOverrideProductId(prod.id);
      const existing = customer.customProductPrices?.[prod.id];
      if (existing) {
        setOverridePriceBDT(existing);
      } else {
        const pricing = getCustomerProductPricing(customer, prod);
        setOverridePriceBDT(pricing.unitPrice);
      }
    }
  };

  const handleSaveCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideCustomer || !overrideProductId) return;
    setCustomerCustomProductPrice(overrideCustomer.id, overrideProductId, Number(overridePriceBDT));
    setOverrideCustomer(null);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      setToastMessage({ text: 'Customer name and phone number are required.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    const code = `CUST-${custType.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const dist = distributors.find((d) => d.id === assignedDistId);
    const cat = customerCategories.find((c) => c.id === custCategoryId);

    try {
      const res = await addCustomer({
        code,
        name: custName.trim(),
        phone: custPhone.trim(),
        channel: custChannel,
        customerType: custType,
        district: custDistrict,
        address: custAddress.trim() || undefined,
        territory: `${custDistrict} Commercial`,
        creditLimitBDT: Number(creditLimitBDT) || 0,
        pricingTier: custPricingTier,
        customerCategoryId: cat ? cat.id : undefined,
        customerCategoryName: cat ? cat.name : undefined,
        assignedDistributorId: custChannel === 'Distributor Sales' ? dist?.id : undefined,
        assignedDistributorName: custChannel === 'Distributor Sales' ? dist?.name : undefined,
        marketHierarchy: custChannel === 'Distributor Sales' ? dist?.marketHierarchy : undefined,
        assignedSalespersonId: 'u-2',
        assignedSalespersonName: 'Tanvir Hossain',
        status: 'Active',
      });

      if (res && res.error) {
        setToastMessage({ text: `Customer onboarded locally (${res.error})`, type: 'warning' });
      } else {
        setToastMessage({ text: `Customer "${custName}" created and synced to Supabase!`, type: 'success' });
      }

      setShowAddCustomerModal(false);
      setCustName('');
      setCustPhone('');
      setCustAddress('');
      setCreditLimitBDT(0);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage({ text: err?.message || 'Failed to create customer', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.district && c.district.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesChannel =
      selectedChannelFilter === 'all' ||
      (selectedChannelFilter === 'direct' && c.channel === 'Direct Sales') ||
      (selectedChannelFilter === 'distributor' && c.channel === 'Distributor Sales');

    return matchesSearch && matchesChannel;
  });

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstandingBalanceBDT || 0), 0);
  const totalCreditLimit = customers.reduce((sum, c) => sum + (c.creditLimitBDT || 0), 0);
  const corporateCount = customers.filter((c) => c.customerType === 'Corporate Customer').length;
  const projectCount = customers.filter((c) => c.customerType === 'Project Customer').length;
  const dealerRetailerCount = customers.filter(
    (c) => c.customerType === 'Dealer' || c.customerType === 'Retailer' || c.customerType === 'Workshop'
  ).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-3 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <span>Basic Data Master</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">Customer Directory</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Customer Directory</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Refresh customer records from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Database'}</span>
          </button>

          {onNavigateToPricingMatrix && (
            <button
              onClick={onNavigateToPricingMatrix}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors shadow-2xs"
            >
              <DollarSign className="w-4 h-4" />
              <span>Channel Pricing Matrix</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => {
              setCustName('');
              setCustPhone('');
              setCustAddress('');
              setCreditLimitBDT(0);
              setShowAddCustomerModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Customers</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {customers.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{corporateCount} Corporate</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{projectCount} Project</span>
            <span>•</span>
            <span>{dealerRetailerCount} Trade</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Channel Distribution</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {customers.filter((c) => c.channel === 'Direct Sales').length} Direct /{' '}
            {customers.filter((c) => c.channel === 'Distributor Sales').length} DB
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Channel A (Distributor Point) vs Channel B (Direct B2B)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Credit Limit</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
            ৳ {(totalCreditLimit / 100000).toFixed(1)}L
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Aggregate approved credit exposure across all accounts
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Outstanding</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 font-mono">
            ৳ {(totalOutstanding / 100000).toFixed(2)}L
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {totalCreditLimit > 0
              ? `${Math.round((totalOutstanding / totalCreditLimit) * 100)}% credit utilization`
              : '0% credit utilization'}
          </div>
        </div>
      </div>

      {/* Customer Master Table Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Customer Master Directory List</h2>
            <div className="flex items-center gap-3 text-xs mt-1">
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                ● Channel A: Distributor Routed
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                ● Channel B: Direct Corporate
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
              <button
                onClick={() => setSelectedChannelFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedChannelFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All ({customers.length})
              </button>
              <button
                onClick={() => setSelectedChannelFilter('direct')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedChannelFilter === 'direct'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Direct Sales
              </button>
              <button
                onClick={() => setSelectedChannelFilter('distributor')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedChannelFilter === 'distributor'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Distributor
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, code, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Customer Code</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Sales Channel</th>
                <th className="p-3">Tagged Distributor</th>
                <th className="p-3">Customer Type</th>
                <th className="p-3">Assigned Price Tier</th>
                <th className="p-3">Contract Overrides</th>
                <th className="p-3 text-right">Credit Limit</th>
                <th className="p-3 text-right">Outstanding BDT</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    No customers match the current filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const pricing = getCustomerProductPricing(cust, products[0]);
                  const customOverridesCount = cust.customProductPrices
                    ? Object.keys(cust.customProductPrices).length
                    : 0;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {cust.code}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{cust.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span>{cust.phone}</span>
                          {cust.district && <span>• {cust.district}</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cust.channel === 'Direct Sales'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {cust.channel}
                        </span>
                      </td>
                      <td className="p-3">
                        {cust.assignedDistributorName ? (
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white block">
                                {cust.assignedDistributorName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {cust.assignedDistributorId}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Direct / Unassigned
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{cust.customerType}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 block w-fit mb-0.5">
                          {cust.pricingTier || pricing.tierName}
                        </span>
                        {cust.customerCategoryName && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block truncate" title={cust.customerCategoryName}>
                            🏷️ {cust.customerCategoryName}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {customOverridesCount > 0 ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>{customOverridesCount} Contracted Rate(s)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Standard Channel Tier</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-right text-slate-600 dark:text-slate-400">
                        ৳ {cust.creditLimitBDT.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-right font-bold text-amber-600 dark:text-amber-400">
                        ৳ {cust.outstandingBalanceBDT.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditCustomerModal(cust)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shadow-2xs"
                            title="Edit customer details & tag distributor"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit & Tag</span>
                          </button>
                          <button
                            onClick={() => openOverrideModal(cust)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors shadow-2xs"
                          >
                            Price Override
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

      {/* Modal: Set Custom Negotiated Price */}
      {overrideCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Special Agreement Price Override
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">
                  Customer: {overrideCustomer.name} ({overrideCustomer.code})
                </span>
              </div>
              <button
                onClick={() => setOverrideCustomer(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomPrice} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Finished Battery Model
                </label>
                <select
                  value={overrideProductId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setOverrideProductId(pid);
                    const prod = products.find((p) => p.id === pid);
                    if (prod) {
                      const pricing = getCustomerProductPricing(overrideCustomer, prod);
                      setOverridePriceBDT(pricing.unitPrice);
                    }
                  }}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Contracted Special Price (BDT)
                </label>
                <input
                  type="number"
                  value={overridePriceBDT}
                  onChange={(e) => setOverridePriceBDT(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-base text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-200">
                This custom negotiated price will automatically apply whenever this customer creates a sales order or when field reps book orders for them.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideCustomer(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs"
                >
                  Save Contracted Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Customer */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Contact2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Register Customer</h3>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Customer / Company Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grameenphone Tower Cell"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Mobile / Phone
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+880 1819-..."
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Sales Channel
                  </label>
                  <select
                    value={custChannel}
                    onChange={(e) => {
                      const ch = e.target.value as any;
                      setCustChannel(ch);
                      if (ch === 'Distributor Sales') setCustPricingTier('Distributor Channel');
                      else setCustPricingTier('Corporate Channel');
                    }}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Direct Sales">Channel B: Direct Sales</option>
                    <option value="Distributor Sales">Channel A: Distributor Sales</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Customer Type
                  </label>
                  <select
                    value={custType}
                    onChange={(e) => setCustType(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Corporate Customer">Corporate Customer</option>
                    <option value="Project Customer">Project Customer</option>
                    <option value="Dealer">Dealer</option>
                    <option value="Retailer">Retailer</option>
                    <option value="Workshop">Workshop</option>
                    <option value="End Customer">End Customer</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Channel Price Tier
                  </label>
                  <select
                    value={custPricingTier}
                    onChange={(e) => setCustPricingTier(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-purple-600 dark:text-purple-400"
                  >
                    <option value="Corporate Channel">Corporate Channel Tier</option>
                    <option value="Distributor Channel">Distributor Channel Tier</option>
                    <option value="Dealer / Retailer Channel">Dealer / Retailer Tier</option>
                    <option value="Project / Tender Channel">Project / Tender Tier</option>
                    <option value="Retail MRP Channel">Retail MRP Tier</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Customer Category (Pricing Group)
                </label>
                <select
                  value={custCategoryId}
                  onChange={(e) => setCustCategoryId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 font-semibold text-purple-700 dark:text-purple-300"
                >
                  <option value="">None (Use Standard Channel Rate)</option>
                  {customerCategories
                    .filter((c) => c.targetAudience === 'Customer' || c.targetAudience === 'Both')
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.code})
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Category product rates configured in Finished Products will automatically apply to this customer.
                </span>
              </div>

              {custChannel === 'Distributor Sales' && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Assigned Distributor (DB Point)
                  </label>
                  <select
                    value={assignedDistId}
                    onChange={(e) => setAssignedDistId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="">Select Distributor...</option>
                    {distributors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.district})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={custDistrict}
                    onChange={(e) => setCustDistrict(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Credit Limit (BDT)
                  </label>
                  <input
                    type="number"
                    value={creditLimitBDT}
                    onChange={(e) => setCreditLimitBDT(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Street Address
                </label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Customer & Tag Distributor */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Edit Customer & Tag Distributor
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-slate-400 font-mono text-[10px]">
                  <span>Code: {editingCustomer.code}</span>
                  <span>•</span>
                  <span>ID: {editingCustomer.id}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Customer / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCustName}
                    onChange={(e) => setEditCustName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Mobile / Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCustPhone}
                    onChange={(e) => setEditCustPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. accounts@client.com"
                    value={editCustEmail}
                    onChange={(e) => setEditCustEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={editCustDistrict}
                    onChange={(e) => setEditCustDistrict(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Tag Distributor & Channel Assignment Box */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Distributor Tagging & Sales Channel Routing</span>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                    Supply Route
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Sales Channel
                    </label>
                    <select
                      value={editCustChannel}
                      onChange={(e) => {
                        const ch = e.target.value as 'Direct Sales' | 'Distributor Sales';
                        setEditCustChannel(ch);
                        if (ch === 'Distributor Sales' && editCustPricingTier === 'Corporate Channel') {
                          setEditCustPricingTier('Distributor Channel');
                        }
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="Direct Sales">Channel B: Direct Sales (Head Office)</option>
                      <option value="Distributor Sales">Channel A: Distributor Sales (DB Point)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Tag Regional Distributor (DB Point)
                    </label>
                    <select
                      value={editAssignedDistId}
                      onChange={(e) => setEditAssignedDistId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="">None (Direct Customer / No DB Tagged)</option>
                      {distributors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.district} • {d.dbPoint})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Distributor Info Preview */}
                {editAssignedDistId && (
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-[11px] space-y-1">
                    {(() => {
                      const d = distributors.find((x) => x.id === editAssignedDistId);
                      if (!d) return null;
                      return (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            🏪 {d.name} ({d.code})
                          </span>
                          <span className="text-slate-500">
                            DB Point: <b className="text-blue-600 dark:text-blue-400">{d.dbPoint}</b> • Territory: {d.territory} • {d.district}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Customer Classification Type
                  </label>
                  <select
                    value={editCustType}
                    onChange={(e) => setEditCustType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Corporate Customer">Corporate Customer</option>
                    <option value="Project Customer">Project Customer</option>
                    <option value="Dealer">Dealer</option>
                    <option value="Retailer">Retailer</option>
                    <option value="Workshop">Workshop</option>
                    <option value="End Customer">End Customer</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Applicable Pricing Tier
                  </label>
                  <select
                    value={editCustPricingTier}
                    onChange={(e) => setEditCustPricingTier(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-purple-600 dark:text-purple-400"
                  >
                    <option value="Corporate Channel">Corporate Channel Tier</option>
                    <option value="Distributor Channel">Distributor Channel Tier</option>
                    <option value="Dealer / Retailer Channel">Dealer / Retailer Tier</option>
                    <option value="Project / Tender Channel">Project / Tender Tier</option>
                    <option value="Retail MRP Channel">Retail MRP Tier</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Customer Category (Pricing Group)
                </label>
                <select
                  value={editCustCategoryId}
                  onChange={(e) => setEditCustCategoryId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 font-semibold text-purple-700 dark:text-purple-300"
                >
                  <option value="">None (Standard Channel Pricing)</option>
                  {customerCategories
                    .filter((c) => c.targetAudience === 'Customer' || c.targetAudience === 'Both')
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.code})
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Category product rates configured in Finished Products will automatically apply to this customer.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Approved Credit Limit (BDT)
                  </label>
                  <input
                    type="number"
                    value={editCreditLimitBDT}
                    onChange={(e) => setEditCreditLimitBDT(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Account Status
                  </label>
                  <select
                    value={editCustStatus}
                    onChange={(e) => setEditCustStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Street Address
                </label>
                <input
                  type="text"
                  value={editCustAddress}
                  onChange={(e) => setEditCustAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Save Changes & Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
