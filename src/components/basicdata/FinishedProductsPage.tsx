import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Tag,
  Award,
  PlusCircle,
  Search,
  Filter,
  Edit3,
  Trash2,
  CheckCircle2,
  CheckCircle,
  Shield,
  Zap,
  Battery,
  Box,
  Check,
  AlertCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Info,
  Thermometer,
  Gauge,
  Scale,
  Maximize2,
  Activity,
  Cpu,
  FileText,
  Database,
  RefreshCw,
  Cloud,
  Copy,
  X,
  ExternalLink,
  Server,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { Product, BOMItem } from '../../types/erp.ts';
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testProductsTableConnection,
  checkSupabaseConfigured,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
} from '../../lib/supabase.ts';

export const FinishedProductsPage: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    categories,
    brands,
    rawMaterials,
    customerCategories,
    uoms,
    refreshProducts,
    syncAllProductsToSupabase,
  } = useERP();

  const finishedUOMs = useMemo(() => {
    return uoms.filter((u) => u.isActive && (u.applicableTo === 'Finish Product' || u.applicableTo === 'Both'));
  }, [uoms]);

  // Product Filters & Search
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('ALL');
  const [selectedBatteryTypeFilter, setSelectedBatteryTypeFilter] = useState('ALL');

  // Modals for Products
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [viewingBOMProduct, setViewingBOMProduct] = useState<Product | null>(null);
  const [viewingSpecsProduct, setViewingSpecsProduct] = useState<Product | null>(null);

  // Product Form State
  const [prodCode, setProdCode] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState(categories[0]?.name || '');
  const [prodBrand, setProdBrand] = useState(brands[0]?.name || '');
  const [prodModel, setProdModel] = useState('');
  const [prodBatteryType, setProdBatteryType] = useState<'LiFePO4' | 'NMC' | 'LTO'>('LiFePO4');
  const [prodCapacityAh, setProdCapacityAh] = useState(0);
  const [prodVoltageV, setProdVoltageV] = useState(0);
  const [prodWarrantyMonths, setProdWarrantyMonths] = useState(0);
  const [prodUnit, setProdUnit] = useState('Units');
  const [prodDistributorPrice, setProdDistributorPrice] = useState(0);
  const [prodDealerPrice, setProdDealerPrice] = useState(0);
  const [prodCorporatePrice, setProdCorporatePrice] = useState(0);
  const [prodProjectPrice, setProdProjectPrice] = useState(0);
  const [prodRetailPrice, setProdRetailPrice] = useState(0);
  const [prodAssemblyCost, setProdAssemblyCost] = useState(0);
  const [prodStatus, setProdStatus] = useState<'Active' | 'Discontinued'>('Active');
  const [prodCategoryPrices, setProdCategoryPrices] = useState<{ [catId: string]: number }>({});
  const [prodBOMItems, setProdBOMItems] = useState<BOMItem[]>([]);

  // Battery Technical Specifications State
  const [prodNormalVoltage, setProdNormalVoltage] = useState('51.2V');
  const [prodRated, setProdRated] = useState('51.2V86Ah');
  const [prodCycleLife, setProdCycleLife] = useState('>4000');
  const [prodTypicalCapacity, setProdTypicalCapacity] = useState('4.40KWH');
  const [prodMaxChargeCurrent, setProdMaxChargeCurrent] = useState('50A');
  const [prodStandardCharging, setProdStandardCharging] = useState('CC/CV, 0.5C, 58.4V.');
  const [prodMaxDischargeCurrent, setProdMaxDischargeCurrent] = useState('120A/150A/200A');
  const [prodWeight, setProdWeight] = useState('40KG (±)2%');
  const [prodDimension, setProdDimension] = useState('50*36*26');
  const [prodOperatingTemperature, setProdOperatingTemperature] = useState('0-60°C');
  const [prodMileage, setProdMileage] = useState('80-90KM with Full Charge.');

  // Supabase State & Config
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => getSupabaseUrl());
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => getSupabaseAnonKey());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tableExists?: boolean; rowCount?: number } | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isConfigured, setIsConfigured] = useState(() => checkSupabaseConfigured());
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5500);
  };

  useEffect(() => {
    const handleConfigChange = () => {
      setSupabaseUrlInput(getSupabaseUrl());
      setSupabaseKeyInput(getSupabaseAnonKey());
      setIsConfigured(checkSupabaseConfigured());
    };
    window.addEventListener('ensec-supabase-config-changed', handleConfigChange);
    return () => window.removeEventListener('ensec-supabase-config-changed', handleConfigChange);
  }, []);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testProductsTableConnection(supabaseUrlInput, supabaseKeyInput);
      setTestResult(res);
      setIsConfigured(res.success);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection test failed', tableExists: false });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveSupabaseConfig = async () => {
    if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
      showToast('Please enter both Supabase URL and Anon Key', 'error');
      return;
    }
    saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
    setIsConfigured(true);
    showToast('Supabase configuration saved! Testing connection...', 'info');
    await handleTestConnection();
    if (refreshProducts) {
      await refreshProducts();
    }
  };

  const handleResetSupabaseConfig = async () => {
    setSupabaseUrlInput(DEFAULT_SUPABASE_URL);
    setSupabaseKeyInput(DEFAULT_SUPABASE_ANON_KEY);
    saveSupabaseConfig(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
    setIsConfigured(true);
    showToast('Reset to default Ensec Supabase credentials.', 'info');
    if (refreshProducts) {
      await refreshProducts();
    }
  };

  const handleSyncAllToSupabase = async () => {
    if (!syncAllProductsToSupabase) return;
    setIsSyncingAll(true);
    try {
      const res = await syncAllProductsToSupabase();
      if (res.success) {
        showToast(`Successfully synced ${res.syncedCount} finished products directly to your Supabase table!`, 'success');
        if (testResult) {
          handleTestConnection();
        }
      } else {
        showToast(`Sync issue: ${res.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`Sync error: ${err?.message}`, 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Pre-fill / Auto-load Sample Product Specs (e.g. EN51.2V86AH)
  const handleLoadSampleSpecs = () => {
    setProdName('EN51.2V86AH');
    setProdModel('EN51.2V86AH');
    setProdBatteryType('LiFePO4');
    setProdVoltageV(51.2);
    setProdCapacityAh(86);
    setProdNormalVoltage('51.2V');
    setProdRated('51.2V86Ah');
    setProdCycleLife('>4000');
    setProdTypicalCapacity('4.40KWH');
    setProdMaxChargeCurrent('50A');
    setProdStandardCharging('CC/CV, 0.5C, 58.4V.');
    setProdMaxDischargeCurrent('120A/150A/200A');
    setProdWeight('40KG (±)2%');
    setProdDimension('50*36*26');
    setProdOperatingTemperature('0-60°C');
    setProdMileage('80-90KM with Full Charge.');
    setProdWarrantyMonths(36);
    if (!prodDistributorPrice) setProdDistributorPrice(85000);
    if (!prodDealerPrice) setProdDealerPrice(89000);
    if (!prodCorporatePrice) setProdCorporatePrice(92000);
    if (!prodProjectPrice) setProdProjectPrice(88000);
    if (!prodRetailPrice) setProdRetailPrice(98000);
    if (!prodAssemblyCost) setProdAssemblyCost(4500);
    showToast('Loaded standard specifications for EN51.2V86AH LiFePO4 battery pack', 'info');
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q));
    const matchesCategory = selectedCategoryFilter === 'ALL' || p.category === selectedCategoryFilter;
    const matchesBrand = selectedBrandFilter === 'ALL' || p.brand === selectedBrandFilter;
    const matchesBattery = selectedBatteryTypeFilter === 'ALL' || p.batteryType === selectedBatteryTypeFilter;
    return matchesSearch && matchesCategory && matchesBrand && matchesBattery;
  });

  // Reset Product Form
  const handleOpenCreateProduct = () => {
    const nextSeq = products.length + 1;
    setProdCode(`ENS-PROD-${nextSeq.toString().padStart(3, '0')}`);
    setProdName('');
    setProdCategory(categories[0]?.name || '');
    setProdBrand(brands[0]?.name || '');
    setProdModel('');
    setProdBatteryType('LiFePO4');
    setProdCapacityAh(86);
    setProdVoltageV(51.2);
    setProdWarrantyMonths(36);
    setProdUnit('Units');
    setProdDistributorPrice(0);
    setProdDealerPrice(0);
    setProdCorporatePrice(0);
    setProdProjectPrice(0);
    setProdRetailPrice(0);
    setProdAssemblyCost(0);
    setProdStatus('Active');
    setProdCategoryPrices({});
    setProdBOMItems([]);
    setSaveError(null);
    // Default specification values (EN51.2V86AH specification defaults)
    setProdNormalVoltage('51.2V');
    setProdRated('51.2V86Ah');
    setProdCycleLife('>4000');
    setProdTypicalCapacity('4.40KWH');
    setProdMaxChargeCurrent('50A');
    setProdStandardCharging('CC/CV, 0.5C, 58.4V.');
    setProdMaxDischargeCurrent('120A/150A/200A');
    setProdWeight('40KG (±)2%');
    setProdDimension('50*36*26');
    setProdOperatingTemperature('0-60°C');
    setProdMileage('80-90KM with Full Charge.');
    setShowCreateProductModal(true);
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodCode.trim()) {
      setSaveError('Please enter both Product Name and SKU Code.');
      return;
    }

    setIsSavingProduct(true);
    setSaveError(null);

    try {
      // Derive channel prices from category overrides if configured
      const distCat = customerCategories?.find((c) => c.targetAudience === 'Distributor' || c.code.toLowerCase().includes('dist') || c.name.toLowerCase().includes('dist'));
      const dealerCat = customerCategories?.find((c) => c.code.toLowerCase().includes('dealer') || c.name.toLowerCase().includes('dealer'));
      const corpCat = customerCategories?.find((c) => c.code.toLowerCase().includes('corp') || c.name.toLowerCase().includes('corp'));
      const prjCat = customerCategories?.find((c) => c.code.toLowerCase().includes('prj') || c.name.toLowerCase().includes('project'));

      const effectiveDistributorPrice = distCat && prodCategoryPrices[distCat.id] !== undefined
        ? Number(prodCategoryPrices[distCat.id])
        : Number(prodDistributorPrice) || 0;
      const effectiveDealerPrice = dealerCat && prodCategoryPrices[dealerCat.id] !== undefined
        ? Number(prodCategoryPrices[dealerCat.id])
        : Number(prodDealerPrice) || 0;
      const effectiveCorporatePrice = corpCat && prodCategoryPrices[corpCat.id] !== undefined
        ? Number(prodCategoryPrices[corpCat.id])
        : Number(prodCorporatePrice) || 0;
      const effectiveProjectPrice = prjCat && prodCategoryPrices[prjCat.id] !== undefined
        ? Number(prodCategoryPrices[prjCat.id])
        : Number(prodProjectPrice) || 0;

      const res = await addProduct({
        code: prodCode.trim(),
        name: prodName.trim(),
        category: prodCategory,
        brand: prodBrand,
        model: (prodModel || prodCode).trim(),
        batteryType: prodBatteryType,
        capacityAh: Number(prodCapacityAh) || 86,
        voltageV: Number(prodVoltageV) || 51.2,
        nominalVoltage: prodNormalVoltage || `${prodVoltageV}V`,
        normalVoltage: prodNormalVoltage,
        ratedCapacity: prodRated,
        cycleLife: prodCycleLife,
        typicalCapacityKWh: prodTypicalCapacity,
        maxChargeCurrent: prodMaxChargeCurrent,
        standardCharging: prodStandardCharging,
        maxDischargeCurrent: prodMaxDischargeCurrent,
        weightKg: prodWeight,
        chemistry: prodBatteryType === 'LiFePO4' ? 'Lifepo4' : prodBatteryType,
        dimensionCm: prodDimension,
        operatingTemperature: prodOperatingTemperature,
        mileageKm: prodMileage,
        warrantyMonths: Number(prodWarrantyMonths) || 36,
        unit: prodUnit || 'Units',
        distributorPriceBDT: effectiveDistributorPrice,
        dealerPriceBDT: effectiveDealerPrice,
        corporatePriceBDT: effectiveCorporatePrice,
        projectPriceBDT: effectiveProjectPrice,
        retailPriceBDT: Number(prodRetailPrice) || 0,
        customerPriceBDT: Number(prodRetailPrice) || 0,
        minimumSellingPriceBDT: effectiveDistributorPrice || Number(prodRetailPrice) || 0,
        assemblyCostEstimateBDT: Number(prodAssemblyCost) || 0,
        status: prodStatus,
        categoryPrices: prodCategoryPrices,
        bom: prodBOMItems,
      });

      if (res && typeof res === 'object') {
        if (res.isRemoteSynced) {
          showToast(`Product "${prodName}" (${prodCode}) successfully saved and synced to your Supabase products table (ID: ${res.id})!`, 'success');
          setShowCreateProductModal(false);
        } else if (res.error) {
          setSaveError(`Saved in local memory, but Supabase sync returned an error: "${res.error}". Please check your Supabase connection and ensure the public.products table has RLS policies enabled.`);
          showToast(`Saved locally! Supabase error: ${res.error}`, 'error');
        } else {
          showToast(`Product "${prodName}" registered successfully!`, 'success');
          setShowCreateProductModal(false);
        }
      } else {
        showToast(`Product "${prodName}" registered successfully!`, 'success');
        setShowCreateProductModal(false);
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Error saving product');
      showToast(err?.message || 'Failed to register product', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSavingProduct(true);
    try {
      const res = await updateProduct(editingProduct.id, {
        code: editingProduct.code,
        name: editingProduct.name,
        category: editingProduct.category,
        brand: editingProduct.brand,
        model: editingProduct.model,
        batteryType: editingProduct.batteryType,
        capacityAh: editingProduct.capacityAh,
        voltageV: editingProduct.voltageV,
        nominalVoltage: editingProduct.normalVoltage || editingProduct.nominalVoltage,
        normalVoltage: editingProduct.normalVoltage,
        ratedCapacity: editingProduct.ratedCapacity,
        cycleLife: editingProduct.cycleLife,
        typicalCapacityKWh: editingProduct.typicalCapacityKWh,
        maxChargeCurrent: editingProduct.maxChargeCurrent,
        standardCharging: editingProduct.standardCharging,
        maxDischargeCurrent: editingProduct.maxDischargeCurrent,
        weightKg: editingProduct.weightKg,
        chemistry: editingProduct.chemistry || (editingProduct.batteryType === 'LiFePO4' ? 'Lifepo4' : editingProduct.batteryType),
        dimensionCm: editingProduct.dimensionCm,
        operatingTemperature: editingProduct.operatingTemperature,
        mileageKm: editingProduct.mileageKm,
        warrantyMonths: editingProduct.warrantyMonths,
        unit: editingProduct.unit,
        distributorPriceBDT: editingProduct.distributorPriceBDT,
        dealerPriceBDT: editingProduct.dealerPriceBDT,
        corporatePriceBDT: editingProduct.corporatePriceBDT,
        projectPriceBDT: editingProduct.projectPriceBDT,
        retailPriceBDT: editingProduct.retailPriceBDT,
        customerPriceBDT: editingProduct.customerPriceBDT,
        minimumSellingPriceBDT: editingProduct.minimumSellingPriceBDT,
        assemblyCostEstimateBDT: editingProduct.assemblyCostEstimateBDT,
        categoryPrices: editingProduct.categoryPrices,
        status: editingProduct.status,
      });

      if (res && res.error) {
        showToast(`Updated locally, but Supabase reported: ${res.error}`, 'error');
      } else {
        showToast(`Product "${editingProduct.name}" updated and synced to Supabase!`, 'success');
      }
      setEditingProduct(null);
    } catch (err: any) {
      showToast(err?.message || 'Error updating product', 'error');
      setEditingProduct(null);
    } finally {
      setIsSavingProduct(false);
    }
  };

  if (showCreateProductModal) {
    const calculatedKWh = ((Number(prodVoltageV || 0) * Number(prodCapacityAh || 0)) / 1000).toFixed(2);
    const totalBomMaterialCost = prodBOMItems.reduce(
      (sum, b) => sum + Number(b.requiredQty || 0) * Number(b.unitCostBDT || 0),
      0
    );
    const totalProductionCost = totalBomMaterialCost + Number(prodAssemblyCost || 0);
    const distributorMarginBDT = Number(prodDistributorPrice || 0) - totalProductionCost;
    const distributorMarginPct =
      Number(prodDistributorPrice || 0) > 0
        ? Math.round((distributorMarginBDT / Number(prodDistributorPrice || 0)) * 100)
        : 0;
    const retailMarginBDT = Number(prodRetailPrice || 0) - totalProductionCost;
    const retailMarginPct =
      Number(prodRetailPrice || 0) > 0
        ? Math.round((retailMarginBDT / Number(prodRetailPrice || 0)) * 100)
        : 0;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Full Page Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5">
              <span>Basic Data Master</span>
              <span>/</span>
              <button
                type="button"
                onClick={() => setShowCreateProductModal(false)}
                className="hover:underline cursor-pointer"
              >
                Finished Products Catalog
              </button>
              <span>/</span>
              <span className="text-slate-900 dark:text-white">Register New Finished Product SKU</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCreateProductModal(false)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
                title="Back to Catalog"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Register New Finished Product SKU</span>
                  
                </h1>
                
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateProductModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel & Return
            </button>
            <button
              type="button"
              onClick={handleCreateProductSubmit}
              disabled={isSavingProduct}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all cursor-pointer ${
                isSavingProduct ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSavingProduct ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Publish Product SKU</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Prominent Save Error Alert if Supabase rejected insert */}
        {saveError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs animate-in fade-in space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-sm text-rose-700 dark:text-rose-300">Supabase Table Sync Alert</p>
                <p className="mt-1 leading-relaxed text-slate-700 dark:text-slate-200 font-mono text-[11px] bg-rose-100/60 dark:bg-rose-900/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800/60">
                  {saveError}
                </p>
                <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  The product was preserved in your browser's local state, but failed to insert into your remote Supabase database. This usually means either:
                  (1) your Supabase project table has missing columns or RLS enabled without a public policy, or (2) the connection credentials need updating.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSupabaseModal(true);
                      handleTestConnection();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    Open Supabase Setup & View SQL
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaveError(null)}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Dismiss Warning
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Page Main Form Layout */}
        <form onSubmit={handleCreateProductSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main 8-column workspace */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Core Product Master Identity */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Core Product Identity & Classification
                    </h2>
                    
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSampleSpecs}
                    className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
                    title="Load sample battery data: EN51.2V86AH"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Load EN51.2V86AH Sample</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextSeq = products.length + 1;
                      setProdCode(`ENS-PROD-${nextSeq.toString().padStart(3, '0')}`);
                      if (!prodModel) setProdModel(`ET-${nextSeq}00-GEN2`);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Suggest Code</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Product SKU Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={prodCode}
                    onChange={(e) => setProdCode(e.target.value)}
                    placeholder="e.g. ENS-PROD-005"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Model Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={prodModel}
                    onChange={(e) => setProdModel(e.target.value)}
                    placeholder="e.g. ET-500-GEN2"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Full Product Title / Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Ensec 48V 100Ah LiFePO4 Telecom Rack Battery (5.12 kWh Standard Module)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Product Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Product Brand <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Unit of Measurement (UoM)
                  </label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {finishedUOMs.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                    {!finishedUOMs.some((u) => u.name === prodUnit) && (
                      <option value={prodUnit}>{prodUnit}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Catalog Status
                  </label>
                  <select
                    value={prodStatus}
                    onChange={(e) => setProdStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Active">Active (Available for Orders & Sales)</option>
                    <option value="Discontinued">Discontinued (Archived / Inactive)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: Electrical & Battery Engineering Specs */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Technical & Engineering Specifications
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Standard lithium cell, charging, discharging, thermal, and mechanical parameters.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLoadSampleSpecs}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Auto-fill Sample EN51.2V86AH Specs</span>
                </button>
              </div>

              {/* Group 1: Core Electrical & Chemistry Ratings */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Battery className="w-3.5 h-3.5 text-emerald-500" />
                  <span>1. Voltage, Capacity & Chemistry</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Normal Voltage <span className="text-emerald-600 font-normal">(e.g. 51.2V)</span>
                    </label>
                    <input
                      type="text"
                      value={prodNormalVoltage}
                      onChange={(e) => {
                        setProdNormalVoltage(e.target.value);
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num) && num > 0) setProdVoltageV(num);
                      }}
                      placeholder="e.g. 51.2V"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Rated Specification <span className="text-emerald-600 font-normal">(e.g. 51.2V86Ah)</span>
                    </label>
                    <input
                      type="text"
                      value={prodRated}
                      onChange={(e) => setProdRated(e.target.value)}
                      placeholder="e.g. 51.2V86Ah"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Typical Capacity <span className="text-emerald-600 font-normal">(e.g. 4.40KWH)</span>
                    </label>
                    <input
                      type="text"
                      value={prodTypicalCapacity}
                      onChange={(e) => setProdTypicalCapacity(e.target.value)}
                      placeholder="e.g. 4.40KWH"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Chemistry <span className="text-emerald-600 font-normal">(e.g. Lifepo4)</span>
                    </label>
                    <select
                      value={prodBatteryType}
                      onChange={(e) => setProdBatteryType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="LiFePO4">Lifepo4 (Lithium Iron Phosphate)</option>
                      <option value="NMC">NMC (Nickel Manganese Cobalt)</option>
                      <option value="LTO">LTO (Lithium Titanate)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Group 2: Charging, Discharging & Cycle Life */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                  <span>2. Charge / Discharge & Longevity Parameters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Cycle Life <span className="text-blue-600 font-normal">(e.g. &gt;4000)</span>
                    </label>
                    <input
                      type="text"
                      value={prodCycleLife}
                      onChange={(e) => setProdCycleLife(e.target.value)}
                      placeholder="e.g. >4000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Max Charge Current <span className="text-blue-600 font-normal">(e.g. 50A)</span>
                    </label>
                    <input
                      type="text"
                      value={prodMaxChargeCurrent}
                      onChange={(e) => setProdMaxChargeCurrent(e.target.value)}
                      placeholder="e.g. 50A"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Standard Charging <span className="text-blue-600 font-normal">(Method & Cut-off)</span>
                    </label>
                    <input
                      type="text"
                      value={prodStandardCharging}
                      onChange={(e) => setProdStandardCharging(e.target.value)}
                      placeholder="e.g. CC/CV, 0.5C, 58.4V."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Max Discharge Current <span className="text-blue-600 font-normal">(Peak / Cont.)</span>
                    </label>
                    <input
                      type="text"
                      value={prodMaxDischargeCurrent}
                      onChange={(e) => setProdMaxDischargeCurrent(e.target.value)}
                      placeholder="e.g. 120A/150A/200A"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Physical, Environmental & Performance */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Scale className="w-3.5 h-3.5 text-amber-500" />
                  <span>3. Physical Dimensions, Thermal & Mileage</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Weight <span className="text-amber-600 font-normal">(with tolerance)</span>
                    </label>
                    <input
                      type="text"
                      value={prodWeight}
                      onChange={(e) => setProdWeight(e.target.value)}
                      placeholder="e.g. 40KG (±)2%"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Dimension(cm) <span className="text-amber-600 font-normal">(L*W*H)</span>
                    </label>
                    <input
                      type="text"
                      value={prodDimension}
                      onChange={(e) => setProdDimension(e.target.value)}
                      placeholder="e.g. 50*36*26"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Operating Temperature <span className="text-amber-600 font-normal">(Working range)</span>
                    </label>
                    <input
                      type="text"
                      value={prodOperatingTemperature}
                      onChange={(e) => setProdOperatingTemperature(e.target.value)}
                      placeholder="e.g. 0-60°C"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Mileage / Range <span className="text-amber-600 font-normal">(Per charge)</span>
                    </label>
                    <input
                      type="text"
                      value={prodMileage}
                      onChange={(e) => setProdMileage(e.target.value)}
                      placeholder="e.g. 80-90KM with Full Charge."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Group 4: Numeric System Anchors & Auto-Calculated Capacity */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Numeric Voltage (V)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={prodVoltageV}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setProdVoltageV(val);
                          if (!prodNormalVoltage || prodNormalVoltage === `${prodVoltageV}V`) {
                            setProdNormalVoltage(`${val}V`);
                          }
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-slate-900 dark:text-white"
                      />
                      <span className="absolute right-3.5 top-2 text-xs text-slate-400 font-bold">V</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Numeric Capacity (Ah)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={prodCapacityAh}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setProdCapacityAh(val);
                          if (!prodRated || prodRated === `${prodVoltageV}V${prodCapacityAh}Ah`) {
                            setProdRated(`${prodVoltageV}V${val}Ah`);
                          }
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-slate-900 dark:text-white"
                      />
                      <span className="absolute right-3.5 top-2 text-xs text-slate-400 font-bold">Ah</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Warranty Period (Months)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={prodWarrantyMonths}
                        onChange={(e) => setProdWarrantyMonths(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-slate-900 dark:text-white"
                      />
                      <span className="absolute right-3.5 top-2 text-xs text-slate-400 font-medium">Months</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Calculated Nominal Energy Rating
                    </span>
                    <div className="text-base font-black text-emerald-800 dark:text-emerald-200 font-mono mt-0.5">
                      {calculatedKWh} kWh Storage • Typical: {prodTypicalCapacity || `${calculatedKWh}KWH`}
                    </div>
                  </div>
                  <div className="sm:text-right text-[11px] text-emerald-700 dark:text-emerald-400">
                    <div>{prodVoltageV}V × {prodCapacityAh}Ah = {prodVoltageV * prodCapacityAh} Wh</div>
                    <div className="text-[10px] text-emerald-600/80">Mileage: {prodMileage || '80-90KM with Full Charge.'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: 5-Channel Pricing Architecture (BDT) */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      5-Channel Pricing Matrix & Assembly Estimate (BDT)
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Standard channel wholesale and retail price agreements across Bangladesh.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  Currency: BDT (৳)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <label className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                    Retail Maximum Retail Price (MRP) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-emerald-600 font-bold">৳</span>
                    <input
                      type="number"
                      required
                      value={prodRetailPrice}
                      onChange={(e) => setProdRetailPrice(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 block">End-consumer box packaging MRP</span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-300 mb-1">
                    Factory Assembly / Labor Fee
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">৳</span>
                    <input
                      type="number"
                      value={prodAssemblyCost}
                      onChange={(e) => setProdAssemblyCost(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Kushtia plant assembly & QC fee per unit</span>
                </div>
              </div>

              {/* Customer Category Specific Pricing Section */}
              {customerCategories && customerCategories.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Customer Category Price Overrides</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Prices set here apply automatically to customers or distributors in that category
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {customerCategories.map((cat) => {
                      const currentVal = prodCategoryPrices[cat.id] ?? (
                        cat.targetAudience === 'Distributor'
                          ? prodDistributorPrice
                          : cat.code.includes('DEALER')
                          ? prodDealerPrice
                          : cat.code.includes('CORP')
                          ? prodCorporatePrice
                          : cat.code.includes('PRJ')
                          ? prodProjectPrice
                          : prodRetailPrice
                      );

                      return (
                        <div
                          key={cat.id}
                          className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20"
                        >
                          <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate mb-1" title={cat.name}>
                            {cat.name} ({cat.code})
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-xs font-bold text-purple-600">৳</span>
                            <input
                              type="number"
                              value={currentVal}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setProdCategoryPrices((prev) => ({
                                  ...prev,
                                  [cat.id]: val,
                                }));
                                if (cat.targetAudience === 'Distributor' || cat.code.includes('DIST')) {
                                  setProdDistributorPrice(val);
                                } else if (cat.code.includes('DEALER')) {
                                  setProdDealerPrice(val);
                                } else if (cat.code.includes('CORP')) {
                                  setProdCorporatePrice(val);
                                } else if (cat.code.includes('PRJ')) {
                                  setProdProjectPrice(val);
                                }
                              }}
                              className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 font-mono font-bold text-xs text-purple-900 dark:text-purple-200"
                            />
                          </div>
                          <span className="text-[10px] text-purple-600/80 dark:text-purple-400/80 mt-0.5 block truncate">
                            Scope: {cat.targetAudience || 'Customer'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Card 4: Kushtia Factory Bill of Materials (BOM) */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Plant Bill of Materials (BOM)
                    </h2>
                    
                  </div>
                </div>

                {rawMaterials.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const firstRM = rawMaterials[0];
                      setProdBOMItems((prev) => [
                        ...prev,
                        {
                          materialId: firstRM.id,
                          materialName: firstRM.name,
                          requiredQty: 1,
                          unit: firstRM.unit,
                          unitCostBDT: firstRM.standardCostBDT,
                        },
                      ]);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add BOM Raw Material</span>
                  </button>
                )}
              </div>

              {prodBOMItems.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Box className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No BOM Components Attached</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;Add BOM Raw Material&quot; to configure production BOM for this battery.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2.5">Raw Material Component</th>
                          <th className="p-2.5 w-32">Req. Qty / Unit</th>
                          <th className="p-2.5 text-right w-28">Standard Cost</th>
                          <th className="p-2.5 text-right w-32">Component Total</th>
                          <th className="p-2.5 text-center w-12">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {prodBOMItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5">
                              <select
                                value={item.materialId}
                                onChange={(e) => {
                                  const selectedRM = rawMaterials.find((rm) => rm.id === e.target.value);
                                  if (selectedRM) {
                                    setProdBOMItems((prev) =>
                                      prev.map((b, i) =>
                                        i === idx
                                          ? {
                                              ...b,
                                              materialId: selectedRM.id,
                                              materialName: selectedRM.name,
                                              unit: selectedRM.unit,
                                              unitCostBDT: selectedRM.standardCostBDT,
                                            }
                                          : b
                                      )
                                    );
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                              >
                                {rawMaterials.map((rm) => (
                                  <option key={rm.id} value={rm.id}>
                                    {rm.name} ({rm.category} • {rm.code} • In Stock: {rm.stockKushtia} {rm.unit})
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="p-2.5">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="any"
                                  value={item.requiredQty}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setProdBOMItems((prev) =>
                                      prev.map((b, i) => (i === idx ? { ...b, requiredQty: val } : b))
                                    );
                                  }}
                                  className="w-18 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-center"
                                />
                                <span className="text-[11px] text-slate-500 font-medium truncate">
                                  {item.unit}
                                </span>
                              </div>
                            </td>

                            <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                              ৳ {item.unitCostBDT.toLocaleString()}
                            </td>

                            <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                              ৳ {(item.requiredQty * item.unitCostBDT).toLocaleString()}
                            </td>

                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setProdBOMItems((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors cursor-pointer"
                                title="Remove component"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Bar */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="text-slate-500">
                        Total Raw Materials: <b className="text-slate-800 dark:text-slate-200">{prodBOMItems.length} items</b>
                      </div>
                      <div className="text-slate-500">
                        Factory Assembly Allowance: <b className="text-slate-800 dark:text-slate-200">৳ {Number(prodAssemblyCost || 0).toLocaleString()}</b>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Total Production Standard Cost
                      </span>
                      <span className="text-base font-black font-mono text-blue-600 dark:text-blue-400">
                        ৳ {totalProductionCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 Cols): Live Product Preview & Financial Health Inspector */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live Catalog Preview Card */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 sticky top-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Live Catalog Card Preview
              </span>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    {prodCode || 'ENS-PROD-XXX'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {prodStatus}
                  </span>
                </div>

                <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                  {prodName || 'Product Display Title'}
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>Model: <b>{prodModel || 'N/A'}</b></span>
                  <span>•</span>
                  <span>{prodBrand}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Chemistry</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{prodBatteryType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Stored Energy</span>
                    <span className="font-semibold text-emerald-600 font-mono">{calculatedKWh} kWh</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Distributor Rate</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      ৳ {Number(prodDistributorPrice || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Retail MRP</span>
                    <span className="font-bold font-mono text-purple-600 dark:text-purple-400">
                      ৳ {Number(prodRetailPrice || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Live Specification Sheet Box */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Engineering Specs Sheet
                  </span>
                  <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-slate-200/80 dark:border-slate-700/80 text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Normal Voltage:</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">{prodNormalVoltage || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Rated:</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">{prodRated || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Cycle Life:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{prodCycleLife || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Typical Capacity:</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{prodTypicalCapacity || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Charge / Discharge:</span>
                      <span className="font-mono text-slate-900 dark:text-white">{prodMaxChargeCurrent || '50A'} / {prodMaxDischargeCurrent || '120-200A'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Weight & Dim:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{prodWeight || '40KG'} • {prodDimension || '50*36*26'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Temp & Mileage:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{prodOperatingTemperature || '0-60°C'} • {prodMileage || '80-90KM'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profitability & Margins Widget */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Unit Economics & Gross Margins
                </span>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Standard Cost:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ৳ {totalProductionCost.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-amber-800 dark:text-amber-300 block">
                        Distributor Margin
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-300 block">
                        ৳ {distributorMarginBDT.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600">
                        {distributorMarginPct}% margin
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300 block">
                        Retail MRP Margin
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 block">
                        ৳ {retailMarginBDT.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600">
                        {retailMarginPct}% margin
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className={`w-full py-3 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isSavingProduct ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSavingProduct ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Supabase Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save & Register Product SKU</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreateProductModal(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
                >
                  Cancel & Return to Catalog
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Finished Products Master Catalog
            </h1>
            
          </div>
          
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSyncAllToSupabase}
            disabled={isSyncingAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Push all products in local memory to your Supabase products table"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>{isSyncingAll ? 'Syncing...' : 'Sync with Supabase'}</span>
          </button>
        </div>
      </div>

      {/* Highlight KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Total Finished SKUs</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {products.length} Models
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            {products.filter((p) => p.status === 'Active').length} Active for Sales
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Product Categories</span>
            <Tag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {categories.length} Segments
          </div>
          <div className="text-[11px] text-slate-500">Solar, Telecom, EV & UPS</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Lithium Brands</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {brands.length} Brands
          </div>
          <div className="text-[11px] text-purple-600 font-medium">Ensec BD & Optimum JV</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Avg Warranty</span>
            <Shield className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            60 Months
          </div>
          <div className="text-[11px] text-amber-600 font-medium">5-Year National Warranty</div>
        </div>
      </div>

      {/* Product Registry Table & Search */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by SKU code, model or name..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={selectedBatteryTypeFilter}
              onChange={(e) => setSelectedBatteryTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Chemistries</option>
              <option value="LiFePO4">LiFePO4</option>
              <option value="NMC">NMC</option>
              <option value="LTO">LTO</option>
            </select>

            <button
              onClick={handleOpenCreateProduct}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add SKU</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">SKU & Model</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Category & Brand</th>
                <th className="p-3">Chemistry & Rating</th>
                <th className="p-3">Distributor Price (BDT)</th>
                <th className="p-3">Retail MRP (BDT)</th>
                <th className="p-3">Warranty</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {prod.code}
                      </span>
                      {!prod.id.startsWith('p-') ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60" title={`Synced in Supabase products table (ID: ${prod.id})`}>
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />
                          #{prod.id}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60" title="Saved locally in browser memory only">
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          Local
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{prod.model}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{prod.name}</div>
                    <div className="text-[10px] text-slate-400">{prod.bom?.length || 0} BOM Components</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 block w-fit mb-0.5">
                      {prod.category}
                    </span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                      🏷️ {prod.brand || 'Ensec Lithium BD'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {prod.chemistry || prod.batteryType} • {prod.normalVoltage || `${prod.voltageV}V`} • {prod.ratedCapacity || `${prod.capacityAh}Ah`}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] flex-wrap">
                      <span className="text-emerald-600 font-mono font-bold">
                        {prod.typicalCapacityKWh || `${((Number(prod.voltageV || 0) * Number(prod.capacityAh || 0)) / 1000).toFixed(2)} kWh`}
                      </span>
                      {prod.cycleLife && (
                        <span className="text-blue-600 font-semibold">• {prod.cycleLife}</span>
                      )}
                      {prod.mileageKm && (
                        <span className="text-amber-600 font-medium truncate max-w-[130px]" title={prod.mileageKm}>
                          • {prod.mileageKm}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    ৳ {prod.distributorPriceBDT.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                    ৳ {prod.retailPriceBDT.toLocaleString()}
                  </td>
                  <td className="p-3 text-slate-500 font-medium">
                    {prod.warrantyMonths} Months
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        prod.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {prod.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewingSpecsProduct(prod)}
                        className="px-2 py-1 text-[11px] rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-semibold cursor-pointer"
                        title="View Technical Specifications Datasheet"
                      >
                        Specs
                      </button>
                      <button
                        onClick={() => setViewingBOMProduct(prod)}
                        className="px-2 py-1 text-[11px] rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 font-medium cursor-pointer"
                        title="View BOM Components"
                      >
                        BOM
                      </button>
                      <button
                        onClick={() => setEditingProduct(prod)}
                        className="px-2 py-1 text-[11px] rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-medium cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingProduct(prod)}
                        className="px-2 py-1 text-[11px] rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-medium cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">No finished products found</p>
                      <p className="text-[11px] text-slate-400">
                        {productSearch ? 'No products match your search/filter criteria' : 'Register your first finished product SKU to get started'}
                      </p>
                      <button
                        onClick={handleOpenCreateProduct}
                        className="mt-2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Create Finished Product</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 2: EDIT FINISHED PRODUCT */}
      {/* ======================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>Edit Product SKU: {editingProduct.code}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Update product details, pricing matrices, and sales status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProductSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Model Code
                  </label>
                  <input
                    type="text"
                    value={editingProduct.model}
                    onChange={(e) => setEditingProduct({ ...editingProduct, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Category
                  </label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Brand
                  </label>
                  <select
                    value={editingProduct.brand || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Distributor Price (BDT)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.distributorPriceBDT}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        distributorPriceBDT: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Retail MRP (BDT)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.retailPriceBDT}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        retailPriceBDT: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Warranty (Months)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.warrantyMonths}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        warrantyMonths: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Status
                  </label>
                  <select
                    value={editingProduct.status}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>
              </div>

              {/* Customer Category Price Overrides in Edit Modal */}
              {customerCategories && customerCategories.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Customer Category Price Overrides</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Edit unit price per customer category
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {customerCategories.map((cat) => {
                      const currentVal =
                        editingProduct.categoryPrices?.[cat.id] ?? (
                          cat.targetAudience === 'Distributor'
                            ? editingProduct.distributorPriceBDT
                            : cat.code.includes('DEALER')
                            ? editingProduct.dealerPriceBDT || Math.round(editingProduct.distributorPriceBDT * 1.05)
                            : cat.code.includes('CORP')
                            ? editingProduct.corporatePriceBDT || Math.round(editingProduct.distributorPriceBDT * 1.06)
                            : cat.code.includes('PRJ')
                            ? editingProduct.projectPriceBDT || Math.round(editingProduct.distributorPriceBDT * 1.03)
                            : editingProduct.retailPriceBDT
                        );

                      return (
                        <div
                          key={cat.id}
                          className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20"
                        >
                          <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate mb-1" title={cat.name}>
                            {cat.name} ({cat.code})
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-xs font-bold text-purple-600">৳</span>
                            <input
                              type="number"
                              value={currentVal}
                              onChange={(e) => {
                                const newCatPrices = {
                                  ...(editingProduct.categoryPrices || {}),
                                  [cat.id]: Number(e.target.value),
                                };
                                setEditingProduct({
                                  ...editingProduct,
                                  categoryPrices: newCatPrices,
                                });
                              }}
                              className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 font-mono font-bold text-xs text-purple-900 dark:text-purple-200"
                            />
                          </div>
                          <span className="text-[10px] text-purple-600/80 dark:text-purple-400/80 mt-0.5 block truncate">
                            Scope: {cat.targetAudience || 'Customer'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Technical Specifications Section in Edit Modal */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Technical & Engineering Specifications</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Normal Voltage, Rated, Cycle Life, Charging, Mileage & Dimensions
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Normal Voltage
                    </label>
                    <input
                      type="text"
                      value={editingProduct.normalVoltage || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, normalVoltage: e.target.value })}
                      placeholder="e.g. 51.2V"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Rated Specification
                    </label>
                    <input
                      type="text"
                      value={editingProduct.ratedCapacity || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, ratedCapacity: e.target.value })}
                      placeholder="e.g. 51.2V86Ah"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Cycle Life
                    </label>
                    <input
                      type="text"
                      value={editingProduct.cycleLife || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, cycleLife: e.target.value })}
                      placeholder="e.g. >4000"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Typical Capacity
                    </label>
                    <input
                      type="text"
                      value={editingProduct.typicalCapacityKWh || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, typicalCapacityKWh: e.target.value })}
                      placeholder="e.g. 4.40KWH"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Max Charge Current
                    </label>
                    <input
                      type="text"
                      value={editingProduct.maxChargeCurrent || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, maxChargeCurrent: e.target.value })}
                      placeholder="e.g. 50A"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Standard Charging
                    </label>
                    <input
                      type="text"
                      value={editingProduct.standardCharging || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, standardCharging: e.target.value })}
                      placeholder="e.g. CC/CV, 0.5C, 58.4V."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Max Discharge Current
                    </label>
                    <input
                      type="text"
                      value={editingProduct.maxDischargeCurrent || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, maxDischargeCurrent: e.target.value })}
                      placeholder="e.g. 120A/150A/200A"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Weight
                    </label>
                    <input
                      type="text"
                      value={editingProduct.weightKg || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, weightKg: e.target.value })}
                      placeholder="e.g. 40KG (±)2%"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Chemistry
                    </label>
                    <select
                      value={editingProduct.batteryType || 'LiFePO4'}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          batteryType: e.target.value,
                          chemistry: e.target.value === 'LiFePO4' ? 'Lifepo4' : e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="LiFePO4">Lifepo4</option>
                      <option value="NMC">NMC</option>
                      <option value="LTO">LTO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Dimension(cm)
                    </label>
                    <input
                      type="text"
                      value={editingProduct.dimensionCm || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, dimensionCm: e.target.value })}
                      placeholder="e.g. 50*36*26"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Operating Temperature
                    </label>
                    <input
                      type="text"
                      value={editingProduct.operatingTemperature || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, operatingTemperature: e.target.value })}
                      placeholder="e.g. 0-60°C"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Mileage
                    </label>
                    <input
                      type="text"
                      value={editingProduct.mileageKm || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, mileageKm: e.target.value })}
                      placeholder="e.g. 80-90KM with Full Charge."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: DELETE PRODUCT CONFIRMATION */}
      {/* ======================================================== */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete Finished Product SKU
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to remove <b>{deletingProduct.name}</b> ({deletingProduct.code})?
                </p>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60">
              This action will remove the product SKU from the master registry and production BOM links.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteProduct(deletingProduct.id);
                  setDeletingProduct(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: VIEW BOM COMPONENTS */}
      {/* ======================================================== */}
      {viewingBOMProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Bill of Materials (BOM): {viewingBOMProduct.name}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Assembly composition configured at Kushtia manufacturing plant.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingBOMProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Electrical Specification:
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {viewingBOMProduct.batteryType} • {viewingBOMProduct.voltageV}V {viewingBOMProduct.capacityAh}Ah
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="p-2.5">Raw Material Component</th>
                      <th className="p-2.5">Req Qty</th>
                      <th className="p-2.5">Unit Cost</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {viewingBOMProduct.bom && viewingBOMProduct.bom.length > 0 ? (
                      viewingBOMProduct.bom.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                            {item.materialName}
                          </td>
                          <td className="p-2.5 font-mono">
                            {item.requiredQty} {item.unit}
                          </td>
                          <td className="p-2.5 font-mono">
                            ৳ {item.unitCostBDT.toLocaleString()}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-right">
                            ৳ {(item.requiredQty * item.unitCostBDT).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                          No specific BOM items mapped for this SKU yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewingBOMProduct(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
                >
                  Close BOM View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: VIEW TECHNICAL SPECIFICATIONS DATASHEET */}
      {/* ======================================================== */}
      {viewingSpecsProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 text-xs my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                    {viewingSpecsProduct.code}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {viewingSpecsProduct.status || 'Active'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {viewingSpecsProduct.brand || 'Ensec Lithium BD'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  <span>{viewingSpecsProduct.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Model: <span className="font-semibold text-slate-700 dark:text-slate-300">{viewingSpecsProduct.model || viewingSpecsProduct.code}</span> • Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{viewingSpecsProduct.category || 'General'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingSpecsProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Technical Datasheet Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Engineering Datasheet & Product Specifications</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  LiFePO4 Power System
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Normal Voltage</div>
                  <div className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    {viewingSpecsProduct.normalVoltage || `${viewingSpecsProduct.voltageV || 51.2}V`}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Rated Specification</div>
                  <div className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    {viewingSpecsProduct.ratedCapacity || `${viewingSpecsProduct.voltageV || 51.2}V${viewingSpecsProduct.capacityAh || 86}Ah`}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Cycle Life</div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {viewingSpecsProduct.cycleLife || '>4000'} Cycles
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Typical Capacity</div>
                  <div className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {viewingSpecsProduct.typicalCapacityKWh || `${((Number(viewingSpecsProduct.voltageV || 51.2) * Number(viewingSpecsProduct.capacityAh || 86)) / 1000).toFixed(2)}KWH`}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Max Charge Current</div>
                  <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white">
                    {viewingSpecsProduct.maxChargeCurrent || '50A'}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Standard Charging</div>
                  <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white">
                    {viewingSpecsProduct.standardCharging || 'CC/CV, 0.5C, 58.4V.'}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Max Discharge Current</div>
                  <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white">
                    {viewingSpecsProduct.maxDischargeCurrent || '120A/150A/200A'}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Weight</div>
                  <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white">
                    {viewingSpecsProduct.weightKg || '40KG (±)2%'}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Chemistry</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {viewingSpecsProduct.chemistry || viewingSpecsProduct.batteryType || 'Lifepo4'}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Dimension (cm)</div>
                  <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white">
                    {viewingSpecsProduct.dimensionCm || '50*36*26'}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Operating Temperature</div>
                  <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white">
                    {viewingSpecsProduct.operatingTemperature || '0-60°C'}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Mileage</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {viewingSpecsProduct.mileageKm || '80-90KM with Full Charge.'}
                  </div>
                </div>
              </div>

              {/* Commercial & Warranty Summary */}
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Distributor</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ৳ {Number(viewingSpecsProduct.distributorPriceBDT || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Dealer Rate</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ৳ {Number(viewingSpecsProduct.dealerPriceBDT || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Retail MRP</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    ৳ {Number(viewingSpecsProduct.retailPriceBDT || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Warranty</span>
                  <span className="font-semibold text-emerald-600">
                    {viewingSpecsProduct.warrantyMonths || 36} Months (Official)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const p = viewingSpecsProduct;
                  setViewingSpecsProduct(null);
                  setEditingProduct(p);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 cursor-pointer"
              >
                Edit Specifications
              </button>
              <button
                type="button"
                onClick={() => setViewingSpecsProduct(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 cursor-pointer"
              >
                Close Datasheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 p-0.5 hover:bg-white/20 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Supabase Database Connection & Setup Modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/60 dark:bg-emerald-950/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Supabase Database Connection & Products Table
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Connect your Supabase project to persist finished product SKUs in PostgreSQL
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSupabaseModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Connection Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Database Status</span>
                {isConfigured ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Not Configured / Offline (Local Memory Only)
                  </span>
                )}
              </div>

              {/* Supabase Project URL */}
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

              {/* Supabase Anon Key */}
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
                  Found in Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API keys &gt; <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">anon public</code>
                </p>
              </div>

              {/* Test Connection Result Box */}
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
                        {testResult.success ? 'Connection Test Passed' : 'Connection Test Notice'}
                      </p>
                      <p className="mt-0.5 leading-relaxed">{testResult.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons for Database Config */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                  <span>{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveSupabaseConfig}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Connect</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetSupabaseConfig}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 font-medium cursor-pointer"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={handleSyncAllToSupabase}
                  disabled={isSyncingAll}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-xs ml-auto"
                >
                  <Cloud className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAll ? 'Pushing to Supabase...' : `Push All Products (${products.length}) to Supabase`}</span>
                </button>
              </div>

              {/* SQL Schema Script Box with Copy Button */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>Supabase SQL Setup for "products"</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const sql = `CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  brand TEXT DEFAULT 'Ensec Lithium BD',
  category TEXT DEFAULT 'Electric Vehicle (EV) Batteries',
  nominal_voltage NUMERIC(6, 2) DEFAULT 51.20,
  capacity_ah NUMERIC(6, 2) DEFAULT 86.00,
  energy_wh NUMERIC(10, 2) DEFAULT 4403.20,
  battery_type TEXT DEFAULT 'LiFePO4',
  chemistry TEXT DEFAULT 'Lifepo4',
  normal_voltage TEXT DEFAULT '51.2V',
  rated_capacity TEXT DEFAULT '51.2V86Ah',
  cycle_life TEXT DEFAULT '>4000',
  typical_capacity_kwh TEXT DEFAULT '4.40KWH',
  max_charge_current TEXT DEFAULT '50A',
  standard_charging TEXT DEFAULT 'CC/CV, 0.5C, 58.4V.',
  max_discharge_current TEXT DEFAULT '120A/150A/200A',
  weight_kg TEXT DEFAULT '40KG (±)2%',
  dimension_cm TEXT DEFAULT '50*36*26',
  operating_temperature TEXT DEFAULT '0-60°C',
  mileage_km TEXT DEFAULT '80-90KM with Full Charge.',
  trade_price_bdt NUMERIC(12, 2) DEFAULT 0.00,
  distributor_price_bdt NUMERIC(12, 2) DEFAULT 85000.00,
  dealer_price_bdt NUMERIC(12, 2) DEFAULT 89000.00,
  corporate_price_bdt NUMERIC(12, 2) DEFAULT 92000.00,
  project_price_bdt NUMERIC(12, 2) DEFAULT 88000.00,
  retail_price_bdt NUMERIC(12, 2) DEFAULT 98000.00,
  mrp_bdt NUMERIC(12, 2) DEFAULT 98000.00,
  assembly_cost_estimate_bdt NUMERIC(12, 2) DEFAULT 4500.00,
  category_prices JSONB DEFAULT '{}'::jsonb,
  warranty_months INT DEFAULT 36,
  stock_quantity INT DEFAULT 0,
  unit TEXT DEFAULT 'Units',
  bom JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Enable Row Level Security and allow public access
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access on products" ON public.products;
CREATE POLICY "Allow public access on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- 2. Enable Realtime Replication
ALTER TABLE public.products REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;`;
                      navigator.clipboard.writeText(sql);
                      showToast('SQL script copied to clipboard! Paste it into your Supabase SQL Editor.', 'success');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold hover:bg-emerald-200 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy SQL Script</span>
                  </button>
                </div>
                <p className="leading-relaxed text-[10.5px] text-slate-500 dark:text-slate-400">
                  If your Supabase product table is missing or doesn't show created products, run this in your <strong>Supabase SQL Editor</strong> to create the table with all 39 specifications, grant RLS permissions, and enable Realtime streaming:
                </p>
                <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[10px] font-mono overflow-x-auto select-all max-h-36">
{`CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  brand TEXT DEFAULT 'Ensec Lithium BD',
  category TEXT DEFAULT 'Electric Vehicle (EV) Batteries',
  nominal_voltage NUMERIC(6, 2) DEFAULT 51.20,
  capacity_ah NUMERIC(6, 2) DEFAULT 86.00,
  energy_wh NUMERIC(10, 2) DEFAULT 4403.20,
  battery_type TEXT DEFAULT 'LiFePO4',
  chemistry TEXT DEFAULT 'Lifepo4',
  normal_voltage TEXT DEFAULT '51.2V',
  rated_capacity TEXT DEFAULT '51.2V86Ah',
  cycle_life TEXT DEFAULT '>4000',
  typical_capacity_kwh TEXT DEFAULT '4.40KWH',
  max_charge_current TEXT DEFAULT '50A',
  standard_charging TEXT DEFAULT 'CC/CV, 0.5C, 58.4V.',
  max_discharge_current TEXT DEFAULT '120A/150A/200A',
  weight_kg TEXT DEFAULT '40KG (±)2%',
  dimension_cm TEXT DEFAULT '50*36*26',
  operating_temperature TEXT DEFAULT '0-60°C',
  mileage_km TEXT DEFAULT '80-90KM with Full Charge.',
  trade_price_bdt NUMERIC(12, 2) DEFAULT 0.00,
  distributor_price_bdt NUMERIC(12, 2) DEFAULT 85000.00,
  dealer_price_bdt NUMERIC(12, 2) DEFAULT 89000.00,
  corporate_price_bdt NUMERIC(12, 2) DEFAULT 92000.00,
  project_price_bdt NUMERIC(12, 2) DEFAULT 88000.00,
  retail_price_bdt NUMERIC(12, 2) DEFAULT 98000.00,
  mrp_bdt NUMERIC(12, 2) DEFAULT 98000.00,
  assembly_cost_estimate_bdt NUMERIC(12, 2) DEFAULT 4500.00,
  category_prices JSONB DEFAULT '{}'::jsonb,
  warranty_months INT DEFAULT 36,
  stock_quantity INT DEFAULT 0,
  unit TEXT DEFAULT 'Units',
  bom JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400">
                Connected Project: <code className="font-mono">{supabaseUrlInput.split('//')[1]?.split('.')[0] || 'unknown'}</code>
              </span>
              <button
                type="button"
                onClick={() => setShowSupabaseModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 cursor-pointer hover:opacity-90"
              >
                Done & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
