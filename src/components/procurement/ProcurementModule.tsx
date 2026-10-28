import React, { useState } from 'react';
import {
  ShoppingBag,
  PlusCircle,
  Ship,
  FileCheck2,
  DollarSign,
  Building2,
  ArrowRight,
  CheckCircle2,
  Package,
  Layers,
  Calculator,
  Search,
  Filter,
  Tag,
  AlertTriangle,
  TrendingUp,
  Box,
  Edit3,
  Trash2,
  Check,
  Truck,
  Cpu,
  Info,
  Sparkles,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { ImportPurchaseOrder, RawMaterial, Supplier } from '../../types/erp.ts';

export const ProcurementModule: React.FC = () => {
  const {
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    rawMaterials,
    addRawMaterial,
    updateRawMaterial,
    importOrders,
    addImportOrder,
    updateImportOrderStatus,
    currentUser,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'materials' | 'shipments' | 'suppliers'>('shipments');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showCreateMaterialModal, setShowCreateMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  // Supplier management state
  const [showCreateSupplierModal, setShowCreateSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [supplierSearch, setSupplierSearch] = useState('');

  // Create Supplier Form State
  const [supName, setSupName] = useState('');
  const [supCode, setSupCode] = useState('');
  const [supCountry, setSupCountry] = useState('China (Shenzhen, Guangdong)');
  const [supContactPerson, setSupContactPerson] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supMaterials, setSupMaterials] = useState('');
  const [supRating, setSupRating] = useState<number>(4.8);
  const [supBalanceBDT, setSupBalanceBDT] = useState<number>(0);

  // Raw Material Search and Filter
  const [materialSearch, setMaterialSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Create Raw Material Form State
  const [matCode, setMatCode] = useState('');
  const [matName, setMatName] = useState('');
  const [matCategory, setMatCategory] = useState<RawMaterial['category']>('Cell');
  const [matUnit, setMatUnit] = useState('Pieces');
  const [matStockKushtia, setMatStockKushtia] = useState<number>(1000);
  const [matReorderLevel, setMatReorderLevel] = useState<number>(200);
  const [matLastPurchaseUnitCostBDT, setMatLastPurchaseUnitCostBDT] = useState<number>(3850);
  const [matStandardCostBDT, setMatStandardCostBDT] = useState<number>(3800);

  // Stock Adjustment State
  const [stockAdjustmentModalMaterial, setStockAdjustmentModalMaterial] = useState<RawMaterial | null>(null);
  const [adjustedStockQty, setAdjustedStockQty] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('New Shipment Receipt / Physical Count Audit');

  // PO Form state
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [lcNumber, setLcNumber] = useState('');
  const [blNumber, setBlNumber] = useState('');
  const [containerNumber, setContainerNumber] = useState('');
  const [shippingLine, setShippingLine] = useState('MSC Logistics');
  const [exchangeRateBDT, setExchangeRateBDT] = useState(122.5);

  // Cost items in PO
  const [selectedMaterialId, setSelectedMaterialId] = useState(rawMaterials[0]?.id || '');
  const [materialQty, setMaterialQty] = useState(2000);
  const [unitPriceUSD, setUnitPriceUSD] = useState(30.0);

  const [freightCostBDT, setFreightCostBDT] = useState(450000);
  const [customsDutyBDT, setCustomsDutyBDT] = useState(1200000);
  const [portChargesBDT, setPortChargesBDT] = useState(250000);
  const [clearingAgentFeeBDT, setClearingAgentFeeBDT] = useState(90000);
  const [insuranceBDT, setInsuranceBDT] = useState(60000);

  // Configurable cost contribution (default 50:50)
  const [ensecSharePercent, setEnsecSharePercent] = useState(50);

  const materialCostUSD = materialQty * unitPriceUSD;
  const materialCostBDT = materialCostUSD * exchangeRateBDT;
  const totalLandedCostBDT =
    materialCostBDT + freightCostBDT + customsDutyBDT + portChargesBDT + clearingAgentFeeBDT + insuranceBDT;

  const optimumSharePercent = 100 - ensecSharePercent;
  const ensecContributionBDT = Math.round((totalLandedCostBDT * ensecSharePercent) / 100);
  const optimumContributionBDT = Math.round((totalLandedCostBDT * optimumSharePercent) / 100);

  // Auto-generate suggested code when category changes
  const handleCategoryChange = (cat: RawMaterial['category']) => {
    setMatCategory(cat);
    const prefixMap: Record<RawMaterial['category'], string> = {
      Cell: 'RM-CELL',
      BMS: 'RM-BMS',
      Casing: 'RM-CASE',
      Connector: 'RM-CONN',
      'Wire & Busbar': 'RM-BUSBAR',
      PCB: 'RM-PCB',
      'Insulation & Pack': 'RM-INSUL',
    };
    const prefix = prefixMap[cat] || 'RM-MAT';
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setMatCode(`${prefix}-${randomSuffix}`);
  };

  const handleOpenCreateMaterial = () => {
    handleCategoryChange('Cell');
    setMatName('');
    setMatUnit('Pieces');
    setMatStockKushtia(1000);
    setMatReorderLevel(250);
    setMatLastPurchaseUnitCostBDT(3850);
    setMatStandardCostBDT(3800);
    setShowCreateMaterialModal(true);
  };

  const handleCreateMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName.trim()) return;

    const generatedCode = matCode.trim() || `RM-${Math.floor(1000 + Math.random() * 9000)}`;

    addRawMaterial({
      code: generatedCode,
      name: matName.trim(),
      category: matCategory,
      unit: matUnit,
      stockKushtia: Number(matStockKushtia) || 0,
      reorderLevel: Number(matReorderLevel) || 100,
      lastPurchaseUnitCostBDT: Number(matLastPurchaseUnitCostBDT) || 0,
      standardCostBDT: Number(matStandardCostBDT) || 0,
    });

    setShowCreateMaterialModal(false);
  };

  const handleUpdateMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    updateRawMaterial(editingMaterial.id, {
      name: editingMaterial.name,
      code: editingMaterial.code,
      category: editingMaterial.category,
      unit: editingMaterial.unit,
      stockKushtia: Number(editingMaterial.stockKushtia),
      reorderLevel: Number(editingMaterial.reorderLevel),
      lastPurchaseUnitCostBDT: Number(editingMaterial.lastPurchaseUnitCostBDT),
      standardCostBDT: Number(editingMaterial.standardCostBDT),
    });

    setEditingMaterial(null);
  };

  const handleSaveStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustmentModalMaterial) return;

    updateRawMaterial(stockAdjustmentModalMaterial.id, {
      stockKushtia: Number(adjustedStockQty),
    });

    setStockAdjustmentModalMaterial(null);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === supplierId);
    const mat = rawMaterials.find((m) => m.id === selectedMaterialId);
    if (!sup || !mat) return;

    const poNumber = `IMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    addImportOrder({
      poNumber,
      date: new Date().toISOString().substring(0, 10),
      supplierId: sup.id,
      supplierName: sup.name,
      status: 'Submitted',
      currency: 'USD',
      exchangeRateBDT,
      lcNumber: lcNumber || `LC-EBL-${Date.now().toString().slice(-4)}`,
      blNumber: blNumber || `BL-SHA-CGP-${Date.now().toString().slice(-4)}`,
      containerNumber: containerNumber || `TGHU-${Math.floor(100000 + Math.random() * 900000)}-1`,
      shippingLine,
      items: [
        {
          materialId: mat.id,
          materialName: mat.name,
          quantity: Number(materialQty),
          unitPriceUSD: Number(unitPriceUSD),
          totalUSD: materialCostUSD,
        },
      ],
      materialCostUSD,
      materialCostBDT,
      freightCostBDT: Number(freightCostBDT),
      customsDutyBDT: Number(customsDutyBDT),
      portChargesBDT: Number(portChargesBDT),
      clearingAgentFeeBDT: Number(clearingAgentFeeBDT),
      insuranceBDT: Number(insuranceBDT),
      totalLandedCostBDT,
      ensecSharePercent,
      optimumSharePercent,
      ensecContributionBDT,
      optimumContributionBDT,
      settlementStatus: 'Pending',
    });

    setShowNewOrderModal(false);
  };

  // Supplier handlers
  const handleOpenCreateSupplier = () => {
    setSupName('');
    setSupCode(`SUP-CHN-${(suppliers.length + 1).toString().padStart(2, '0')}`);
    setSupCountry('China (Shenzhen, Guangdong)');
    setSupContactPerson('');
    setSupPhone('+86 ');
    setSupEmail('');
    setSupMaterials('LiFePO4 Cells, Smart BMS');
    setSupRating(4.8);
    setSupBalanceBDT(0);
    setShowCreateSupplierModal(true);
  };

  const handleCreateSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName || !supCode) return;

    const materialsArray = supMaterials
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    addSupplier({
      code: supCode,
      name: supName,
      country: supCountry,
      contactPerson: supContactPerson,
      phone: supPhone,
      email: supEmail,
      materialsSupplied: materialsArray.length > 0 ? materialsArray : ['Lithium Battery Components'],
      rating: Number(supRating) || 4.5,
      balanceBDT: Number(supBalanceBDT) || 0,
    });

    setShowCreateSupplierModal(false);
  };

  const handleUpdateSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;

    updateSupplier(editingSupplier.id, {
      code: editingSupplier.code,
      name: editingSupplier.name,
      country: editingSupplier.country,
      contactPerson: editingSupplier.contactPerson,
      phone: editingSupplier.phone,
      email: editingSupplier.email,
      materialsSupplied: editingSupplier.materialsSupplied,
      rating: Number(editingSupplier.rating),
      balanceBDT: Number(editingSupplier.balanceBDT),
    });

    setEditingSupplier(null);
  };

  const handleDeleteSupplier = (id: string) => {
    deleteSupplier(id);
    setDeletingSupplier(null);
  };

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    const q = supplierSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.materialsSupplied.some((m) => m.toLowerCase().includes(q))
    );
  });

  // Filtered raw materials
  const filteredMaterials = rawMaterials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
      m.code.toLowerCase().includes(materialSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(materialSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalRawValuationBDT = rawMaterials.reduce(
    (sum, m) => sum + m.stockKushtia * m.lastPurchaseUnitCostBDT,
    0
  );
  const totalRawStockUnits = rawMaterials.reduce((sum, m) => sum + m.stockKushtia, 0);
  const lowStockMaterials = rawMaterials.filter((m) => m.stockKushtia <= m.reorderLevel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Raw Material Procurement & SCM
            </h1>
          </div>
          
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'materials'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Raw Materials Master & Stock</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {rawMaterials.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('shipments')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'shipments'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Ship className="w-4 h-4" />
            <span>Import Consignments)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {importOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'suppliers'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Suppliers</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              {suppliers.length}
            </span>
          </button>
        </div>
      </div>

      {/* SCM Top Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Raw Material SKUs</span>
            <Box className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {rawMaterials.length} Items
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            {totalRawStockUnits.toLocaleString()} Units in Factory
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Raw Inventory Value</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
            ৳ {totalRawValuationBDT.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">Factory Valuation</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Reorder Level Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {lowStockMaterials.length} Items Low
          </div>
          <div className="text-[11px] text-slate-400">Below minimum buffer</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Co-Funded</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 font-mono">
            ৳ {importOrders.reduce((sum, o) => sum + o.optimumContributionBDT, 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-purple-500">Joint import participation</div>
        </div>
      </div>

      {/* TAB 1: RAW MATERIALS MASTER CATALOG & KUSHTIA STOCK */}
      {activeTab === 'materials' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-4 p-5">
          {/* Action Header & Explainer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                  Raw Materials Registry & Factory Stock
                </h2>
                
              </div>
              
            </div>

            <button
              onClick={handleOpenCreateMaterial}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs self-start sm:self-auto shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add New Raw Material</span>
            </button>
          </div>

          {/* Search & Category Filter Pills */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search raw materials by code (e.g. RM-CELL-105) or name..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
              {(
                [
                  'ALL',
                  'Cell',
                  'BMS',
                  'Casing',
                  'Wire & Busbar',
                  'Insulation & Pack',
                  'Connector',
                  'PCB',
                ] as const
              ).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap text-[11px] transition-all ${
                    categoryFilter === cat
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Raw Materials Grid / Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Material Code & Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3 text-right">Stock</th>
                  <th className="p-3 text-right">Reorder Level</th>
                  <th className="p-3 text-right">Last Landed Cost</th>
                  <th className="p-3 text-right">Standard Cost</th>
                  <th className="p-3 text-right">Total Valuation</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredMaterials.map((rm) => {
                  const isLow = rm.stockKushtia <= rm.reorderLevel;
                  const itemValuationBDT = rm.stockKushtia * rm.lastPurchaseUnitCostBDT;

                  return (
                    <tr key={rm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {rm.code}
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                          {rm.name}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {rm.category}
                        </span>
                      </td>

                      <td className="p-3 text-slate-500">{rm.unit}</td>

                      <td className="p-3 text-right">
                        <span
                          className={`font-mono font-black text-sm ${
                            isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {rm.stockKushtia.toLocaleString()}
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono text-slate-500">
                        {rm.reorderLevel.toLocaleString()}
                      </td>

                      <td className="p-3 text-right font-mono text-slate-800 dark:text-slate-200 font-bold">
                        ৳ {rm.lastPurchaseUnitCostBDT.toLocaleString()}
                      </td>

                      <td className="p-3 text-right font-mono text-slate-500">
                        ৳ {rm.standardCostBDT.toLocaleString()}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ৳ {itemValuationBDT.toLocaleString()}
                      </td>

                      <td className="p-3 text-center">
                        {isLow ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Adequate Stock
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setStockAdjustmentModalMaterial(rm);
                              setAdjustedStockQty(rm.stockKushtia);
                            }}
                            className="px-2 py-1 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100"
                            title="Adjust Kushtia Factory Stock"
                          >
                            Adjust Stock
                          </button>

                          <button
                            onClick={() => setEditingMaterial(rm)}
                            className="px-2 py-1 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100"
                            title="Edit Material Specifications"
                          >
                            Edit
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
      )}

      {/* TAB 2: IMPORT CONSIGNMENTS & 50:50 COST SHARING */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                
                
              </div>
              <button
                onClick={() => setShowNewOrderModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs self-start sm:self-auto"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>+ New Import Consignment PO</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">PO Number & Date</th>
                    <th className="p-3">Supplier & Material</th>
                    <th className="p-3">L/C & BL Number</th>
                    <th className="p-3">Container Info</th>
                    <th className="p-3">Landed Cost (BDT)</th>
                    <th className="p-3">Ensec 50% / Optimum 50%</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {importOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{order.poNumber}</div>
                        <div className="text-[10px] text-slate-400">{order.date}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{order.supplierName}</div>
                        <div className="text-[11px] text-slate-500">
                          {order.items.map((it) => `${it.quantity}x ${it.materialName}`).join(', ')}
                        </div>
                      </td>
                      <td className="p-3 font-mono">
                        <div>{order.lcNumber}</div>
                        <div className="text-[10px] text-slate-400">{order.blNumber}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-slate-800 dark:text-slate-200">{order.containerNumber}</div>
                        <div className="text-[10px] text-slate-400">{order.shippingLine}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        ৳ {order.totalLandedCostBDT.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono">
                        <div className="text-blue-600 dark:text-blue-400">
                          Ensec ({order.ensecSharePercent}%): ৳ {order.ensecContributionBDT.toLocaleString()}
                        </div>
                        <div className="text-purple-600 dark:text-purple-400">
                          Optimum ({order.optimumSharePercent}%): ৳ {order.optimumContributionBDT.toLocaleString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.status === 'Received Kushtia'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : order.status === 'Port Clearance'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {order.status !== 'Received Kushtia' && (
                          <button
                            onClick={() => updateImportOrderStatus(order.id, 'Received Kushtia')}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] transition-colors"
                            title="Receive raw materials at Kushtia plant, increment Kushtia raw stock & record 50% Optimum JV share"
                          >
                            Receive @ Kushtia
                          </button>
                        )}
                        {order.status === 'Received Kushtia' && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>In Stock</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHINA SCM SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Verified China Lithium Raw Material Suppliers</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  {filteredSuppliers.length} Vendors
                </span>
              </h2>
              
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleOpenCreateSupplier}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add New Supplier</span>
              </button>
            </div>
          </div>

          {/* Supplier Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search suppliers by company name, code, contact person, or materials..."
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              className="w-full pl-9.5 pr-14 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            {supplierSearch && (
              <button
                onClick={() => setSupplierSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {filteredSuppliers.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No suppliers matched your search</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try a different search term or register a new vendor.</p>
              <button
                onClick={handleOpenCreateSupplier}
                className="mt-3 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Supplier</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSuppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          {sup.code}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{sup.name}</h3>
                        <p className="text-xs text-slate-500">{sup.country}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                        ⭐ {sup.rating} Rating
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                      <div className="text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400 block text-[10px] font-medium uppercase">Contact Person</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{sup.contactPerson}</span>
                        <div className="text-[11px] text-slate-500">{sup.phone}</div>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400 block text-[10px] font-medium uppercase">Email & Outstanding</span>
                        <div className="font-medium truncate text-slate-800 dark:text-slate-200" title={sup.email}>{sup.email}</div>
                        <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold font-mono">
                          ৳ {sup.balanceBDT ? sup.balanceBDT.toLocaleString() : '0'} Due
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        RAW MATERIALS SUPPLIED:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sup.materialsSupplied.map((mat, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            {mat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingSupplier(sup)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingSupplier(sup)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE NEW RAW MATERIAL */}
      {showCreateMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Register New Raw Material
                </h3>
              </div>
              <button
                onClick={() => setShowCreateMaterialModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMaterialSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Material Category *
                  </label>
                  <select
                    value={matCategory}
                    onChange={(e) => handleCategoryChange(e.target.value as RawMaterial['category'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Cell">Cell (Prismatic / Cylindrical / Blade)</option>
                    <option value="BMS">BMS (Battery Management System)</option>
                    <option value="Casing">Casing (Rack Steel / ABS Enclosure)</option>
                    <option value="Wire & Busbar">Wire & Busbar (Nickel / Copper)</option>
                    <option value="Insulation & Pack">Insulation & Pack (Epoxy / Pad)</option>
                    <option value="Connector">Connector (Laser Stud / Anderson)</option>
                    <option value="PCB">PCB & Monitoring Board</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Material Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RM-CELL-280"
                    value={matCode}
                    onChange={(e) => setMatCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Material Full Name / Specification *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LiFePO4 Prismatic Cell 3.2V 280Ah Grade A (CATL / EVE)"
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Unit of Measure *
                  </label>
                  <select
                    value={matUnit}
                    onChange={(e) => setMatUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Pieces">Pieces (Pcs)</option>
                    <option value="Units">Units</option>
                    <option value="Sets">Sets</option>
                    <option value="Kits">Kits</option>
                    <option value="Sheets">Sheets</option>
                    <option value="Meters">Meters</option>
                    <option value="Kg">Kilograms (Kg)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Initial Kushtia Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matStockKushtia}
                    onChange={(e) => setMatStockKushtia(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matReorderLevel}
                    onChange={(e) => setMatReorderLevel(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Last Purchase Landed Cost (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matLastPurchaseUnitCostBDT}
                    onChange={(e) => setMatLastPurchaseUnitCostBDT(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Standard Cost (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matStandardCostBDT}
                    onChange={(e) => setMatStandardCostBDT(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  Once registered, this raw material will be selectable when creating China Import POs, configuring Kushtia Factory Bills of Materials (BOM), and checking Kushtia plant inventory.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateMaterialModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Save Raw Material</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT RAW MATERIAL */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Edit Raw Material Specifications
              </h3>
              <button
                onClick={() => setEditingMaterial(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateMaterialSubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Code</label>
                <input
                  type="text"
                  value={editingMaterial.code}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, code: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Name</label>
                <input
                  type="text"
                  value={editingMaterial.name}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Last Landed Unit Cost (BDT)
                  </label>
                  <input
                    type="number"
                    value={editingMaterial.lastPurchaseUnitCostBDT}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        lastPurchaseUnitCostBDT: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    value={editingMaterial.reorderLevel}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        reorderLevel: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Update Specifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADJUST KUSHTIA STOCK */}
      {stockAdjustmentModalMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Adjust Kushtia Factory Stock
              </h3>
              <button
                onClick={() => setStockAdjustmentModalMaterial(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="font-mono text-[10px] text-blue-600 font-bold">
                  {stockAdjustmentModalMaterial.code}
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  {stockAdjustmentModalMaterial.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Current Stock: <b>{stockAdjustmentModalMaterial.stockKushtia} {stockAdjustmentModalMaterial.unit}</b>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  New Stock Count ({stockAdjustmentModalMaterial.unit}) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustedStockQty}
                  onChange={(e) => setAdjustedStockQty(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Adjustment Reason
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStockAdjustmentModalMaterial(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  Confirm Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: NEW CHINA IMPORT PO WITH 50:50 CALCULATOR */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Create China Import Order & Landed Costing
                </h3>
              </div>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    China Supplier
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Raw Material to Import
                  </label>
                  <select
                    value={selectedMaterialId}
                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    {rawMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        [{m.category}] {m.name} ({m.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantities & Unit Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={materialQty}
                    onChange={(e) => setMaterialQty(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Unit Price (USD $)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={unitPriceUSD}
                    onChange={(e) => setUnitPriceUSD(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    USD to BDT Rate
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={exchangeRateBDT}
                    onChange={(e) => setExchangeRateBDT(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Shipping & Customs Logistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Letter of Credit (L/C)</label>
                  <input
                    type="text"
                    placeholder="LC-EBL-8891"
                    value={lcNumber}
                    onChange={(e) => setLcNumber(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Bill of Lading (B/L)</label>
                  <input
                    type="text"
                    placeholder="BL-SHA-CGP-1092"
                    value={blNumber}
                    onChange={(e) => setBlNumber(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Container Number</label>
                  <input
                    type="text"
                    placeholder="TGHU-948291-0"
                    value={containerNumber}
                    onChange={(e) => setContainerNumber(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Additional Landed Cost Elements */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Chittagong Port & Clearing Duties (BDT):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Freight Charges</label>
                    <input
                      type="number"
                      value={freightCostBDT}
                      onChange={(e) => setFreightCostBDT(Number(e.target.value))}
                      className="w-full p-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Customs Duty (NBR)</label>
                    <input
                      type="number"
                      value={customsDutyBDT}
                      onChange={(e) => setCustomsDutyBDT(Number(e.target.value))}
                      className="w-full p-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Port / Berth Fees</label>
                    <input
                      type="number"
                      value={portChargesBDT}
                      onChange={(e) => setPortChargesBDT(Number(e.target.value))}
                      className="w-full p-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">C&F Agent Fee</label>
                    <input
                      type="number"
                      value={clearingAgentFeeBDT}
                      onChange={(e) => setClearingAgentFeeBDT(Number(e.target.value))}
                      className="w-full p-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic 50:50 Ensec–Optimum Participation Calculator */}
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-900 dark:text-blue-200">
                    Joint SCM Participation Ratio:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                      Ensec: {ensecSharePercent}%
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                      Optimum: {optimumSharePercent}%
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={ensecSharePercent}
                  onChange={(e) => setEnsecSharePercent(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-blue-200/60 dark:border-blue-800/60 font-mono text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Landed Cost</span>
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      ৳ {totalLandedCostBDT.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-600 block">Ensec Share ({ensecSharePercent}%)</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      ৳ {ensecContributionBDT.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-600 block">Optimum Share ({optimumSharePercent}%)</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300">
                      ৳ {optimumContributionBDT.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Ship className="w-4 h-4" />
                  <span>Book Import Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE SCM SUPPLIER */}
      {showCreateSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Add New China SCM Supplier
                </h3>
              </div>
              <button
                onClick={() => setShowCreateSupplierModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplierSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Supplier Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={supCode}
                    onChange={(e) => setSupCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    placeholder="e.g. SUP-CATL"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Quality Rating (1.0 - 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={supRating}
                    onChange={(e) => setSupRating(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Company / Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. Shenzhen Daly Electronics Co. Ltd."
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Country & Location *
                </label>
                <input
                  type="text"
                  required
                  value={supCountry}
                  onChange={(e) => setSupCountry(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. China (Shenzhen, Guangdong)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={supContactPerson}
                    onChange={(e) => setSupContactPerson(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. Mr. David Zhang"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Phone / WeChat *
                  </label>
                  <input
                    type="text"
                    required
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    placeholder="e.g. +86 755 282 3456"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    placeholder="e.g. export@vendor.com"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Outstanding Balance (BDT)
                  </label>
                  <input
                    type="number"
                    value={supBalanceBDT}
                    onChange={(e) => setSupBalanceBDT(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Materials Supplied (comma-separated)
                </label>
                <input
                  type="text"
                  value={supMaterials}
                  onChange={(e) => setSupMaterials(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. LiFePO4 3.2V 105Ah Cell, Smart 16S BMS"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateSupplierModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Save Supplier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT SCM SUPPLIER */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Edit Supplier Profile
                </h3>
              </div>
              <button
                onClick={() => setEditingSupplier(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSupplierSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Supplier Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.code}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, code: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Quality Rating (1.0 - 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={editingSupplier.rating}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, rating: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Company / Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingSupplier.name}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Country & Location *
                </label>
                <input
                  type="text"
                  required
                  value={editingSupplier.country}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, country: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.contactPerson}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, contactPerson: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Phone / WeChat *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.phone}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingSupplier.email}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Outstanding Balance (BDT)
                  </label>
                  <input
                    type="number"
                    value={editingSupplier.balanceBDT}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, balanceBDT: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Materials Supplied (comma-separated)
                </label>
                <input
                  type="text"
                  value={editingSupplier.materialsSupplied.join(', ')}
                  onChange={(e) =>
                    setEditingSupplier({
                      ...editingSupplier,
                      materialsSupplied: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Update Supplier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: DELETE SCM SUPPLIER CONFIRMATION */}
      {deletingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Supplier</h3>
              <p className="text-slate-500">
                Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">{deletingSupplier.name}</span> ({deletingSupplier.code})?
              </p>
              <p className="text-[11px] text-rose-500 font-medium pt-1">
                This vendor will be removed from your active SCM supplier catalog.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSupplier(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSupplier(deletingSupplier.id)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs transition-colors"
              >
                Delete Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
