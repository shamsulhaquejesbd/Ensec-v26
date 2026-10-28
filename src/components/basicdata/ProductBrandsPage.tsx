import React, { useState } from 'react';
import {
  Award,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Check,
  Package,
  Sparkles,
  Tag,
  X,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { ProductBrand } from '../../types/erp.ts';

export const ProductBrandsPage: React.FC = () => {
  const {
    products,
    brands,
    categories,
    addBrand,
    updateBrand,
    deleteBrand,
  } = useERP();

  // Search & Filter
  const [brandSearch, setBrandSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Modals for Brands
  const [showCreateBrandModal, setShowCreateBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<ProductBrand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<ProductBrand | null>(null);

  // Create Form State
  const [brandName, setBrandName] = useState('');
  const [brandCode, setBrandCode] = useState('');
  const [brandOrigin, setBrandOrigin] = useState('Bangladesh (Kushtia Assembly Plant)');
  const [brandTagline, setBrandTagline] = useState('');
  const [brandStatus, setBrandStatus] = useState<'Active' | 'Inactive'>('Active');
  const [selectedCategoryTags, setSelectedCategoryTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');

  // Edit Form State
  const [editCategoryTags, setEditCategoryTags] = useState<string[]>([]);
  const [editCustomTagInput, setEditCustomTagInput] = useState('');

  // UI Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Available unique categories strictly from Categories master, completely excluding 'Telecom Energy Storage' test data
  const availableCategoriesList: string[] = Array.from(
    new Set(
      categories
        .map((c) => (c.name || '').trim())
        .filter(
          (name) =>
            Boolean(name) &&
            name.toLowerCase() !== 'telecom energy storage'
        )
    )
  );

  // Clean brand categories helper
  const getCleanCategoryTags = (brand: ProductBrand): string[] => {
    const raw = brand.categories || brand.categoryTags || [];
    return raw.filter((t) => t.trim().toLowerCase() !== 'telecom energy storage');
  };

  // Filtered Brands
  const filteredBrands = brands.filter((b) => {
    const q = brandSearch.toLowerCase();
    const brandCatTags = getCleanCategoryTags(b);
    const matchesSearch =
      (b.name || '').toLowerCase().includes(q) ||
      (b.code || '').toLowerCase().includes(q) ||
      (b.origin || '').toLowerCase().includes(q) ||
      (b.tagline || '').toLowerCase().includes(q) ||
      brandCatTags.some((cat) => cat.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategoryFilter === 'All' ||
      brandCatTags.includes(selectedCategoryFilter) ||
      products.some((p) => p.brand === b.name && p.category === selectedCategoryFilter);

    return matchesSearch && matchesCategory;
  });

  const handleOpenCreateBrand = () => {
    setBrandCode(`BRD-0${brands.length + 1}`);
    setBrandName('');
    setBrandOrigin('Bangladesh (Kushtia Assembly Plant)');
    setBrandTagline('');
    setBrandStatus('Active');
    setSelectedCategoryTags([]);
    setCustomTagInput('');
    setModalError(null);
    setShowCreateBrandModal(true);
  };

  const toggleCategoryTag = (catName: string) => {
    if (selectedCategoryTags.includes(catName)) {
      setSelectedCategoryTags(selectedCategoryTags.filter((t) => t !== catName));
    } else {
      setSelectedCategoryTags([...selectedCategoryTags, catName]);
    }
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customTagInput.trim();
    if (!trimmed || trimmed.toLowerCase() === 'telecom energy storage') return;
    if (!selectedCategoryTags.includes(trimmed)) {
      setSelectedCategoryTags([...selectedCategoryTags, trimmed]);
    }
    setCustomTagInput('');
  };

  const handleRemoveCategoryTag = (catName: string) => {
    setSelectedCategoryTags(selectedCategoryTags.filter((t) => t !== catName));
  };

  const toggleEditCategoryTag = (catName: string) => {
    if (editCategoryTags.includes(catName)) {
      setEditCategoryTags(editCategoryTags.filter((t) => t !== catName));
    } else {
      setEditCategoryTags([...editCategoryTags, catName]);
    }
  };

  const handleAddEditCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editCustomTagInput.trim();
    if (!trimmed || trimmed.toLowerCase() === 'telecom energy storage') return;
    if (!editCategoryTags.includes(trimmed)) {
      setEditCategoryTags([...editCategoryTags, trimmed]);
    }
    setEditCustomTagInput('');
  };

  const handleRemoveEditCategoryTag = (catName: string) => {
    setEditCategoryTags(editCategoryTags.filter((t) => t !== catName));
  };

  const handleCreateBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !brandCode.trim()) return;
    setIsSubmitting(true);
    setModalError(null);

    const cleanTags = selectedCategoryTags.filter((t) => t.trim().toLowerCase() !== 'telecom energy storage');

    try {
      const res = await addBrand({
        code: brandCode.trim().toUpperCase(),
        name: brandName.trim(),
        origin: brandOrigin.trim(),
        tagline: brandTagline.trim(),
        status: brandStatus,
        categories: cleanTags,
        categoryTags: cleanTags,
      });

      if (res && res.error) {
        setToastMessage({
          text: `Brand created locally (${res.error})`,
          type: 'warning',
        });
      } else {
        setToastMessage({
          text: `Product brand "${brandName.trim()}" created successfully!`,
          type: 'success',
        });
      }

      setShowCreateBrandModal(false);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to create brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditBrand = (brand: ProductBrand) => {
    setEditingBrand(brand);
    setEditCategoryTags(getCleanCategoryTags(brand));
    setEditCustomTagInput('');
  };

  const handleUpdateBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editingBrand.name?.trim() || !editingBrand.code?.trim()) return;
    setIsSubmitting(true);

    const cleanTags = editCategoryTags.filter((t) => t.trim().toLowerCase() !== 'telecom energy storage');

    try {
      await updateBrand(editingBrand.id, {
        code: editingBrand.code.trim().toUpperCase(),
        name: editingBrand.name.trim(),
        origin: editingBrand.origin?.trim() || 'Bangladesh',
        tagline: editingBrand.tagline?.trim() || '',
        status: editingBrand.status,
        categories: cleanTags,
        categoryTags: cleanTags,
      });

      setToastMessage({
        text: `Brand "${editingBrand.name}" updated successfully!`,
        type: 'success',
      });
      setEditingBrand(null);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage({ text: err?.message || 'Failed to update brand', type: 'error' });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!deletingBrand) return;
    try {
      await deleteBrand(deletingBrand.id);
      setToastMessage({
        text: `Brand "${deletingBrand.name}" deleted successfully.`,
        type: 'success',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage({ text: err?.message || 'Failed to delete brand', type: 'error' });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setDeletingBrand(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
            toastMessage.type === 'success'
              ? 'bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-3"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header with Create Brand Option */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Product Brands & Line Identity
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage trademarked battery product brands, market positioning, and category tags
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateBrand}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Product Brand</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Total Brands</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {brands.length} Brands
          </div>
          <div className="text-[11px] text-slate-500">Registered product trademarks</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Active Brands</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {brands.filter((b) => b.status === 'Active').length} Active
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Available for product creation</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Branded SKUs</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {products.length} Products
          </div>
          <div className="text-[11px] text-blue-600 font-medium">Mapped to catalog</div>
        </div>
      </div>

      {/* Main Brands Section */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>Brands Directory</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                {filteredBrands.length} Brands
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateBrand}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Brand</span>
            </button>
          </div>
        </div>

        {/* Brand Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search brands by name, code, origin, tagline, or category tag..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          {availableCategoriesList.length > 0 && (
            <div className="flex items-center gap-1.5 min-w-[200px]">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-white font-medium"
              >
                <option value="All">All Categories ({availableCategoriesList.length})</option>
                {availableCategoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    Category: {cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Grid of Brands */}
        {filteredBrands.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-6">
            <Sparkles className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No product brands found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Your database has 0 matching product brands. Add a new brand using the button below.
            </p>
            <button
              onClick={handleOpenCreateBrand}
              className="mt-4 px-3.5 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Create First Brand</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBrands.map((brand) => {
              const brandCatTags = getCleanCategoryTags(brand);
              const brandProducts = products.filter((p) => p.brand === brand.name);

              return (
                <div
                  key={brand.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">
                          {brand.code}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{brand.name}</h3>
                        <p className="text-[11px] text-slate-500">{brand.origin}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          brand.status === 'Active'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {brand.status}
                      </span>
                    </div>

                    {brand.tagline && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                        &quot;{brand.tagline}&quot;
                      </p>
                    )}

                    {/* Product Category Tags Display */}
                    <div className="pt-1">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        <Tag className="w-3 h-3 text-emerald-500" />
                        <span>Category Segments:</span>
                      </div>
                      {brandCatTags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {brandCatTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            >
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No category tags assigned</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      ⚡ {brandProducts.length} Products Under Brand
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditBrand(brand)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingBrand(brand)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: CREATE BRAND WITH CATEGORY TAG OPTION */}
      {showCreateBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Create New Product Brand
                  </h3>
                  <p className="text-[11px] text-slate-500">Register product line trademark and assign category tags</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateBrandModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBrandSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                      Brand Code *
                    </label>
                    <button
                      type="button"
                      onClick={() => setBrandCode(`BRD-0${brands.length + 1}`)}
                      className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline cursor-pointer font-mono"
                    >
                      Auto
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={brandCode}
                    onChange={(e) => setBrandCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                    placeholder="e.g. BRD-VOLTMAX"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Status
                  </label>
                  <select
                    value={brandStatus}
                    onChange={(e) => setBrandStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Active">Active (Available)</option>
                    <option value="Inactive">Inactive (Archived)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. Ensec VoltMax, Optimum Lithium, SolPack"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Country / Assembly Plant of Origin *
                </label>
                <input
                  type="text"
                  required
                  value={brandOrigin}
                  onChange={(e) => setBrandOrigin(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. Bangladesh (Kushtia Assembly Plant)"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tagline / Brand Promise
                </label>
                <input
                  type="text"
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. High-density LiFePO4 power engineered for tropical reliability"
                />
              </div>

              {/* PRODUCT CATEGORIES TAG OPTION */}
              <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Product Categories Tag Option
                    </label>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    {selectedCategoryTags.length} Tagged
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">
                  Select which product category segments belong to this brand (click to tag / untag):
                </p>

                {/* Available category pills */}
                {availableCategoriesList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                    {availableCategoriesList.map((cat) => {
                      const isSelected = selectedCategoryTags.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategoryTag(cat)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          <span>{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">
                    No categories registered yet in master. Add tags manually below.
                  </div>
                )}

                {/* Custom Category Tag Input */}
                <div className="flex items-center gap-2 pt-1 border-t border-purple-200/60 dark:border-purple-800/40">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    placeholder="Type custom category name & press enter..."
                    className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomTag()}
                    className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs cursor-pointer shrink-0"
                  >
                    + Add Tag
                  </button>
                </div>

                {/* Active Selected Tags Display */}
                {selectedCategoryTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 font-medium">Active Tags:</span>
                    {selectedCategoryTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategoryTag(tag)}
                          className="hover:text-rose-500 cursor-pointer ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateBrandModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating Brand...' : 'Save & Register Brand'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BRAND WITH CATEGORY TAG OPTION */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Edit Product Brand
                  </h3>
                  <p className="text-[11px] text-slate-500">Update brand details and category tag assignments</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBrand(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateBrandSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Brand Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBrand.code}
                    onChange={(e) => setEditingBrand({ ...editingBrand, code: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Status
                  </label>
                  <select
                    value={editingBrand.status}
                    onChange={(e) =>
                      setEditingBrand({
                        ...editingBrand,
                        status: e.target.value as 'Active' | 'Inactive',
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={editingBrand.name}
                  onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Origin / Location
                </label>
                <input
                  type="text"
                  required
                  value={editingBrand.origin}
                  onChange={(e) => setEditingBrand({ ...editingBrand, origin: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={editingBrand.tagline || ''}
                  onChange={(e) => setEditingBrand({ ...editingBrand, tagline: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* PRODUCT CATEGORIES TAG OPTION (EDIT) */}
              <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Product Categories Tag Option
                    </label>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    {editCategoryTags.length} Tagged
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {availableCategoriesList.map((cat) => {
                    const isSelected = editCategoryTags.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleEditCategoryTag(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-purple-200/60 dark:border-purple-800/40">
                  <input
                    type="text"
                    value={editCustomTagInput}
                    onChange={(e) => setEditCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEditCustomTag();
                      }
                    }}
                    placeholder="Type custom category name & press enter..."
                    className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddEditCustomTag()}
                    className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs cursor-pointer shrink-0"
                  >
                    + Add Tag
                  </button>
                </div>

                {editCategoryTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 font-medium">Active Tags:</span>
                    {editCategoryTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEditCategoryTag(tag)}
                          className="hover:text-rose-500 cursor-pointer ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Updating...' : 'Update Brand'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE BRAND */}
      {deletingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Brand</h3>
              <p className="text-slate-500">
                Are you sure you want to delete brand{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{deletingBrand.name}</span>?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBrand(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBrand}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
