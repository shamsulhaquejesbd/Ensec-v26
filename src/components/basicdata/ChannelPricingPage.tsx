import React, { useState, useMemo } from 'react';
import {
  Tag,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Users2,
  Contact2,
  Building,
  Package,
  DollarSign,
  TrendingUp,
  Percent,
  Sliders,
  Sparkles,
  ArrowRight,
  Info,
  Check,
  X,
  Layers,
  ChevronRight,
  Briefcase,
  Store,
  ExternalLink,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { CustomerCategory, Product, Customer, Distributor } from '../../types/erp.ts';

export interface ChannelPricingPageProps {
  initialTab?: 'categories' | 'matrix' | 'simulator';
  onNavigateToProducts?: () => void;
  onNavigateToCustomers?: () => void;
  onNavigateToDistributors?: () => void;
}

export const ChannelPricingPage: React.FC<ChannelPricingPageProps> = ({
  initialTab = 'categories',
  onNavigateToProducts,
  onNavigateToCustomers,
  onNavigateToDistributors,
}) => {
  const {
    customerCategories,
    addCustomerCategory,
    updateCustomerCategory,
    deleteCustomerCategory,
    products,
    customers,
    distributors,
    setProductCategoryPrice,
    updateCustomer,
    updateDistributor,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'categories' | 'matrix' | 'simulator'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<'ALL' | 'Distributor' | 'Customer' | 'Both'>('ALL');

  // Modals for Customer Categories
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomerCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CustomerCategory | null>(null);

  // Form State for Category Create/Edit
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTargetAudience, setFormTargetAudience] = useState<'Distributor' | 'Customer' | 'Both'>('Customer');
  const [formDiscount, setFormDiscount] = useState<number>(0);
  const [formMarkup, setFormMarkup] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');

  // Modal: Quick Set Category Price for a Product
  const [priceModalProduct, setPriceModalProduct] = useState<Product | null>(null);
  const [priceModalCategory, setPriceModalCategory] = useState<CustomerCategory | null>(null);
  const [priceInputBDT, setPriceInputBDT] = useState<number>(0);

  // Modal: Assign Category to Customers / Distributors
  const [assigningCategory, setAssigningCategory] = useState<CustomerCategory | null>(null);
  const [assignSearch, setAssignSearch] = useState('');

  // Simulator State
  const [simCategoryId, setSimCategoryId] = useState<string>(customerCategories[0]?.id || '');
  const [simProductId, setSimProductId] = useState<string>(products[0]?.id || '');
  const [simQty, setSimQty] = useState<number>(1);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    return customerCategories.filter((cat) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        cat.name.toLowerCase().includes(q) ||
        cat.code.toLowerCase().includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q));
      const matchesAudience = audienceFilter === 'ALL' || cat.targetAudience === audienceFilter || cat.targetAudience === 'Both';
      return matchesSearch && matchesAudience;
    });
  }, [customerCategories, searchTerm, audienceFilter]);

  // Compute live association counts
  const categoryStats = useMemo(() => {
    const stats: {
      [catId: string]: {
        customers: number;
        distributors: number;
        productsPriced: number;
      };
    } = {};

    customerCategories.forEach((cat) => {
      const custCount = customers.filter((c) => c.customerCategoryId === cat.id).length;
      const distCount = distributors.filter((d) => d.customerCategoryId === cat.id).length;
      const pricedCount = products.filter(
        (p) => p.categoryPrices && p.categoryPrices[cat.id] !== undefined
      ).length;
      stats[cat.id] = {
        customers: custCount,
        distributors: distCount,
        productsPriced: pricedCount,
      };
    });
    return stats;
  }, [customerCategories, customers, distributors, products]);

  // Handle open create
  const handleOpenCreate = (prefillTarget?: 'Distributor' | 'Customer') => {
    const nextNum = customerCategories.length + 1;
    setFormCode(`CCAT-${(prefillTarget || 'CUSTOM').toUpperCase().slice(0, 4)}-0${nextNum}`);
    setFormName('');
    setFormDescription('');
    setFormTargetAudience(prefillTarget || 'Customer');
    setFormDiscount(0);
    setFormMarkup(0);
    setFormStatus('Active');
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCode) return;

    addCustomerCategory({
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      description: formDescription.trim(),
      targetAudience: formTargetAudience,
      discountPercentage: Number(formDiscount) || 0,
      priceMarkupPercentage: Number(formMarkup) || 0,
      status: formStatus,
    });

    setShowCreateModal(false);
  };

  const handleOpenEdit = (cat: CustomerCategory) => {
    setEditingCategory(cat);
    setFormCode(cat.code || '');
    setFormName(cat.name || '');
    setFormDescription(cat.description || '');
    setFormTargetAudience((cat.targetAudience as any) || 'Customer');
    setFormDiscount(cat.discountPercentage ?? 10);
    setFormMarkup(cat.priceMarkupPercentage ?? 5);
    setFormStatus((cat.status as any) || 'Active');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !formName) return;

    updateCustomerCategory(editingCategory.id, {
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      description: formDescription.trim(),
      targetAudience: formTargetAudience,
      discountPercentage: Number(formDiscount) || 0,
      priceMarkupPercentage: Number(formMarkup) || 0,
      status: formStatus,
    });

    setEditingCategory(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingCategory) return;
    deleteCustomerCategory(deletingCategory.id);
    setDeletingCategory(null);
  };

  // Open modal to configure price for specific product & category
  const openProductPriceModal = (prod: Product, cat: CustomerCategory) => {
    setPriceModalProduct(prod);
    setPriceModalCategory(cat);
    const existingPrice = prod.categoryPrices?.[cat.id];
    if (existingPrice) {
      setPriceInputBDT(existingPrice);
    } else {
      // Suggest intelligent default based on category type or product base rates
      if (cat.targetAudience === 'Distributor') {
        setPriceInputBDT(prod.distributorPriceBDT);
      } else if (cat.code.includes('DEALER')) {
        setPriceInputBDT(prod.dealerPriceBDT || Math.round(prod.distributorPriceBDT * 1.05));
      } else if (cat.code.includes('CORP')) {
        setPriceInputBDT(prod.corporatePriceBDT || Math.round(prod.distributorPriceBDT * 1.06));
      } else if (cat.code.includes('PRJ')) {
        setPriceInputBDT(prod.projectPriceBDT || Math.round(prod.distributorPriceBDT * 1.03));
      } else {
        const mrp = prod.retailPriceBDT || 120000;
        const discount = cat.discountPercentage || 0;
        setPriceInputBDT(Math.round(mrp * (1 - discount / 100)));
      }
    }
  };

  const handleSaveProductPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModalProduct || !priceModalCategory) return;
    setProductCategoryPrice(priceModalProduct.id, priceModalCategory.id, Number(priceInputBDT));
    setPriceModalProduct(null);
    setPriceModalCategory(null);
  };

  // Quick toggle assignment to customer
  const toggleCustomerCategoryAssignment = (customer: Customer, catId: string) => {
    const isAssigned = customer.customerCategoryId === catId;
    const cat = customerCategories.find((c) => c.id === catId);
    updateCustomer(customer.id, {
      customerCategoryId: isAssigned ? undefined : catId,
      customerCategoryName: isAssigned ? undefined : cat?.name,
    });
  };

  // Quick toggle assignment to distributor
  const toggleDistributorCategoryAssignment = (dist: Distributor, catId: string) => {
    const isAssigned = dist.customerCategoryId === catId;
    const cat = customerCategories.find((c) => c.id === catId);
    updateDistributor(dist.id, {
      customerCategoryId: isAssigned ? undefined : catId,
      customerCategoryName: isAssigned ? undefined : cat?.name,
    });
  };

  // Live simulation calculations
  const simCategory = customerCategories.find((c) => c.id === simCategoryId) || customerCategories[0];
  const simProduct = products.find((p) => p.id === simProductId) || products[0];
  const simCategoryPrice =
    simProduct?.categoryPrices?.[simCategory?.id] ||
    (simCategory?.targetAudience === 'Distributor'
      ? (simProduct?.distributorPriceBDT || 0)
      : (simProduct?.dealerPriceBDT || (simProduct?.distributorPriceBDT ? simProduct.distributorPriceBDT * 1.05 : 0)));
  const simRetailMRP = simProduct?.retailPriceBDT || 0;
  const simUnitSavings = Math.max(0, simRetailMRP - simCategoryPrice);
  const simTotalAmount = simCategoryPrice * (simQty || 0);
  const simTotalSavings = simUnitSavings * (simQty || 0);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & BREADCRUMBS                                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <span>Basic Data Master</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-bold">Channel Pricing & Customer Categories</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Customer Categories & Channel Pricing
            </h1>
            
          </div>
          
        </div>

        {/* Action Controls & Top Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Action Buttons */}
          <button
            onClick={() => handleOpenCreate('Customer')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Customer Category</span>
          </button>

          <button
            onClick={() => handleOpenCreate('Distributor')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-sm"
          >
            <Store className="w-4 h-4" />
            <span>+ Distributor Category</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAB CONTROLS & SUB-NAV                                                 */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 text-xs">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Categories Registry ({customerCategories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'matrix'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Product Pricing Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'simulator'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Price Simulator</span>
          </button>
        </div>

        {/* Quick Links across Basic Data */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Linked Basic Data:</span>
          {onNavigateToProducts && (
            <button
              onClick={onNavigateToProducts}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1"
            >
              <Package className="w-3.5 h-3.5 text-blue-500" />
              <span>Finished Products</span>
            </button>
          )}
          {onNavigateToCustomers && (
            <button
              onClick={onNavigateToCustomers}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1"
            >
              <Contact2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Customers</span>
            </button>
          )}
          {onNavigateToDistributors && (
            <button
              onClick={onNavigateToDistributors}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1"
            >
              <Users2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Distributors</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CUSTOMER CATEGORIES REGISTRY                                       */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Total Categories</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {customerCategories.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-emerald-600 font-semibold">
                  {customerCategories.filter((c) => c.status === 'Active').length} Active
                </span>
                <span>•</span>
                <span>{customerCategories.filter((c) => c.targetAudience === 'Distributor').length} Distributor Tier</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Tagged Customers</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Contact2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {customers.filter((c) => c.customerCategoryId).length} / {customers.length}
              </div>
              
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Tagged Distributors</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Store className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {distributors.filter((d) => d.customerCategoryId).length} / {distributors.length}
              </div>
              
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Finished Products</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {products.length} Models
              </div>
              
            </div>
          </div>

      

          {/* Search, Filter & Categories Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Customer Category List
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  {filteredCategories.length} Categories
                </span>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
                  <button
                    onClick={() => setAudienceFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      audienceFilter === 'ALL'
                        ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setAudienceFilter('Customer')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      audienceFilter === 'Customer'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Customers
                  </button>
                  <button
                    onClick={() => setAudienceFilter('Distributor')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      audienceFilter === 'Distributor'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Distributors
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-48 sm:w-60 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Category Code</th>
                    <th className="p-3">Category Name & Description</th>
                    <th className="p-3">Target Scope</th>
                    <th className="p-3 text-right">Default Discount</th>
                    <th className="p-3 text-center">Tagged Accounts</th>
                    <th className="p-3 text-center">Priced SKUs</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No customer categories found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => {
                      const stat = categoryStats[cat.id] || { customers: 0, distributors: 0, productsPriced: 0 };
                      const isDistributorAudience = cat.targetAudience === 'Distributor';

                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3">
                            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                              {cat.code}
                            </span>
                          </td>
                          <td className="p-3 max-w-xs">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {cat.name}
                              {isDistributorAudience && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">
                                  Distributor Tier
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                              {cat.description || 'No description provided.'}
                            </p>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                isDistributorAudience
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : cat.targetAudience === 'Both'
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              }`}
                            >
                              {cat.targetAudience || 'Customer'} Scope
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="font-mono font-bold text-slate-900 dark:text-white">
                              {cat.discountPercentage ?? 10}% Off MRP
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              +{cat.priceMarkupPercentage ?? 5}% Base Markup
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setAssigningCategory(cat)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors inline-flex items-center gap-1"
                              title="Assign to customers or distributors"
                            >
                              {isDistributorAudience ? (
                                <>
                                  <Store className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{stat.distributors} Distributors</span>
                                </>
                              ) : (
                                <>
                                  <Contact2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>{stat.customers} Clients</span>
                                  {stat.distributors > 0 && <span>&bull; {stat.distributors} DB</span>}
                                </>
                              )}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {stat.productsPriced} / {products.length} SKUs
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cat.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {cat.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(cat)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
                                title="Edit category"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingCategory(cat)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                                title="Delete category"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PRODUCT PRICING MATRIX BY CUSTOMER CATEGORY                        */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Product Price Matrix Across All Customer Categories
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure specific unit selling prices (BDT) for each battery SKU according to customer categories. These prices apply in Finished Products &amp; Sales Orders.
                </p>
              </div>

              {onNavigateToProducts && (
                <button
                  onClick={onNavigateToProducts}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Open Finished Products Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Battery SKU & Model</th>
                    <th className="p-3 text-right">Retail MRP</th>
                    {customerCategories.map((cat) => (
                      <th key={cat.id} className="p-3 text-right">
                        <span className="block font-bold text-slate-900 dark:text-white">
                          {cat.name.length > 25 ? `${cat.name.slice(0, 25)}...` : cat.name}
                        </span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                          {cat.code}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-sans">
                        <div className="font-bold text-slate-900 dark:text-white">{prod.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{prod.code} &bull; {prod.model}</div>
                      </td>
                      <td className="p-3 text-right font-black text-slate-900 dark:text-white">
                        ৳ {(prod.retailPriceBDT || prod.customerPriceBDT).toLocaleString()}
                      </td>
                      {customerCategories.map((cat) => {
                        const price = prod.categoryPrices?.[cat.id];
                        const hasExplicitPrice = price !== undefined;
                        const displayPrice = hasExplicitPrice
                          ? price
                          : cat.targetAudience === 'Distributor'
                          ? prod.distributorPriceBDT
                          : cat.code.includes('DEALER')
                          ? prod.dealerPriceBDT || Math.round(prod.distributorPriceBDT * 1.05)
                          : cat.code.includes('CORP')
                          ? prod.corporatePriceBDT || Math.round(prod.distributorPriceBDT * 1.06)
                          : prod.retailPriceBDT;

                        return (
                          <td key={cat.id} className="p-3 text-right font-sans">
                            <button
                              onClick={() => openProductPriceModal(prod, cat)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all text-right ${
                                hasExplicitPrice
                                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                              }`}
                              title="Click to edit category price for this SKU"
                            >
                              ৳ {displayPrice.toLocaleString()}
                              {hasExplicitPrice && <span className="ml-1 text-[10px] text-emerald-500">✓</span>}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LIVE PRICE SIMULATOR                                              */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sliders className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Simulation Parameters
              </h2>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Category
                </label>
                <select
                  value={simCategoryId}
                  onChange={(e) => setSimCategoryId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  {customerCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Battery Product SKU
                </label>
                <select
                  value={simProductId}
                  onChange={(e) => setSimProductId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Order Quantity (Units)
                </label>
                <input
                  type="number"
                  min={1}
                  value={simQty}
                  onChange={(e) => setSimQty(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Resolved Quotation & Profitability Analysis
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-lg">
                Tier: {simCategory?.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">
                  Applicable Unit Rate
                </span>
                <span className="text-xl font-black font-mono text-purple-900 dark:text-purple-100 mt-1 block">
                  ৳ {simCategoryPrice.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500">Per unit selling rate</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">
                  Total Order Value ({simQty} Units)
                </span>
                <span className="text-xl font-black font-mono text-emerald-900 dark:text-emerald-100 mt-1 block">
                  ৳ {simTotalAmount.toLocaleString()}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold">Total invoice amount</span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">
                  Client Savings vs MRP
                </span>
                <span className="text-xl font-black font-mono text-amber-900 dark:text-amber-100 mt-1 block">
                  ৳ {simTotalSavings.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500">Savings from standard MRP</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-500" />
                <span>How This Category Price Resolves in Invoicing:</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                When an order booker or sales executive selects any customer or distributor with category &quot;<b>{simCategory?.name}</b>&quot;, the system resolves unit prices via <code>product.categoryPrices[{simCategory?.id}]</code>. If an individual customer has a negotiated contract override, that contract takes precedence.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE CUSTOMER CATEGORY                                        */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Create Customer Category
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nationwide Authorized Distributor Tier"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Scope *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTargetAudience('Customer')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      formTargetAudience === 'Customer'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Customers Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTargetAudience('Distributor')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      formTargetAudience === 'Distributor'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Distributors Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTargetAudience('Both')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      formTargetAudience === 'Both'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Both
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Terms, minimum volume, or channel qualifications..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Base Discount (%)
                  </label>
                  <input
                    type="number"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Cost Markup (%)
                  </label>
                  <input
                    type="number"
                    value={formMarkup}
                    onChange={(e) => setFormMarkup(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT CUSTOMER CATEGORY                                          */}
      {/* ========================================================================= */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Edit Category: {editingCategory.code}
                </h3>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Scope *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTargetAudience('Customer')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      formTargetAudience === 'Customer'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Customers Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTargetAudience('Distributor')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      formTargetAudience === 'Distributor'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Distributors Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTargetAudience('Both')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      formTargetAudience === 'Both'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Both
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Base Discount (%)
                  </label>
                  <input
                    type="number"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Cost Markup (%)
                  </label>
                  <input
                    type="number"
                    value={formMarkup}
                    onChange={(e) => setFormMarkup(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Update Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE CATEGORY CONFIRMATION                                    */}
      {/* ========================================================================= */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
              <Trash2 className="w-5 h-5" />
              <span>Delete Customer Category?</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <b>{deletingCategory.name}</b> ({deletingCategory.code})? Any assigned customers, distributors, and custom product category prices will be detached.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SET CATEGORY PRICE FOR PRODUCT                                   */}
      {/* ========================================================================= */}
      {priceModalProduct && priceModalCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Set Category Price (BDT)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {priceModalProduct.name} ({priceModalProduct.model})
                </p>
              </div>
              <button
                onClick={() => {
                  setPriceModalProduct(null);
                  setPriceModalCategory(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductPrice} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Target Category</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {priceModalCategory.name}
                </div>
                <div className="text-[11px] text-purple-600 dark:text-purple-400 font-mono font-semibold">
                  {priceModalCategory.code} &bull; Scope: {priceModalCategory.targetAudience}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Unit Price in BDT (৳) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    required
                    value={priceInputBDT}
                    onChange={(e) => setPriceInputBDT(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-black text-base text-purple-600 dark:text-purple-400"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Standard MRP: ৳ {priceModalProduct.retailPriceBDT.toLocaleString()}</span>
                  <span>Distributor Base: ৳ {priceModalProduct.distributorPriceBDT.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setPriceModalProduct(null);
                    setPriceModalCategory(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs"
                >
                  Save Category Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: QUICK ASSIGN CATEGORY TO CUSTOMERS & DISTRIBUTORS                */}
      {/* ========================================================================= */}
      {assigningCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-600" />
                  <span>Assign Accounts to &quot;{assigningCategory.name}&quot;</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enroll customers or distributors to receive this category&apos;s product prices.
                </p>
              </div>
              <button
                onClick={() => setAssigningCategory(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search accounts by name, code or city..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
              {/* Distributor section if targetAudience matches */}
              {(assigningCategory.targetAudience === 'Distributor' || assigningCategory.targetAudience === 'Both') && (
                <div className="space-y-2 pt-2">
                  <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Store className="w-3.5 h-3.5" />
                    <span>Nationwide Distributors ({distributors.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {distributors
                      .filter((d) =>
                        !assignSearch ||
                        d.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
                        d.code.toLowerCase().includes(assignSearch.toLowerCase())
                      )
                      .map((d) => {
                        const isAssigned = d.customerCategoryId === assigningCategory.id;
                        return (
                          <div
                            key={d.id}
                            onClick={() => toggleDistributorCategoryAssignment(d, assigningCategory.id)}
                            className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                              isAssigned
                                ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100'
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{d.name}</span>
                                <span className="font-mono text-[10px] text-slate-400">({d.code})</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {d.district} &bull; {d.marketHierarchy || d.territory}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isAssigned ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
                                  Enrolled
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700">
                                  Click to Enroll
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Customer section */}
              {(assigningCategory.targetAudience === 'Customer' || assigningCategory.targetAudience === 'Both') && (
                <div className="space-y-2 pt-2">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Contact2 className="w-3.5 h-3.5" />
                    <span>Customer Master Directory ({customers.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {customers
                      .filter((c) =>
                        !assignSearch ||
                        c.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
                        c.code.toLowerCase().includes(assignSearch.toLowerCase())
                      )
                      .map((c) => {
                        const isAssigned = c.customerCategoryId === assigningCategory.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleCustomerCategoryAssignment(c, assigningCategory.id)}
                            className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                              isAssigned
                                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100'
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{c.name}</span>
                                <span className="font-mono text-[10px] text-slate-400">({c.code})</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {c.channel} &bull; {c.customerType} &bull; {c.district}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isAssigned ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                                  Enrolled
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700">
                                  Click to Enroll
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setAssigningCategory(null)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
