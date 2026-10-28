import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Box,
  Warehouse as WarehouseIcon,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  Truck,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  Info,
  Calendar,
  Building2,
  DollarSign,
  Tag,
  Eye,
  X,
  FileSpreadsheet,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { Product, Warehouse, StockTransfer } from '../../types/erp.ts';

interface InventoryStockPageProps {
  onNavigate?: (module: string) => void;
}

export const InventoryStockPage: React.FC<InventoryStockPageProps> = ({ onNavigate }) => {
  const {
    products,
    warehouses,
    categories,
    openingStockRecords,
    cidStockReceipts,
    stockIssueRecords,
    stockTransfers,
    primaryReturnRecords,
    stockAdjustmentRecords,
    salesOrders,
    createStockTransfer,
    adjustStock,
    currentUser,
  } = useERP();

  // Helper to normalize category name so no obsolete session memory appears
  const getProductCategory = (cat?: string): string => {
    if (!cat) return '';
    const clean = cat.trim();
    if (clean.toLowerCase() === 'telecom energy storage') return 'ENPOWER';
    return clean;
  };

  // View mode: 'matrix' (Warehouse Table Matrix), 'cards' (Warehouse Cards), 'products' (Product Cards)
  const [viewMode, setViewMode] = useState<'matrix' | 'cards' | 'products'>('matrix');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockLevelFilter, setStockLevelFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');

  // Packaging & Carton Conversion Config
  // Default carton rate: 10 pieces per carton (e.g. 100 CTN / 1,000 PCS)
  const [defaultCartonRate, setDefaultCartonRate] = useState<number>(10);
  const [customCartonRates, setCustomCartonRates] = useState<Record<string, number>>({});
  const [showCartonConfigModal, setShowCartonConfigModal] = useState(false);

  // Quick Action Modals
  const [transferModalProduct, setTransferModalProduct] = useState<{
    product: Product;
    fromWarehouseId: string;
  } | null>(null);
  const [transferToWarehouseId, setTransferToWarehouseId] = useState('');
  const [transferQtyPcs, setTransferQtyPcs] = useState<number>(1);
  const [transferDriverName, setTransferDriverName] = useState('');
  const [transferTruckNo, setTransferTruckNo] = useState('');

  const [adjustModalProduct, setAdjustModalProduct] = useState<{
    product: Product;
    warehouseId: string;
  } | null>(null);
  const [adjustQtyDelta, setAdjustQtyDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Selected product deep-dive modal
  const [inspectProduct, setInspectProduct] = useState<Product | null>(null);

  // Helper to get carton rate for a product
  const getCartonRate = (prod: Product): number => {
    if (customCartonRates[prod.id]) return customCartonRates[prod.id];
    if (prod.pcsPerCarton && prod.pcsPerCarton > 0) return prod.pcsPerCarton;
    return defaultCartonRate > 0 ? defaultCartonRate : 10;
  };

  // Helper to calculate total invoiced sales order quantity for a product in a warehouse
  const calculateInvoicedSalesDeduction = (warehouseId: string, productId: string): number => {
    const prod = products.find((p) => p.id === productId);
    const wh = warehouses.find((w) => w.id === warehouseId);
    if (!prod || !wh) return 0;

    return (salesOrders || [])
      .filter((so) => {
        // Exclude cancelled or rejected orders
        if (so.status === 'Cancelled' || so.status === 'Rejected') return false;

        // Invoiced condition:
        // Status has 'invoice', 'dispatch', or 'delivered', or has an assigned invoiceNumber / invoiceNo
        const s = (so.status || '').toLowerCase().trim();
        const isInvoiced =
          s.includes('invoice') ||
          s.includes('dispatch') ||
          s === 'delivered' ||
          Boolean((so.invoiceNumber && so.invoiceNumber.trim()) || (so.invoiceNo && so.invoiceNo.trim()));

        if (!isInvoiced) return false;

        // Warehouse matching
        const orderWhId = String(so.warehouseId || '').toLowerCase().trim();
        const curWhId = String(warehouseId || '').toLowerCase().trim();
        const orderWhName = (so.warehouseName || '').toLowerCase().trim();
        const curWhName = (wh.name || '').toLowerCase().trim();

        const matchWh =
          orderWhId === curWhId ||
          (orderWhId && curWhId && orderWhId.replace('wh-', '') === curWhId.replace('wh-', '')) ||
          (orderWhName && curWhName && (orderWhName === curWhName || curWhName.includes(orderWhName) || orderWhName.includes(curWhName))) ||
          (!orderWhId && warehouseId === warehouses[0]?.id);

        return matchWh;
      })
      .reduce((sum, so) => {
        const matchingItems = (so.items || []).filter((item) => {
          const itemProdId = String(item.productId || '').toLowerCase().trim();
          const targetProdId = String(prod.id || '').toLowerCase().trim();
          const targetProdCode = String(prod.code || '').toLowerCase().trim();
          const itemProdName = (item.productName || '').toLowerCase().trim();
          const targetProdName = (prod.name || '').toLowerCase().trim();

          return (
            itemProdId === targetProdId ||
            (targetProdCode && (itemProdId === targetProdCode || ((item as any).sku && String((item as any).sku).toLowerCase().trim() === targetProdCode))) ||
            (itemProdId && targetProdId && itemProdId.replace(/^(fp-|prod-|p-)/, '') === targetProdId.replace(/^(fp-|prod-|p-)/, '')) ||
            (itemProdName && targetProdName && (itemProdName === targetProdName || targetProdName.includes(itemProdName) || itemProdName.includes(targetProdName)))
          );
        });
        return sum + matchingItems.reduce((iSum, item) => iSum + (Number(item.quantity) || 0), 0);
      }, 0);
  };

  // Helper to calculate finished stock pieces for a specific product in a specific warehouse
  const calculateWarehouseStock = (warehouseId: string, productId: string): number => {
    const prod = products.find((p) => p.id === productId);
    const wh = warehouses.find((w) => w.id === warehouseId);
    if (!prod || !wh) return 0;

    // 1. Opening stock for this product in this warehouse
    const openingStock = openingStockRecords
      .filter((rec) => {
        const matchWh = rec.warehouseId === warehouseId || rec.warehouseName?.toLowerCase() === wh.name.toLowerCase();
        const matchProd = rec.productId === productId || rec.sku === prod.code || rec.productName?.toLowerCase() === prod.name?.toLowerCase();
        return matchWh && matchProd;
      })
      .reduce((sum, rec) => sum + (Number(rec.quantity) || 0), 0);

    // 2. CID stock receipts (inward)
    const cidStock = cidStockReceipts
      .filter((receipt) => {
        const matchWh = receipt.warehouseId === warehouseId || receipt.warehouseName?.toLowerCase() === wh.name.toLowerCase();
        return matchWh && receipt.status !== 'Rejected';
      })
      .reduce((sum, receipt) => {
        const matchingItems = (receipt.items || []).filter(
          (item) => item.productId === productId || item.sku === prod.code || item.productName?.toLowerCase() === prod.name?.toLowerCase()
        );
        return sum + matchingItems.reduce((iSum, item) => iSum + (Number(item.receivedQty || item.quantity) || 0), 0);
      }, 0);

    // 3. Stock Transfers received (adds to dest)
    const transfersIn = stockTransfers
      .filter((t) => {
        const matchDest = t.destWarehouseId === warehouseId || t.toWarehouseId === warehouseId;
        const matchProd = t.productId === productId || t.productName?.toLowerCase() === prod.name?.toLowerCase();
        return matchDest && matchProd && t.status === 'Received';
      })
      .reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);

    // 4. Stock Transfers sent (deducts from source)
    const transfersOut = stockTransfers
      .filter((t) => {
        const matchSrc = t.sourceWarehouseId === warehouseId || t.fromWarehouseId === warehouseId;
        const matchProd = t.productId === productId || t.productName?.toLowerCase() === prod.name?.toLowerCase();
        return matchSrc && matchProd && (t.status === 'Received' || t.status === 'In Transit');
      })
      .reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);

    // 5. Stock Issues (deducts issued quantities)
    const issuesOut = stockIssueRecords
      .filter((rec) => {
        const matchWh = rec.warehouseId === warehouseId || rec.sourceWarehouseId === warehouseId;
        return matchWh;
      })
      .reduce((sum, rec) => {
        const matchingItems = (rec.items || []).filter(
          (item) => item.productId === productId || item.sku === prod.code || item.productName?.toLowerCase() === prod.name?.toLowerCase()
        );
        return sum + matchingItems.reduce((iSum, item) => iSum + (Number(item.quantity) || 0), 0);
      }, 0);

    // 6. Invoiced Sales Orders (deducts invoiced/dispatched products)
    const invoicedSalesOut = calculateInvoicedSalesDeduction(warehouseId, productId);

    // 7. Primary Returns (adds returned units)
    const returnsIn = primaryReturnRecords
      .filter((rec) => {
        const matchWh = rec.warehouseId === warehouseId;
        const matchProd = rec.productId === productId || rec.sku === prod.code;
        return matchWh && matchProd;
      })
      .reduce((sum, rec) => sum + (Number(rec.quantity) || 0), 0);

    // 8. Stock Adjustments (adds or subtracts delta)
    const adjustments = stockAdjustmentRecords
      .filter((rec) => {
        const matchWh = rec.warehouseId === warehouseId;
        const matchProd = rec.productId === productId || rec.sku === prod.code;
        return matchWh && matchProd;
      })
      .reduce((sum, rec) => sum + (Number(rec.qtyDelta ?? (rec.newQty - rec.previousQty)) || 0), 0);

    const netCalculated =
      openingStock +
      cidStock +
      transfersIn -
      transfersOut -
      issuesOut -
      invoicedSalesOut +
      returnsIn +
      adjustments;

    // Return net calculated stock strictly from actual records (clamped at 0)
    return Math.max(0, netCalculated);
  };

  // Convert raw pieces into formatted Carton & Piece Breakdown
  const formatCartonPiece = (pieces: number, cartonRate: number) => {
    const rate = cartonRate > 0 ? cartonRate : 10;
    const cartons = Math.floor(pieces / rate);
    const loose = pieces % rate;
    return {
      cartons,
      loose,
      totalPieces: pieces,
      rate,
      // e.g. "100 CTN / 1,000 PCS" or "100/1000pcs"
      displayPrimary: `${cartons.toLocaleString()} CTN / ${pieces.toLocaleString()} PCS`,
      displayCompact: `${cartons}/${pieces}pcs`,
      looseDetail: loose > 0 ? `+${loose} loose pcs` : 'Full cartons',
    };
  };

  // Calculate master data metrics
  const inventoryMatrix = useMemo(() => {
    return products.map((prod) => {
      const cartonRate = getCartonRate(prod);
      const warehouseStocks: Record<string, { pieces: number; cartons: number; loose: number; display: string }> = {};
      let totalPieces = 0;

      warehouses.forEach((wh) => {
        const pieces = calculateWarehouseStock(wh.id, prod.id);
        const ctnData = formatCartonPiece(pieces, cartonRate);
        warehouseStocks[wh.id] = {
          pieces,
          cartons: ctnData.cartons,
          loose: ctnData.loose,
          display: ctnData.displayPrimary,
        };
        totalPieces += pieces;
      });

      const totalCartonData = formatCartonPiece(totalPieces, cartonRate);
      const valuationBDT = totalPieces * (prod.distributorPriceBDT || 85000);

      return {
        product: prod,
        cartonRate,
        warehouseStocks,
        totalPieces,
        totalCartons: totalCartonData.cartons,
        totalLoose: totalCartonData.loose,
        displayTotal: totalCartonData.displayPrimary,
        displayCompact: totalCartonData.displayCompact,
        valuationBDT,
      };
    });
  }, [
    products,
    warehouses,
    openingStockRecords,
    cidStockReceipts,
    stockIssueRecords,
    stockTransfers,
    primaryReturnRecords,
    stockAdjustmentRecords,
    salesOrders,
    defaultCartonRate,
    customCartonRates,
  ]);

  // Filtered Inventory Matrix
  const filteredMatrix = useMemo(() => {
    return inventoryMatrix.filter((item) => {
      const prod = item.product;
      const q = searchQuery.toLowerCase().trim();

      // Search match
      const dispCat = getProductCategory(prod.category);
      const matchSearch =
        !q ||
        prod.name?.toLowerCase().includes(q) ||
        prod.code?.toLowerCase().includes(q) ||
        prod.model?.toLowerCase().includes(q) ||
        dispCat.toLowerCase().includes(q) ||
        prod.brand?.toLowerCase().includes(q);

      // Category match
      let matchCategory = true;
      if (selectedCategory !== 'all') {
        const prodCat = getProductCategory(prod.category).toLowerCase().trim();
        const selCat = selectedCategory.toLowerCase().trim();
        matchCategory =
          prodCat === selCat ||
          (selCat === 'enpower' && (prodCat.includes('telecom') || prodCat.includes('power'))) ||
          (selCat === 'enmax' && (prodCat.includes('ev') || prodCat.includes('max')));
      }

      // Warehouse filter
      let matchWarehouse = true;
      if (selectedWarehouseId !== 'all') {
        const whStock = item.warehouseStocks[selectedWarehouseId]?.pieces || 0;
        matchWarehouse = whStock > 0 || stockLevelFilter === 'all';
      }

      // Stock level match
      let matchLevel = true;
      const relevantStock =
        selectedWarehouseId === 'all' ? item.totalPieces : item.warehouseStocks[selectedWarehouseId]?.pieces || 0;

      if (stockLevelFilter === 'in-stock') matchLevel = relevantStock > 0;
      if (stockLevelFilter === 'low-stock') matchLevel = relevantStock > 0 && relevantStock < 50;
      if (stockLevelFilter === 'out-of-stock') matchLevel = relevantStock === 0;

      return matchSearch && matchCategory && matchWarehouse && matchLevel;
    });
  }, [inventoryMatrix, searchQuery, selectedCategory, selectedWarehouseId, stockLevelFilter]);

  // Overall Warehouse Totals
  const warehouseGrandTotals = useMemo(() => {
    const totals: Record<string, { pieces: number; cartons: number; valuationBDT: number }> = {};
    warehouses.forEach((wh) => {
      totals[wh.id] = { pieces: 0, cartons: 0, valuationBDT: 0 };
    });

    let overallPieces = 0;
    let overallCartons = 0;
    let overallValuation = 0;

    inventoryMatrix.forEach((item) => {
      warehouses.forEach((wh) => {
        const st = item.warehouseStocks[wh.id];
        if (st) {
          totals[wh.id].pieces += st.pieces;
          totals[wh.id].cartons += st.cartons;
          totals[wh.id].valuationBDT += st.pieces * (item.product.distributorPriceBDT || 85000);
        }
      });
      overallPieces += item.totalPieces;
      overallCartons += item.totalCartons;
      overallValuation += item.valuationBDT;
    });

    return { totals, overallPieces, overallCartons, overallValuation };
  }, [inventoryMatrix, warehouses]);

  // Product Categories from master data (single source of truth from database)
  const productCategoryList = useMemo(() => {
    // 1. Get active categories defined in the database
    const dbCategories = (categories || [])
      .filter((c) => c.status !== 'Inactive' && c.name && c.name.trim().toLowerCase() !== 'telecom energy storage')
      .map((c) => c.name.trim());

    if (dbCategories.length > 0) {
      return Array.from(new Set(dbCategories));
    }
    // 2. Fallback to the 4 system categories
    return ['ENMAX', 'ENFLEX', 'ENPOWER', 'ENGRID'];
  }, [categories]);

  // Handle Quick Transfer Submit
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalProduct || !transferToWarehouseId) return;

    const fromWh = warehouses.find((w) => w.id === transferModalProduct.fromWarehouseId);
    const toWh = warehouses.find((w) => w.id === transferToWarehouseId);
    const prod = transferModalProduct.product;

    if (!fromWh || !toWh || fromWh.id === toWh.id) return;

    createStockTransfer({
      date: new Date().toISOString().substring(0, 10),
      fromWarehouseId: fromWh.id,
      fromWarehouseName: fromWh.name,
      toWarehouseId: toWh.id,
      toWarehouseName: toWh.name,
      productId: prod.id,
      productName: prod.name,
      batchNumber: 'KUS-B2610-DISPATCH',
      quantity: Number(transferQtyPcs),
      driverName: transferDriverName,
      truckNumber: transferTruckNo,
      requestedBy: currentUser?.name || 'Supply Chain Officer',
    });

    setTransferModalProduct(null);
  };

  // Handle Quick Adjustment Submit
  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;
    adjustStock(
      adjustModalProduct.warehouseId,
      adjustModalProduct.product.id,
      Number(adjustQtyDelta),
      adjustReason
    );
    setAdjustModalProduct(null);
  };

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = [
      'Product Code',
      'Product Name',
      'Model',
      'Category',
      'Pcs Per Carton',
      ...warehouses.flatMap((wh) => [`${wh.name} (CTN)`, `${wh.name} (PCS)`, `${wh.name} (CTN/PCS)`]),
      'Total CTN',
      'Total PCS',
      'Combined CTN / PCS',
      'Distributor Price (BDT)',
      'Total Value (BDT)',
    ];

    const rows = filteredMatrix.map((item) => {
      const prod = item.product;
      const whColumns = warehouses.flatMap((wh) => {
        const st = item.warehouseStocks[wh.id] || { cartons: 0, pieces: 0, display: '0 CTN / 0 PCS' };
        return [st.cartons, st.pieces, `"${st.display}"`];
      });

      return [
        `"${prod.code || ''}"`,
        `"${prod.name || ''}"`,
        `"${prod.model || ''}"`,
        `"${getProductCategory(prod.category)}"`,
        item.cartonRate,
        ...whColumns,
        item.totalCartons,
        item.totalPieces,
        `"${item.displayTotal}"`,
        prod.distributorPriceBDT || 0,
        item.valuationBDT,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ensec_Finished_Stock_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Stock Sheet
  const handlePrintStockSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Inventory Stock
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Finished Goods
                </span>
              
              </div>
              
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Matrix Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <WarehouseIcon className="w-3.5 h-3.5" />
              <span>Warehouse Hubs</span>
            </button>
            <button
              onClick={() => setViewMode('products')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'products'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Product Cards</span>
            </button>
          </div>

          {/* Carton Packaging Config */}
          <button
            onClick={() => setShowCartonConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            title="Configure Pieces per Carton packaging rate"
          >
            <Settings2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">CTN Size:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{defaultCartonRate} Pcs/CTN</span>
          </button>

          {/* Export to CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrintStockSheet}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Sheet</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Pieces */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Finished Stock</span>
            <Box className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {warehouseGrandTotals.overallPieces.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">PCS</span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <PackageCheck className="w-3 h-3" />
            <span>Across all active warehouses</span>
          </div>
        </div>

        {/* Total Cartons */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Master Cartons</span>
            <Boxes className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
              {warehouseGrandTotals.overallCartons.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-indigo-500">CTN</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Based on <span className="font-semibold text-slate-700 dark:text-slate-300">{defaultCartonRate} Pcs/Carton</span>
          </div>
        </div>

        {/* Combined CTN & PCS (Direct answer to prompt format) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 shadow-xs relative overflow-hidden col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 text-xs font-bold">
            <span>CTN / PCS Ratio</span>
            <Sparkles className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 font-mono font-black text-lg sm:text-xl text-blue-900 dark:text-blue-100 tracking-tight">
            {warehouseGrandTotals.overallCartons.toLocaleString()} / {warehouseGrandTotals.overallPieces.toLocaleString()}pcs
          </div>
          <div className="mt-1 text-[11px] text-blue-700/80 dark:text-blue-300/80 font-medium">
            {warehouseGrandTotals.overallCartons.toLocaleString()} Cartons ({warehouseGrandTotals.overallPieces.toLocaleString()} Units)
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Finished Valuation</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
            BDT {(warehouseGrandTotals.overallValuation / 1000000).toFixed(2)}M
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            BDT {warehouseGrandTotals.overallValuation.toLocaleString()}
          </div>
        </div>

        {/* Active Hubs */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Distribution Hubs</span>
            <WarehouseIcon className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {warehouses.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">Hubs Active</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-purple-500" />
            <span>Kushtia, Dhaka, CTG, Bogura</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search finished battery name, SKU, model, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Warehouse Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Warehouse:</span>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden"
              >
                <option value="all">All Warehouses ({warehouses.length})</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.district || wh.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden"
              >
                <option value="all">All Categories</option>
                {productCategoryList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Level Pills */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5">
              <button
                onClick={() => setStockLevelFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  stockLevelFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStockLevelFilter('in-stock')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  stockLevelFilter === 'in-stock'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                In Stock (&gt;0)
              </button>
              <button
                onClick={() => setStockLevelFilter('low-stock')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  stockLevelFilter === 'low-stock'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Low (&lt;50)
              </button>
            </div>
          </div>
        </div>

        {/* Warehouse Quick Selection Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          <button
            onClick={() => setSelectedWarehouseId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedWarehouseId === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>All Warehouses</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 text-inherit">
              {warehouseGrandTotals.overallCartons} CTN
            </span>
          </button>
          {warehouses.map((wh) => {
            const whTotals = warehouseGrandTotals.totals[wh.id] || { pieces: 0, cartons: 0 };
            const isSelected = selectedWarehouseId === wh.id;
            return (
              <button
                key={wh.id}
                onClick={() => setSelectedWarehouseId(wh.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <WarehouseIcon className="w-3.5 h-3.5" />
                <span>{wh.name.split('(')[0].trim()}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 text-inherit font-mono">
                  {whTotals.cartons} CTN / {whTotals.pieces} PCS
                </span>
              </button>
            );
          })}
        </div>
      </div>

    

      {/* VIEW MODE 1: MULTI-WAREHOUSE MATRIX TABLE (DEFAULT) */}
      {viewMode === 'matrix' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Warehouse-Wise Finished Stock Matrix (CTN / PCS)
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {filteredMatrix.length} Products
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Formula: <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">CTN = PCS ÷ {defaultCartonRate}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 min-w-[200px]">Product / Battery Model</th>
                  <th className="px-3 py-3 min-w-[120px]">Packaging Rate</th>
                  {warehouses
                    .filter((wh) => selectedWarehouseId === 'all' || selectedWarehouseId === wh.id)
                    .map((wh) => (
                      <th key={wh.id} className="px-3 py-3 min-w-[170px] text-center border-l border-slate-200/60 dark:border-slate-700/60">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{wh.name.split('(')[0].trim()}</div>
                        <div className="text-[10px] text-slate-400 font-normal lowercase">{wh.district || wh.location}</div>
                      </th>
                    ))}
                  <th className="px-4 py-3 min-w-[180px] text-right border-l border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-950/20">
                    <span className="text-blue-900 dark:text-blue-300 font-black">TOTAL FINISHED STOCK</span>
                  </th>
                  <th className="px-4 py-3 min-w-[130px] text-right">Valuation (BDT)</th>
                  <th className="px-3 py-3 min-w-[90px] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMatrix.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4 + warehouses.filter((wh) => selectedWarehouseId === 'all' || selectedWarehouseId === wh.id).length}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      <Boxes className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
                      <p className="text-sm font-semibold">No finished products found matching filter</p>
                      <p className="text-xs text-slate-400 mt-1">Try resetting search keywords or category filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((item) => {
                    const prod = item.product;
                    return (
                      <tr
                        key={prod.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Product Info */}
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              {prod.voltageV ? `${prod.voltageV}V` : 'BAT'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {prod.name}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                                <span className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{prod.code}</span>
                                {prod.capacityAh && <span>• {prod.capacityAh}Ah</span>}
                                {prod.category && <span>• {getProductCategory(prod.category)}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Packaging Rate */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {item.cartonRate} Pcs/CTN
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">1 Carton = {item.cartonRate} Pcs</span>
                        </td>

                        {/* Warehouse Columns */}
                        {warehouses
                          .filter((wh) => selectedWarehouseId === 'all' || selectedWarehouseId === wh.id)
                          .map((wh) => {
                            const whStock = item.warehouseStocks[wh.id] || {
                              pieces: 0,
                              cartons: 0,
                              loose: 0,
                              display: '0 CTN / 0 PCS',
                            };
                            const isZero = whStock.pieces === 0;
                            const isLow = whStock.pieces > 0 && whStock.pieces < 50;

                            return (
                              <td
                                key={wh.id}
                                className="px-3 py-3 text-center border-l border-slate-100 dark:border-slate-800/60 font-mono"
                              >
                                {isZero ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-100/60 dark:bg-slate-800/40">
                                    0 CTN / 0 PCS
                                  </span>
                                ) : (
                                  <div className="inline-flex flex-col items-center">
                                    {/* The exact format requested: CTN and PCS wise like 100/1000pcs */}
                                    <span
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                        isLow
                                          ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                          : 'bg-blue-50/80 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                      }`}
                                    >
                                      {whStock.cartons.toLocaleString()} CTN / {whStock.pieces.toLocaleString()} PCS
                                    </span>
                                    <span className="text-[10px] text-slate-400 mt-0.5 font-sans">
                                      {whStock.cartons}/{whStock.pieces}pcs
                                      {whStock.loose > 0 && (
                                        <span className="text-amber-600 dark:text-amber-400 ml-1">
                                          (+{whStock.loose} pcs)
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                )}
                              </td>
                            );
                          })}

                        {/* Total Company Stock */}
                        <td className="px-4 py-3 text-right border-l border-slate-200 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-950/10">
                          <div className="font-mono font-black text-sm text-blue-700 dark:text-blue-300">
                            {item.totalCartons.toLocaleString()} CTN / {item.totalPieces.toLocaleString()} PCS
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.totalCartons}/{item.totalPieces}pcs
                            {item.totalLoose > 0 && (
                              <span className="text-amber-600 ml-1 font-sans">
                                (+{item.totalLoose} loose)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Valuation */}
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                          BDT {item.valuationBDT.toLocaleString()}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() =>
                                setTransferModalProduct({
                                  product: prod,
                                  fromWarehouseId: warehouses[0]?.id || '',
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                              title="Transfer stock to another warehouse"
                            >
                              <Truck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setInspectProduct(prod)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                              title="View breakdown & details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer Grand Totals */}
              {filteredMatrix.length > 0 && (
                <tfoot className="bg-slate-100/90 dark:bg-slate-800/90 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                  <tr>
                    <td className="px-4 py-3 text-xs uppercase tracking-wider font-extrabold">
                      GRAND TOTALS ({filteredMatrix.length} ITEMS)
                    </td>
                    <td className="px-3 py-3 text-slate-500 text-xs">Standard CTN</td>
                    {warehouses
                      .filter((wh) => selectedWarehouseId === 'all' || selectedWarehouseId === wh.id)
                      .map((wh) => {
                        const whTotals = warehouseGrandTotals.totals[wh.id] || { pieces: 0, cartons: 0 };
                        return (
                          <td key={wh.id} className="px-3 py-3 text-center border-l border-slate-200 dark:border-slate-700">
                            <div className="font-mono text-xs font-black text-blue-700 dark:text-blue-300">
                              {whTotals.cartons.toLocaleString()} CTN / {whTotals.pieces.toLocaleString()} PCS
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {whTotals.cartons}/{whTotals.pieces}pcs
                            </div>
                          </td>
                        );
                      })}
                    <td className="px-4 py-3 text-right border-l border-slate-200 dark:border-slate-700 bg-blue-100/40 dark:bg-blue-950/30">
                      <div className="font-mono text-sm font-black text-blue-800 dark:text-blue-200">
                        {warehouseGrandTotals.overallCartons.toLocaleString()} CTN / {warehouseGrandTotals.overallPieces.toLocaleString()} PCS
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {warehouseGrandTotals.overallCartons}/{warehouseGrandTotals.overallPieces}pcs
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
                      BDT {warehouseGrandTotals.overallValuation.toLocaleString()}
                    </td>
                    <td className="px-3 py-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: WAREHOUSE HUBS CARDS */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {warehouses
            .filter((wh) => selectedWarehouseId === 'all' || selectedWarehouseId === wh.id)
            .map((wh) => {
              const whTotals = warehouseGrandTotals.totals[wh.id] || { pieces: 0, cartons: 0, valuationBDT: 0 };
              const capacity = wh.capacityUnits || 5000;
              const utilizationPct = Math.min(100, Math.round((whTotals.pieces / capacity) * 100));

              return (
                <div
                  key={wh.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Card Header */}
                  <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-400">{wh.code}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {wh.type || 'Warehouse'}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{wh.name}</h3>
                      <p className="text-xs text-slate-500">{wh.location || wh.district}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-xs shrink-0">
                      <WarehouseIcon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card Summary Metric */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-950/10 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                        Hub Finished Stock
                      </span>
                      <span className="font-mono font-black text-lg text-blue-700 dark:text-blue-300">
                        {whTotals.cartons.toLocaleString()} CTN / {whTotals.pieces.toLocaleString()} PCS
                      </span>
                      <span className="block text-[11px] text-slate-400 font-mono">
                        ({whTotals.cartons}/{whTotals.pieces}pcs)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-medium text-slate-500 block">Hub Valuation</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        BDT {(whTotals.valuationBDT / 1000000).toFixed(2)}M
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Capacity Utilization</span>
                      <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                        {whTotals.pieces.toLocaleString()} / {capacity.toLocaleString()} Units ({utilizationPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          utilizationPct > 90 ? 'bg-rose-500' : utilizationPct > 70 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${utilizationPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Products Table in this Warehouse */}
                  <div className="flex-1 p-3 overflow-y-auto max-h-72 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {products.map((prod) => {
                      const pieces = calculateWarehouseStock(wh.id, prod.id);
                      const rate = getCartonRate(prod);
                      const ctn = formatCartonPiece(pieces, rate);
                      return (
                        <div key={prod.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{prod.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {prod.code} • {rate} pcs/ctn
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {ctn.cartons} CTN / {ctn.totalPieces} PCS
                            </span>
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                              {ctn.cartons}/{ctn.totalPieces}pcs
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Card Footer Action */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">In-Charge: {wh.inchargeName || wh.managerName || 'Manager'}</span>
                    <button
                      onClick={() =>
                        setTransferModalProduct({
                          product: products[0],
                          fromWarehouseId: wh.id,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] flex items-center gap-1 shadow-xs"
                    >
                      <Truck className="w-3 h-3" />
                      <span>Issue Transfer</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* VIEW MODE 3: DETAILED PRODUCT CARDS */}
      {viewMode === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatrix.map((item) => {
            const prod = item.product;
            return (
              <div
                key={prod.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                      {prod.voltageV ? `${prod.voltageV}V` : 'BAT'}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{prod.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                          {prod.code}
                        </span>
                        <span>• {prod.batteryType || 'LiFePO4'}</span>
                        {prod.capacityAh && <span>• {prod.capacityAh}Ah Capacity</span>}
                        {prod.warrantyMonths && <span>• {prod.warrantyMonths}M Warranty</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Finished Stock</span>
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-lg">
                      {item.totalCartons} CTN / {item.totalPieces} PCS
                    </span>
                    <span className="block text-[11px] font-mono text-slate-400">
                      ({item.displayCompact})
                    </span>
                  </div>
                </div>

                {/* Warehouse Distribution Matrix */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Warehouse-Wise Stock Allocation:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {warehouses.map((wh) => {
                      const st = item.warehouseStocks[wh.id] || { pieces: 0, cartons: 0 };
                      return (
                        <div
                          key={wh.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                        >
                          <span className="text-[10px] text-slate-400 font-semibold block truncate">
                            {wh.name.split('(')[0].trim()}
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs mt-0.5 block">
                            {st.cartons} CTN / {st.pieces} PCS
                          </span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                            {st.cartons}/{st.pieces}pcs
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Action bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="text-slate-500">
                    Distributor Price:{' '}
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      BDT {(prod.distributorPriceBDT || 85000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setTransferModalProduct({
                          product: prod,
                          fromWarehouseId: warehouses[0]?.id || '',
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Transfer</span>
                    </button>
                    <button
                      onClick={() => setInspectProduct(prod)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-200"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CARTON PACKAGING RATE CONFIGURATION */}
      {showCartonConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Carton Packaging Rate Configuration
                </h3>
              </div>
              <button
                onClick={() => setShowCartonConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Global Standard Pieces per Master Carton (Default Rate):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={defaultCartonRate}
                    onChange={(e) => setDefaultCartonRate(Math.max(1, Number(e.target.value) || 1))}
                    className="w-32 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-sm"
                  />
                  <span className="text-slate-500 font-medium">Pieces (PCS) per 1 Master Carton (CTN)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  When stock is 1,000 pcs and carton rate is 10, the page displays{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">100 CTN / 1,000 PCS</span> (or 100/1000pcs).
                </p>
              </div>

              {/* Quick Presets */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-semibold block mb-2">Standard Battery Carton Presets:</span>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 4, 5, 8, 10, 12, 16, 20].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setDefaultCartonRate(rate)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                        defaultCartonRate === rate
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {rate} pcs/ctn
                    </button>
                  ))}
                </div>
              </div>

              {/* Product specific overrides */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-slate-700 dark:text-slate-300 font-bold block">
                  Per-Product Carton Rates:
                </span>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900">
                  {products.map((p) => {
                    const current = customCartonRates[p.id] || p.pcsPerCarton || defaultCartonRate;
                    return (
                      <div key={p.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={current}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value) || 1);
                              setCustomCartonRates((prev) => ({ ...prev, [p.id]: val }));
                            }}
                            className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-mono font-bold"
                          />
                          <span className="text-slate-400 text-[11px]">pcs</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowCartonConfigModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm"
              >
                Apply & Save Packaging Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK STOCK TRANSFER */}
      {transferModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <h3 className="font-bold text-sm">Issue Inter-Warehouse Stock Transfer</h3>
              </div>
              <button
                onClick={() => setTransferModalProduct(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider font-bold block">
                  Product to Transfer:
                </span>
                <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  {transferModalProduct.product.name}
                </div>
                <div className="font-mono text-slate-500 text-[11px]">
                  {transferModalProduct.product.code} • Packaging: {getCartonRate(transferModalProduct.product)} pcs/ctn
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Source Warehouse (From):
                  </label>
                  <select
                    value={transferModalProduct.fromWarehouseId}
                    onChange={(e) =>
                      setTransferModalProduct({
                        ...transferModalProduct,
                        fromWarehouseId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Destination Hub (To):
                  </label>
                  <select
                    value={transferToWarehouseId || warehouses.find((w) => w.id !== transferModalProduct.fromWarehouseId)?.id || ''}
                    onChange={(e) => setTransferToWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    required
                  >
                    <option value="">Select Destination</option>
                    {warehouses
                      .filter((wh) => wh.id !== transferModalProduct.fromWarehouseId)
                      .map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Quantity in Pieces and Cartons */}
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-blue-900 dark:text-blue-200">Transfer Quantity (PCS):</label>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                    = {Math.floor(transferQtyPcs / getCartonRate(transferModalProduct.product))} CTN
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  value={transferQtyPcs}
                  onChange={(e) => setTransferQtyPcs(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 font-mono text-base font-bold text-slate-900 dark:text-white"
                  required
                />
                <div className="flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300">
                  <span>Quick sets:</span>
                  <div className="flex gap-1.5 font-mono">
                    {[10, 50, 100, 200, 500].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setTransferQtyPcs(qty)}
                        className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold"
                      >
                        {qty} pcs
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Driver Name:</label>
                  <input
                    type="text"
                    value={transferDriverName}
                    onChange={(e) => setTransferDriverName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Truck Number:</label>
                  <input
                    type="text"
                    value={transferTruckNo}
                    onChange={(e) => setTransferTruckNo(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferModalProduct(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Confirm & Dispatch Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PRODUCT DEEP-DIVE INSPECTION */}
      {inspectProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{inspectProduct.name}</h3>
                  <span className="font-mono text-xs text-slate-400">{inspectProduct.code}</span>
                </div>
              </div>
              <button
                onClick={() => setInspectProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Product Technical Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Nominal Voltage</span>
                  <span className="font-bold text-slate-900 dark:text-white">{inspectProduct.voltageV || '51.2'}V</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Capacity (Ah)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{inspectProduct.capacityAh || '86'}Ah</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Carton Rate</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{getCartonRate(inspectProduct)} Pcs/CTN</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Distributor Price</span>
                  <span className="font-bold text-emerald-600">BDT {(inspectProduct.distributorPriceBDT || 85000).toLocaleString()}</span>
                </div>
              </div>

              {/* Warehouse Breakdown Table */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Warehouse Finished Stock Balances:
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {warehouses.map((wh) => {
                    const pieces = calculateWarehouseStock(wh.id, inspectProduct.id);
                    const invoicedDeduction = calculateInvoicedSalesDeduction(wh.id, inspectProduct.id);
                    const ctn = formatCartonPiece(pieces, getCartonRate(inspectProduct));
                    return (
                      <div key={wh.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{wh.name}</div>
                          <div className="text-[11px] text-slate-400">{wh.location || wh.district}</div>
                          {invoicedDeduction > 0 && (
                            <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>Invoiced Sales Deducted: -{invoicedDeduction.toLocaleString()} pcs</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right font-mono">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {ctn.cartons} CTN / {ctn.totalPieces} PCS
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {ctn.cartons}/{ctn.totalPieces}pcs
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setInspectProduct(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs"
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
