import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Archive,
  Upload,
  FolderOutput,
  CornerDownLeft,
  GitFork,
  Truck,
  Boxes,
  Plus,
  Trash2,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Download,
  Building2,
  Calendar,
  X,
  Clock,
  Sparkles,
  Barcode,
  BatteryCharging,
  Warehouse as WarehouseIcon,
  Eye,
  Check,
  SlidersHorizontal,
  Scale,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import {
  CIDStockReceipt,
  CIDStockReceiptItem,
  OpeningStockRecord,
  StockIssueRecord,
  PrimaryReturnRecord,
  StockAdjustmentRecord,
} from '../../types/erp.ts';

export type StockSubTab =
  | 'stock-cid-receive'
  | 'stock-create-opening'
  | 'stock-upload-opening'
  | 'stock-upload-primary'
  | 'stock-issued'
  | 'stock-received'
  | 'stock-primary-return'
  | 'stock-damage-return'
  | 'stock-transfer'
  | 'stock-adjustment';

interface StockModuleProps {
  activeSubTab?: string;
  onNavigate?: (module: string) => void;
}

export const StockModule: React.FC<StockModuleProps> = ({
  activeSubTab = 'stock-cid-receive',
  onNavigate,
}) => {
  const {
    warehouses,
    products,
    cidStockReceipts,
    addCIDStockReceipt,
    updateCIDStockReceiptStatus,
    deleteCIDStockReceipt,
    refreshCIDStockReceipts,
    openingStockRecords,
    addOpeningStockRecord,
    bulkAddOpeningStockRecords,
    stockIssueRecords,
    addStockIssueRecord,
    primaryReturnRecords,
    addPrimaryReturnRecord,
    stockAdjustmentRecords,
    addStockAdjustmentRecord,
    adjustStock,
    stockTransfers,
    createStockTransfer,
    approveStockTransfer,
    receiveStockTransfer,
    stockLedger,
    currentUser,
  } = useERP();

  // Map incoming activeSubTab to internal tab
  const resolveTab = (tab: string): StockSubTab => {
    if (tab === 'stock' || tab === 'stock-receive' || tab === 'stock-list' || tab === 'stock-balance') {
      return 'stock-cid-receive';
    }
    if (
      tab === 'stock-cid-receive' ||
      tab === 'stock-create-opening' ||
      tab === 'stock-upload-opening' ||
      tab === 'stock-upload-primary' ||
      tab === 'stock-issued' ||
      tab === 'stock-received' ||
      tab === 'stock-primary-return' ||
      tab === 'stock-damage-return' ||
      tab === 'stock-transfer' ||
      tab === 'stock-adjustment'
    ) {
      return tab as StockSubTab;
    }
    return 'stock-cid-receive';
  };

  const [currentTab, setCurrentTab] = useState<StockSubTab>(resolveTab(activeSubTab));

  // Sync if prop changes
  React.useEffect(() => {
    setCurrentTab(resolveTab(activeSubTab));
  }, [activeSubTab]);

  const handleTabChange = (tab: StockSubTab) => {
    setCurrentTab(tab);
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  // Find Central Inventory Depot (CID) warehouse or default to first
  const cidWarehouse =
    warehouses.find((w) => w.id === 'wh-dhaka-1' || w.name.includes('CID') || w.name.includes('Central')) ||
    warehouses[0];

  // ==========================================
  // SUB-TAB 1: CID RECEIVE STATE
  // ==========================================
  const [cidViewMode, setCidViewMode] = useState<'form' | 'register'>('form');
  const [mrrSearch, setMrrSearch] = useState('');
  const [mrrFilterQc, setMrrFilterQc] = useState<string>('all');
  const [selectedReceiptForVoucher, setSelectedReceiptForVoucher] = useState<CIDStockReceipt | null>(null);
  const [showCidReceiveConfirmModal, setShowCidReceiveConfirmModal] = useState(false);
  const [isPostingCidStock, setIsPostingCidStock] = useState(false);
  const [isRefreshingCid, setIsRefreshingCid] = useState(false);

  useEffect(() => {
    refreshCIDStockReceipts?.();
  }, []);

  // Manual Inward Form State
  const [targetWhId, setTargetWhId] = useState(cidWarehouse?.id || 'wh-dhaka-1');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().substring(0, 10));
  const [mrrNumber, setMrrNumber] = useState(`CID-MRR-${new Date().getFullYear()}-${String(cidStockReceipts.length + 1).padStart(4, '0')}`);
  const [sourceType, setSourceType] = useState<CIDStockReceipt['sourceType']>('Kushtia Manufacturing Plant');
  const [challanNumber, setChallanNumber] = useState('');
  const [gatePassNumber, setGatePassNumber] = useState('');
  const [carrierVehicleNo, setCarrierVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [receivedByOfficer, setReceivedByOfficer] = useState(currentUser?.name || 'Warehouse In-charge');
  const [qcInspector, setQcInspector] = useState('Quality Control Officer');
  const [qcStatus, setQcStatus] = useState<CIDStockReceipt['qcStatus']>('QC Passed & Stamped');
  const [receiptStatus, setReceiptStatus] = useState<CIDStockReceipt['status']>('Received & Stocked');
  const [generalRemarks, setGeneralRemarks] = useState('');

  // Form line items (clean blank row)
  const [formItems, setFormItems] = useState<
    Omit<CIDStockReceiptItem, 'id'>[]
  >([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      sku: products[0]?.code || '',
      category: products[0]?.category || '',
      batchNumber: '',
      serialRange: '',
      receivedQty: 1,
      unitCostBDT: products[0]?.distributorPriceBDT ? Math.round(products[0].distributorPriceBDT * 0.72) : 0,
      totalCostBDT: products[0]?.distributorPriceBDT ? Math.round(products[0].distributorPriceBDT * 0.72) : 0,
      rackLocation: '',
      packageCondition: 'Factory Sealed Box',
      lineRemarks: '',
    },
  ]);

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const estCost = prod.distributorPriceBDT ? Math.round(prod.distributorPriceBDT * 0.72) : 70000;
    setFormItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          productId: prod.id,
          productName: prod.name,
          sku: prod.code,
          category: prod.category,
          unitCostBDT: estCost,
          totalCostBDT: item.receivedQty * estCost,
        };
      })
    );
  };

  const handleQtyChange = (index: number, qty: number) => {
    const validQty = Math.max(1, qty);
    setFormItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          receivedQty: validQty,
          totalCostBDT: validQty * item.unitCostBDT,
        };
      })
    );
  };

  const handleUnitCostChange = (index: number, cost: number) => {
    const validCost = Math.max(0, cost);
    setFormItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          unitCostBDT: validCost,
          totalCostBDT: item.receivedQty * validCost,
        };
      })
    );
  };

  const handleItemFieldChange = (
    index: number,
    field: keyof Omit<CIDStockReceiptItem, 'id'>,
    value: any
  ) => {
    setFormItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddFormItem = () => {
    const defaultProd = products[1] || products[0];
    const estCost = defaultProd?.distributorPriceBDT
      ? Math.round(defaultProd.distributorPriceBDT * 0.72)
      : 38000;
    setFormItems((prev) => [
      ...prev,
      {
        productId: defaultProd?.id || 'p-2',
        productName: defaultProd?.name || 'Ensec SolarPro LiFePO4 12.8V 200Ah',
        sku: defaultProd?.code || 'ENS-SOL-12200',
        category: defaultProd?.category || 'Solar Home System',
        batchNumber: `KUS-B2610-0${prev.length + 10}`,
        serialRange: `SN-2610-${Math.floor(100 + Math.random() * 900)}`,
        receivedQty: 20,
        unitCostBDT: estCost,
        totalCostBDT: 20 * estCost,
        rackLocation: 'Bay B / Rack 03 (CID Solar Bay)',
        packageCondition: 'Factory Sealed Box',
        lineRemarks: 'Palletized packaging checked.',
      },
    ]);
  };

  const handleRemoveFormItem = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Reset form to clean production defaults
  const handleResetForm = () => {
    setMrrNumber(`CID-MRR-${new Date().getFullYear()}-${String(cidStockReceipts.length + 1).padStart(4, '0')}`);
    setChallanNumber('');
    setGatePassNumber('');
    setCarrierVehicleNo('');
    setDriverName('');
    setDriverPhone('');
    setGeneralRemarks('');
    setFormItems([
      {
        productId: products[0]?.id || '',
        productName: products[0]?.name || '',
        sku: products[0]?.code || '',
        category: products[0]?.category || '',
        batchNumber: '',
        serialRange: '',
        receivedQty: 1,
        unitCostBDT: products[0]?.distributorPriceBDT ? Math.round(products[0].distributorPriceBDT * 0.72) : 0,
        totalCostBDT: products[0]?.distributorPriceBDT ? Math.round(products[0].distributorPriceBDT * 0.72) : 0,
        rackLocation: '',
        packageCondition: 'Factory Sealed Box',
        lineRemarks: '',
      },
    ]);
  };

  const totalFormQty = formItems.reduce((acc, curr) => acc + curr.receivedQty, 0);
  const totalFormValuation = formItems.reduce((acc, curr) => acc + curr.totalCostBDT, 0);

  // Step 1: Trigger confirmation modal before posting stock
  const handleInitiateCIDReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItems.length || totalFormQty <= 0) return;
    setShowCidReceiveConfirmModal(true);
  };

  // Step 2: User explicitly confirms receiving into CID physical stock
  const handleConfirmCIDReceipt = () => {
    if (!formItems.length || totalFormQty <= 0) return;
    setIsPostingCidStock(true);

    const targetWh = warehouses.find((w) => w.id === targetWhId) || cidWarehouse;

    const itemsWithIds: CIDStockReceiptItem[] = formItems.map((item, idx) => ({
      ...item,
      id: `item-${Date.now()}-${idx}`,
    }));

    const newReceiptPayload: Omit<CIDStockReceipt, 'id' | 'createdAt'> = {
      mrrNumber,
      receiptDate,
      warehouseId: targetWh.id,
      warehouseName: targetWh.name,
      sourceType,
      challanNumber,
      gatePassNumber,
      carrierVehicleNo,
      driverName,
      driverPhone,
      receivedBy: receivedByOfficer,
      qcInspector,
      qcStatus,
      status: receiptStatus,
      items: itemsWithIds,
      totalQuantity: totalFormQty,
      totalValueBDT: totalFormValuation,
      generalRemarks,
    };

    const newId = addCIDStockReceipt(newReceiptPayload);

    // Open voucher modal for printing
    const createdReceipt: CIDStockReceipt = {
      ...newReceiptPayload,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setSelectedReceiptForVoucher(createdReceipt);

    // Reset MRR Form for next entry and close confirmation dialog
    handleResetForm();
    setShowCidReceiveConfirmModal(false);
    setIsPostingCidStock(false);
    setCidViewMode('register');
  };

  // Filtered MRR register
  const filteredReceipts = useMemo(() => {
    return cidStockReceipts.filter((r) => {
      const matchSearch =
        mrrSearch === '' ||
        (r.mrrNumber || '').toLowerCase().includes(mrrSearch.toLowerCase()) ||
        (r.challanNumber || '').toLowerCase().includes(mrrSearch.toLowerCase()) ||
        (r.sourceType || '').toLowerCase().includes(mrrSearch.toLowerCase()) ||
        (r.items || []).some(
          (i) =>
            (i.productName || '').toLowerCase().includes(mrrSearch.toLowerCase()) ||
            (i.batchNumber || '').toLowerCase().includes(mrrSearch.toLowerCase())
        );

      const matchQc = mrrFilterQc === 'all' || r.qcStatus === mrrFilterQc;
      return matchSearch && matchQc;
    });
  }, [cidStockReceipts, mrrSearch, mrrFilterQc]);

  // ==========================================
  // SUB-TAB 2: CREATE OPENING STOCK STATE
  // ==========================================
  const [openingWhId, setOpeningWhId] = useState(cidWarehouse?.id || 'wh-dhaka-1');
  const [openingDate, setOpeningDate] = useState('2026-10-01');
  const [openingProdId, setOpeningProdId] = useState(products[0]?.id || 'p-1');
  const [openingBatch, setOpeningBatch] = useState('OP-B2610-01');
  const [openingQty, setOpeningQty] = useState(50);
  const [openingUnitCost, setOpeningUnitCost] = useState(
    products[0]?.distributorPriceBDT ? Math.round(products[0].distributorPriceBDT * 0.7) : 75000
  );
  const [openingRack, setOpeningRack] = useState('Bay A / Rack 01');
  const [openingNotes, setOpeningNotes] = useState('Baseline opening inventory balance.');

  const handleCreateOpeningStock = (e: React.FormEvent) => {
    e.preventDefault();
    const wh = warehouses.find((w) => w.id === openingWhId) || cidWarehouse;
    const prod = products.find((p) => p.id === openingProdId) || products[0];

    addOpeningStockRecord({
      warehouseId: wh.id,
      warehouseName: wh.name,
      productId: prod.id,
      productName: prod.name,
      sku: prod.code,
      category: prod.category,
      batchNumber: openingBatch,
      quantity: Number(openingQty),
      unitCostBDT: Number(openingUnitCost),
      totalCostBDT: Number(openingQty) * Number(openingUnitCost),
      rackLocation: openingRack,
      date: openingDate,
      recordedBy: currentUser?.name || 'Rafiqul Alam (CID)',
      notes: openingNotes,
    });

    setOpeningBatch(`OP-B2610-0${openingStockRecords.length + 2}`);
  };

  // ==========================================
  // SUB-TAB 3: UPLOAD OPENING STOCK STATE
  // ==========================================
  const [openingUploadRows, setOpeningUploadRows] = useState<
    {
      sku: string;
      productName: string;
      whCode: string;
      batch: string;
      qty: number;
      unitCost: number;
      rack: string;
      isValid: boolean;
      statusText: string;
    }[]
  >([]);
  const [uploadOpeningCommitted, setUploadOpeningCommitted] = useState(false);

  const handlePreloadOpeningSample = () => {
    const sample = [
      {
        sku: 'ENS-TEL-48100',
        productName: 'Ensec Telecom PowerRack LiFePO4 48V 100Ah',
        whCode: 'wh-dhaka-1',
        batch: 'OP-CSV-48100-A',
        qty: 35,
        unitCost: 75070,
        rack: 'Bay A-02',
        isValid: true,
        statusText: 'Valid Product & Warehouse Code',
      },
      {
        sku: 'ENS-SOL-12200',
        productName: 'Ensec SolarPro LiFePO4 12.8V 200Ah Deep Cycle',
        whCode: 'wh-dhaka-1',
        batch: 'OP-CSV-12200-B',
        qty: 45,
        unitCost: 29500,
        rack: 'Bay B-01',
        isValid: true,
        statusText: 'Valid Product & Warehouse Code',
      },
      {
        sku: 'ENS-EV-6050',
        productName: 'Ensec E-Drive Lithium 60V 50Ah E-Rickshaw',
        whCode: 'wh-dhaka-1',
        batch: 'OP-CSV-6050-C',
        qty: 50,
        unitCost: 38200,
        rack: 'Bay C-04',
        isValid: true,
        statusText: 'Valid Product & Warehouse Code',
      },
      {
        sku: 'ENS-RES-24100',
        productName: 'Ensec HomeGuard LiFePO4 24V 100Ah Backup',
        whCode: 'wh-dhaka-1',
        batch: 'OP-CSV-24100-D',
        qty: 25,
        unitCost: 42000,
        rack: 'Bay D-01',
        isValid: true,
        statusText: 'Valid Product & Warehouse Code',
      },
    ];
    setOpeningUploadRows(sample);
    setUploadOpeningCommitted(false);
  };

  const handleCommitBulkOpeningStock = () => {
    if (!openingUploadRows.length) return;
    const validRows = openingUploadRows.filter((r) => r.isValid);
    const toCommit: Omit<OpeningStockRecord, 'id'>[] = validRows.map((r) => {
      const prod = products.find((p) => p.code === r.sku) || products[0];
      const wh = warehouses.find((w) => w.id === r.whCode) || cidWarehouse;
      return {
        warehouseId: wh.id,
        warehouseName: wh.name,
        productId: prod.id,
        productName: prod.name,
        sku: prod.code,
        category: prod.category,
        batchNumber: r.batch,
        quantity: r.qty,
        unitCostBDT: r.unitCost,
        totalCostBDT: r.qty * r.unitCost,
        rackLocation: r.rack,
        date: new Date().toISOString().substring(0, 10),
        recordedBy: currentUser?.name || 'Rafiqul Alam (CID)',
        notes: 'Bulk CSV opening stock upload import.',
      };
    });

    bulkAddOpeningStockRecords(toCommit);
    setUploadOpeningCommitted(true);
  };

  // ==========================================
  // SUB-TAB 4: UPLOAD PRIMARY STATE
  // ==========================================
  const [primaryUploadRows, setPrimaryUploadRows] = useState<
    {
      challanNo: string;
      date: string;
      sourcePlant: string;
      destWh: string;
      sku: string;
      productName: string;
      batch: string;
      qty: number;
      valueBDT: number;
      vehicle: string;
    }[]
  >([]);
  const [primaryUploadCommitted, setPrimaryUploadCommitted] = useState(false);

  const handlePreloadPrimarySample = () => {
    setPrimaryUploadRows([
      {
        challanNo: 'CH-PRIM-2026-901',
        date: '2026-10-11',
        sourcePlant: 'Kushtia Manufacturing Plant',
        destWh: 'Dhaka Central Hub 1 (CID)',
        sku: 'ENS-TEL-48100',
        productName: 'Ensec Telecom PowerRack LiFePO4 48V 100Ah',
        batch: 'KUS-B2610-15',
        qty: 40,
        valueBDT: 3002800,
        vehicle: 'Dhaka Metro TA-14-8891',
      },
      {
        challanNo: 'CH-PRIM-2026-902',
        date: '2026-10-11',
        sourcePlant: 'Optimum JV Joint Venture Plant',
        destWh: 'Dhaka Central Hub 1 (CID)',
        sku: 'ENS-SOL-12200',
        productName: 'Ensec SolarPro LiFePO4 12.8V 200Ah Deep Cycle',
        batch: 'OPT-B2610-09',
        qty: 60,
        valueBDT: 1770000,
        vehicle: 'Chatto Metro DA-12-3301',
      },
    ]);
    setPrimaryUploadCommitted(false);
  };

  const handleProcessPrimaryInward = () => {
    if (!primaryUploadRows.length) return;
    primaryUploadRows.forEach((row) => {
      const prod = products.find((p) => p.code === row.sku) || products[0];
      const targetWh = warehouses.find((w) => w.id === 'wh-dhaka-1') || cidWarehouse;
      addCIDStockReceipt({
        mrrNumber: `CID-MRR-PRIM-${row.challanNo.slice(-3)}`,
        receiptDate: row.date,
        warehouseId: targetWh.id,
        warehouseName: targetWh.name,
        sourceType: row.sourcePlant as any,
        challanNumber: row.challanNo,
        carrierVehicleNo: row.vehicle,
        receivedBy: currentUser?.name || 'Rafiqul Alam (CID)',
        qcInspector: 'Engr. Mizanur Rahman (QC)',
        qcStatus: 'QC Passed & Stamped',
        status: 'Received & Stocked',
        items: [
          {
            id: `item-${Date.now()}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.code,
            category: prod.category,
            batchNumber: row.batch,
            receivedQty: row.qty,
            unitCostBDT: Math.round(row.valueBDT / row.qty),
            totalCostBDT: row.valueBDT,
            rackLocation: 'Bay A / Rack 01 (CID Primary Lot)',
            packageCondition: 'Pristine Export Packing',
          },
        ],
        totalQuantity: row.qty,
        totalValueBDT: row.valueBDT,
        generalRemarks: `Primary dispatch challan inward via bulk import from ${row.sourcePlant}.`,
      });
    });
    setPrimaryUploadCommitted(true);
  };

  // ==========================================
  // SUB-TAB 5: ISSUED STATE
  // ==========================================
  const [issueRecipient, setIssueRecipient] = useState('Meghna Electric & Battery Supply (Sylhet)');
  const [issueType, setIssueType] = useState<StockIssueRecord['issueType']>('Distributor Order Dispatch');
  const [issueRefNo, setIssueRefNo] = useState('SO-2026-1044');
  const [issueProdId, setIssueProdId] = useState(products[0]?.id || 'p-1');
  const [issueBatch, setIssueBatch] = useState('KUS-B2610-01');
  const [issueQty, setIssueQty] = useState(10);
  const [issueGatePass, setIssueGatePass] = useState('GP-OUT-2026-112');
  const [selectedIssueForVoucher, setSelectedIssueForVoucher] = useState<StockIssueRecord | null>(null);

  const handleIssueStock = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === issueProdId) || products[0];
    const unitPrice = prod.distributorPriceBDT || 75000;
    const totalVal = Number(issueQty) * unitPrice;

    const newId = addStockIssueRecord({
      date: new Date().toISOString().substring(0, 10),
      sourceWarehouseId: cidWarehouse.id,
      sourceWarehouseName: cidWarehouse.name,
      issueType,
      referenceNo: issueRefNo,
      recipientName: issueRecipient,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.code,
          batchNumber: issueBatch,
          quantity: Number(issueQty),
          unitPriceBDT: unitPrice,
          totalBDT: totalVal,
        },
      ],
      totalQty: Number(issueQty),
      totalValueBDT: totalVal,
      gatePassNumber: issueGatePass,
      issuedBy: currentUser?.name || 'Rafiqul Alam (CID)',
      status: 'Issued & Dispatched',
    });

    const created: StockIssueRecord = {
      id: newId,
      issueNumber: `ISS-2026-10-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().substring(0, 10),
      sourceWarehouseId: cidWarehouse.id,
      sourceWarehouseName: cidWarehouse.name,
      issueType,
      referenceNo: issueRefNo,
      recipientName: issueRecipient,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.code,
          batchNumber: issueBatch,
          quantity: Number(issueQty),
          unitPriceBDT: unitPrice,
          totalBDT: totalVal,
        },
      ],
      totalQty: Number(issueQty),
      totalValueBDT: totalVal,
      gatePassNumber: issueGatePass,
      issuedBy: currentUser?.name || 'Rafiqul Alam (CID)',
      status: 'Issued & Dispatched',
    };
    setSelectedIssueForVoucher(created);
  };

  // ==========================================
  // SUB-TAB 7: PRIMARY RETURN STATE
  // ==========================================
  const [returnFrom, setReturnFrom] = useState('Rupsha Power Systems (Khulna)');
  const [returnProdId, setReturnProdId] = useState(products[1]?.id || 'p-2');
  const [returnBatch, setReturnBatch] = useState('OPT-B2610-01');
  const [returnQty, setReturnQty] = useState(4);
  const [returnReason, setReturnReason] = useState<PrimaryReturnRecord['reason']>('Order Specification Mismatch');
  const [returnQcStatus, setReturnQcStatus] = useState<PrimaryReturnRecord['qcStatus']>('Restocked to Active CID');
  const [returnNotes, setReturnNotes] = useState('Goods verified in factory sealed condition. Re-admitted to CID.');

  const handleRecordPrimaryReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === returnProdId) || products[1];
    const unitPrice = prod.distributorPriceBDT || 29500;

    addPrimaryReturnRecord({
      date: new Date().toISOString().substring(0, 10),
      warehouseId: cidWarehouse.id,
      warehouseName: cidWarehouse.name,
      distributorOrPlant: returnFrom,
      productId: prod.id,
      productName: prod.name,
      sku: prod.code,
      batchNumber: returnBatch,
      quantity: Number(returnQty),
      unitPriceBDT: unitPrice,
      totalValueBDT: Number(returnQty) * unitPrice,
      reason: returnReason,
      qcStatus: returnQcStatus,
      receivedBy: currentUser?.name || 'Rafiqul Alam (CID)',
      notes: returnNotes,
    });
  };

  // ==========================================
  // SUB-TAB 8: DAMAGE RETURN STATE
  // ==========================================
  const [damageProdId, setDamageProdId] = useState(products[0]?.id || 'p-1');
  const [damageSerial, setDamageSerial] = useState('SN-48100-2610-098');
  const [damageQty, setDamageQty] = useState(2);
  const [damageReason, setDamageReason] = useState('BMS Failure / Short Circuit');
  const [damageOrigin, setDamageOrigin] = useState('Dhaka Central Hub 1 (CID)');
  const [damageQuarantineBay, setDamageQuarantineBay] = useState('CID Quarantine Bay B-1');
  const [damageRecordsList, setDamageRecordsList] = useState([
    {
      id: 'DMG-RET-01',
      date: '2026-10-08',
      productName: 'Ensec Telecom PowerRack LiFePO4 48V 100Ah',
      sku: 'ENS-TEL-48100',
      serial: 'SN-48100-2610-098',
      qty: 2,
      reason: 'BMS Failure / Short Circuit',
      quarantineBay: 'CID Quarantine Bay B-1',
      status: 'In Quarantine',
      lossValueBDT: 150000,
    },
    {
      id: 'DMG-RET-02',
      date: '2026-10-05',
      productName: 'Ensec 60V 50Ah Lithium E-Rickshaw Pack',
      sku: 'ENS-EV-6050',
      serial: 'SN-6050-2610-044',
      qty: 3,
      reason: 'Transit Casing Crack',
      quarantineBay: 'Dhaka Salvage Bay',
      status: 'Sent to Kushtia Factory for Recell',
      lossValueBDT: 114600,
    },
  ]);

  const handleRecordDamage = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === damageProdId) || products[0];
    const unitLoss = prod.distributorPriceBDT ? Math.round(prod.distributorPriceBDT * 0.72) : 75000;
    const newRecord = {
      id: `DMG-RET-0${damageRecordsList.length + 1}`,
      date: new Date().toISOString().substring(0, 10),
      productName: prod.name,
      sku: prod.code,
      serial: damageSerial,
      qty: Number(damageQty),
      reason: damageReason,
      quarantineBay: damageQuarantineBay,
      status: 'In Quarantine',
      lossValueBDT: Number(damageQty) * unitLoss,
    };
    setDamageRecordsList([newRecord, ...damageRecordsList]);
  };

  // ==========================================
  // SUB-TAB 9: STOCK TRANSFER STATE
  // ==========================================
  const [transferFromWh, setTransferFromWh] = useState(cidWarehouse.id);
  const [transferToWh, setTransferToWh] = useState(
    warehouses.find((w) => w.id !== cidWarehouse.id)?.id || warehouses[1]?.id || ''
  );
  const [transferProdId, setTransferProdId] = useState(products[0]?.id || 'p-1');
  const [transferQty, setTransferQty] = useState(25);
  const [transferDriver, setTransferDriver] = useState('Abul Kalam');
  const [transferTruck, setTransferTruck] = useState('Dhaka Metro TA-14-8891');

  const handleCreateTransferRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const fromWh = warehouses.find((w) => w.id === transferFromWh);
    const toWh = warehouses.find((w) => w.id === transferToWh);
    const prod = products.find((p) => p.id === transferProdId);
    if (!fromWh || !toWh || !prod || fromWh.id === toWh.id) return;

    createStockTransfer({
      date: new Date().toISOString().substring(0, 10),
      fromWarehouseId: fromWh.id,
      fromWarehouseName: fromWh.name,
      toWarehouseId: toWh.id,
      toWarehouseName: toWh.name,
      productId: prod.id,
      productName: prod.name,
      batchNumber: 'KUS-B2610-TRANSFER',
      quantity: Number(transferQty),
      driverName: transferDriver,
      truckNumber: transferTruck,
      requestedBy: currentUser?.name || 'Supply Chain Officer',
    });
  };

  // ==========================================
  // SUB-TAB 10: WAREHOUSE STOCK ADJUSTMENT STATE
  // ==========================================
  const [adjustWhId, setAdjustWhId] = useState<string>(cidWarehouse?.id || 'wh-dhaka-1');
  const [adjustProdId, setAdjustProdId] = useState<string>(products[0]?.id || 'p-1');
  const [adjustBatch, setAdjustBatch] = useState<string>('KUS-B2610-01');
  const [adjustDate, setAdjustDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [adjustMode, setAdjustMode] = useState<'Increase' | 'Decrease'>('Increase');
  const [adjustQtyInput, setAdjustQtyInput] = useState<number>(2);
  const [adjustReason, setAdjustReason] = useState<string>(
    'Physical audit variance identified during routine bin verification.'
  );
  const [adjustCategory, setAdjustCategory] = useState<StockAdjustmentRecord['category']>('Physical Audit Variance');
  const [adjustNotes, setAdjustNotes] = useState<string>(
    'Approved by warehouse controller and verified against physical count sheet.'
  );
  const [adjustAuthorizedBy, setAdjustAuthorizedBy] = useState<string>(
    currentUser?.name || 'Rafiqul Alam (CID Controller)'
  );
  const [adjustSearch, setAdjustSearch] = useState<string>('');
  const [adjustWhFilter, setAdjustWhFilter] = useState<string>('all');
  const [selectedAdjustmentForSlip, setSelectedAdjustmentForSlip] = useState<StockAdjustmentRecord | null>(null);

  const selectedAdjustWh = warehouses.find((w) => w.id === adjustWhId) || cidWarehouse;
  const selectedAdjustProd = products.find((p) => p.id === adjustProdId) || products[0];
  const unitCostForAdjustment = selectedAdjustProd?.distributorPriceBDT
    ? Math.round(selectedAdjustProd.distributorPriceBDT * 0.72)
    : 75000;

  const currentWhStockCount = selectedAdjustWh?.currentStockUnits || 0;
  const effectiveQtyDelta = adjustMode === 'Increase' ? Math.abs(adjustQtyInput) : -Math.abs(adjustQtyInput);
  const resultingStockCount = Math.max(0, currentWhStockCount + effectiveQtyDelta);
  const totalVarianceCostBDT = effectiveQtyDelta * unitCostForAdjustment;

  const handleApplyStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdjustWh || !selectedAdjustProd || adjustQtyInput <= 0) return;

    const newId = addStockAdjustmentRecord({
      date: adjustDate,
      warehouseId: selectedAdjustWh.id,
      warehouseName: selectedAdjustWh.name,
      productId: selectedAdjustProd.id,
      productName: selectedAdjustProd.name,
      sku: selectedAdjustProd.code,
      batchNumber: adjustBatch,
      adjustmentType: adjustMode,
      qtyDelta: effectiveQtyDelta,
      unitCostBDT: unitCostForAdjustment,
      reason: adjustReason,
      category: adjustCategory,
      adjustedBy: currentUser?.name || 'Rafiqul Alam (Store Manager)',
      notes: adjustNotes,
    });

    const createdRecord: StockAdjustmentRecord = {
      id: newId,
      referenceNo: `ADJ-2026-10-${Math.floor(100 + Math.random() * 900)}`,
      date: adjustDate,
      warehouseId: selectedAdjustWh.id,
      warehouseName: selectedAdjustWh.name,
      productId: selectedAdjustProd.id,
      productName: selectedAdjustProd.name,
      sku: selectedAdjustProd.code,
      batchNumber: adjustBatch,
      adjustmentType: adjustMode,
      qtyDelta: effectiveQtyDelta,
      previousQty: currentWhStockCount,
      newQty: resultingStockCount,
      unitCostBDT: unitCostForAdjustment,
      totalCostVarianceBDT: totalVarianceCostBDT,
      reason: adjustReason,
      category: adjustCategory,
      adjustedBy: currentUser?.name || 'Rafiqul Alam (Store Manager)',
      notes: adjustNotes,
    };

    setSelectedAdjustmentForSlip(createdRecord);
    setAdjustQtyInput(1);
  };

  const filteredAdjustments = useMemo(() => {
    return stockAdjustmentRecords.filter((rec) => {
      const matchWh = adjustWhFilter === 'all' || rec.warehouseId === adjustWhFilter;
      const matchSearch =
        adjustSearch === '' ||
        rec.referenceNo.toLowerCase().includes(adjustSearch.toLowerCase()) ||
        rec.productName.toLowerCase().includes(adjustSearch.toLowerCase()) ||
        rec.warehouseName.toLowerCase().includes(adjustSearch.toLowerCase()) ||
        rec.reason.toLowerCase().includes(adjustSearch.toLowerCase());
      return matchWh && matchSearch;
    });
  }, [stockAdjustmentRecords, adjustWhFilter, adjustSearch]);

  // Top metrics computation
  const totalCidStockUnits = cidWarehouse?.currentStockUnits || 1450;
  const totalCidValuationEstimate = totalCidStockUnits * 52000;
  const totalMrrCount = cidStockReceipts.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Stock & Central Inventory (CID)
                </h1>
                
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live Inventory
                </span>
              </div>
              
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                CID Physical Stock
              </span>
              <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                {totalCidStockUnits.toLocaleString()} units
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                CID Valuation
              </span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                BDT {totalCidValuationEstimate.toLocaleString()}
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Inward MRR Receipts
              </span>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {totalMrrCount} Batches
              </span>
            </div>
          </div>
        </div>

        {/* 9 Tab Navigation (Matches screenshot directly) */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
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
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as StockSubTab)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          {/* Direct link to Inventory Stock (CTN & PCS) */}
          <button
            onClick={() => onNavigate && onNavigate('inventory-stock')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all ml-auto shrink-0"
            title="View current finished product stock warehouse-wise in Cartons & Pieces"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Inventory Stock (CTN / PCS)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: CID RECEIVE (PHYSICAL FINISHED STOCK RECEIVED MANUALLY)       */}
      {/* ========================================================================= */}
      {currentTab === 'stock-cid-receive' && (
        <div className="space-y-6">
          {/* Sub Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCidViewMode('form')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  cidViewMode === 'form'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manual Stock Receive Form</span>
              </button>
              <button
                onClick={() => setCidViewMode('register')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  cidViewMode === 'register'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>CID Receive Register (MRR Log)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {cidStockReceipts.length}
                </span>
              </button>
            </div>

            {cidViewMode === 'form' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 transition-colors"
                >
                  Clear Form
                </button>
              </div>
            )}
          </div>

          {/* VIEW MODE: MANUAL INWARD FORM */}
          {cidViewMode === 'form' && (
            <form onSubmit={handleInitiateCIDReceipt} className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Archive className="w-4 h-4 text-blue-600" />
                    CID Material Receive Report (MRR) — Manual Physical Goods Inward
                  </h2>
                  
                </div>

                {/* Section A: Header Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      MRR Voucher Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={mrrNumber}
                      onChange={(e) => setMrrNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Inward Receipt Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Target Warehouse / Depot *
                    </label>
                    <select
                      value={targetWhId}
                      onChange={(e) => setTargetWhId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name} ({wh.district})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Source / Production Origin *
                    </label>
                    <select
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Kushtia Manufacturing Plant">Kushtia Manufacturing Plant</option>
                      <option value="Optimum JV Joint Venture Plant">Optimum JV Joint Venture Plant</option>
                      <option value="Factory Assembly Line 1 (LiFePO4 ESS)">Factory Assembly Line 1 (LiFePO4 ESS)</option>
                      <option value="Factory Assembly Line 2 (EV 60V / 72V)">Factory Assembly Line 2 (EV 60V / 72V)</option>
                      <option value="Subcontractor / Direct Production Lot">Subcontractor / Direct Production Lot</option>
                      <option value="Returned Finished Goods (Factory Re-certified)">Returned Finished Goods (Factory Re-certified)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Factory Challan Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={challanNumber}
                      onChange={(e) => setChallanNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Gate Pass Number
                    </label>
                    <input
                      type="text"
                      value={gatePassNumber}
                      onChange={(e) => setGatePassNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Carrier Vehicle Reg No *
                    </label>
                    <input
                      type="text"
                      required
                      value={carrierVehicleNo}
                      onChange={(e) => setCarrierVehicleNo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Driver Name & Phone
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={driverName}
                        placeholder="Driver Name"
                        onChange={(e) => setDriverName(e.target.value)}
                        className="w-1/2 px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                      />
                      <input
                        type="text"
                        value={driverPhone}
                        placeholder="Mobile"
                        onChange={(e) => setDriverPhone(e.target.value)}
                        className="w-1/2 px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      CID Receiving Storekeeper *
                    </label>
                    <input
                      type="text"
                      required
                      value={receivedByOfficer}
                      onChange={(e) => setReceivedByOfficer(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      QC Testing Inspector *
                    </label>
                    <input
                      type="text"
                      required
                      value={qcInspector}
                      onChange={(e) => setQcInspector(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      QC Clearance Status *
                    </label>
                    <select
                      value={qcStatus}
                      onChange={(e) => setQcStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-emerald-600 dark:text-emerald-400 font-bold"
                    >
                      <option value="QC Passed & Stamped">QC Passed & Stamped</option>
                      <option value="Accepted with Condition">Accepted with Condition</option>
                      <option value="Quarantine / Pending Test">Quarantine / Pending Test</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Receiving Status *
                    </label>
                    <select
                      value={receiptStatus}
                      onChange={(e) => setReceiptStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-blue-600 dark:text-blue-400"
                    >
                      <option value="Received & Stocked">Received & Stocked (Live Ledger)</option>
                      <option value="Under Inspection">Under Inspection (Temporary Bay)</option>
                      <option value="Draft">Draft Only</option>
                    </select>
                  </div>
                </div>

                {/* Section B: Line Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Finished Battery Packs Inward List
                      </h3>
                      
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFormItem}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Battery Row</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3 min-w-[200px]">Finished Product</th>
                          <th className="p-3 min-w-[120px]">Batch No</th>
                          <th className="p-3 min-w-[140px]">Serial Range</th>
                          <th className="p-3 text-right">Physical Qty</th>
                          <th className="p-3 text-right">Unit Cost BDT</th>
                          <th className="p-3 text-right">Subtotal BDT</th>
                          <th className="p-3 min-w-[140px]">CID Rack Bay</th>
                          <th className="p-3 min-w-[140px]">Packaging</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {formItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                            <td className="p-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="p-3">
                              <select
                                value={item.productId}
                                onChange={(e) => handleProductSelect(idx, e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.code})
                                  </option>
                                ))}
                              </select>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                SKU: {item.sku} • {item.category}
                              </div>
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={item.batchNumber}
                                onChange={(e) => handleItemFieldChange(idx, 'batchNumber', e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold font-mono"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="SN-001 to 050"
                                value={item.serialRange || ''}
                                onChange={(e) => handleItemFieldChange(idx, 'serialRange', e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                              />
                            </td>
                            <td className="p-3 text-right">
                              <input
                                type="number"
                                min={1}
                                value={item.receivedQty}
                                onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                                className="w-20 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-right text-blue-600 dark:text-blue-400"
                              />
                            </td>
                            <td className="p-3 text-right">
                              <input
                                type="number"
                                min={0}
                                value={item.unitCostBDT}
                                onChange={(e) => handleUnitCostChange(idx, parseInt(e.target.value) || 0)}
                                className="w-24 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-right"
                              />
                            </td>
                            <td className="p-3 text-right font-extrabold text-slate-900 dark:text-white">
                              BDT {item.totalCostBDT.toLocaleString()}
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={item.rackLocation}
                                onChange={(e) => handleItemFieldChange(idx, 'rackLocation', e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={item.packageCondition}
                                onChange={(e) => handleItemFieldChange(idx, 'packageCondition', e.target.value as any)}
                                className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                              >
                                <option value="Pristine Export Packing">Pristine Export Packing</option>
                                <option value="Factory Sealed Box">Factory Sealed Box</option>
                                <option value="Minor Outer Carton Scuff">Minor Outer Carton Scuff</option>
                                <option value="QC Sampled & Verified">QC Sampled & Verified</option>
                              </select>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                disabled={formItems.length === 1}
                                onClick={() => handleRemoveFormItem(idx)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section C: Summary & Submit Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        Total Inward Batteries:
                      </span>
                      <span className="text-base font-extrabold text-blue-700 dark:text-blue-300">
                        {totalFormQty.toLocaleString()} units
                      </span>
                    </div>
                    <div className="border-l border-blue-200 dark:border-blue-900 pl-4">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        Total Inward Valuation:
                      </span>
                      <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                        BDT {totalFormValuation.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-l border-blue-200 dark:border-blue-900 pl-4 hidden md:block">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        Destination Store:
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {warehouses.find((w) => w.id === targetWhId)?.name || 'CID Dhaka'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Post & Receive into CID Physical Stock</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* VIEW MODE: MRR REGISTER */}
          {cidViewMode === 'register' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    CID Material Receive Register (MRR History)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Audit log of all physical finished goods received from manufacturing plants and suppliers into Central Inventory.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsRefreshingCid(true);
                      await refreshCIDStockReceipts?.();
                      setTimeout(() => setIsRefreshingCid(false), 500);
                    }}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-medium px-2.5"
                    title="Sync and refresh CID receipts from Supabase"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCid ? 'animate-spin text-blue-600' : ''}`} />
                    <span className="hidden sm:inline">Sync Database</span>
                  </button>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search MRR #, Challan #, Batch..."
                      value={mrrSearch}
                      onChange={(e) => setMrrSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden w-64"
                    />
                  </div>

                  <select
                    value={mrrFilterQc}
                    onChange={(e) => setMrrFilterQc(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-hidden"
                  >
                    <option value="all">All QC Status</option>
                    <option value="QC Passed & Stamped">QC Passed</option>
                    <option value="Accepted with Condition">Accepted with Condition</option>
                    <option value="Quarantine / Pending Test">Quarantine</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">MRR Number</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Source Plant / Origin</th>
                      <th className="p-3">Challan & Gate Pass</th>
                      <th className="p-3">Vehicle & Driver</th>
                      <th className="p-3 text-right">Units Received</th>
                      <th className="p-3 text-right">Valuation (BDT)</th>
                      <th className="p-3">QC Status</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredReceipts.map((receipt) => (
                      <tr key={receipt.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="p-3">
                          <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                            {receipt.mrrNumber}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            ID: {receipt.id}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">
                          {receipt.receiptDate}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {receipt.sourceType}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {receipt.warehouseName}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          <span className="text-slate-700 dark:text-slate-300 block font-semibold">
                            {receipt.challanNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            GP: {receipt.gatePassNumber || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-800 dark:text-slate-200 block">
                            {receipt.carrierVehicleNo || 'N/A'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {receipt.driverName || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-extrabold text-blue-600 dark:text-blue-400">
                            {receipt.totalQuantity} units
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {receipt.items?.length || 0} line(s)
                          </span>
                        </td>
                        <td className="p-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          BDT {Number(receipt.totalValueBDT || receipt.totalAmountBDT || 0).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                              receipt.qcStatus === 'QC Passed & Stamped'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : receipt.qcStatus === 'Accepted with Condition'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {receipt.qcStatus}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedReceiptForVoucher(receipt)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-semibold text-[11px] flex items-center gap-1"
                            >
                              <Printer className="w-3 h-3" />
                              <span>MRR Voucher</span>
                            </button>
                            <button
                              onClick={() => deleteCIDStockReceipt(receipt.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Delete Receipt"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: CREATE OPENING STOCK                                          */}
      {/* ========================================================================= */}
      {currentTab === 'stock-create-opening' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Archive className="w-4 h-4 text-blue-600" />
                Create Opening Finished Stock (Manual Baseline Entry)
              </h2>
              
            </div>

            <form onSubmit={handleCreateOpeningStock} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Select Target Warehouse Depot *
                  </label>
                  <select
                    value={openingWhId}
                    onChange={(e) => setOpeningWhId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.district})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Opening / Cutoff Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={openingDate}
                    onChange={(e) => setOpeningDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Opening Batch Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={openingBatch}
                    onChange={(e) => setOpeningBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Finished Battery Product *
                  </label>
                  <select
                    value={openingProdId}
                    onChange={(e) => {
                      setOpeningProdId(e.target.value);
                      const p = products.find((prod) => prod.id === e.target.value);
                      if (p?.distributorPriceBDT) {
                        setOpeningUnitCost(Math.round(p.distributorPriceBDT * 0.7));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Opening Physical Quantity (Units) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={openingQty}
                    onChange={(e) => setOpeningQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-600 dark:text-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Baseline Unit Cost (BDT) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={openingUnitCost}
                    onChange={(e) => setOpeningUnitCost(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    CID Storage Rack Location
                  </label>
                  <input
                    type="text"
                    value={openingRack}
                    onChange={(e) => setOpeningRack(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Opening Notes & Auditor Verification
                  </label>
                  <input
                    type="text"
                    value={openingNotes}
                    onChange={(e) => setOpeningNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Post Opening Stock into Warehouse & Ledger</span>
                </button>
              </div>
            </form>

            {/* Opening Register */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recorded Opening Stock History
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Warehouse</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3 font-mono">Batch</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Unit Cost</th>
                      <th className="p-3 text-right">Total Cost BDT</th>
                      <th className="p-3">Rack Bay</th>
                      <th className="p-3">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {openingStockRecords.map((op) => (
                      <tr key={op.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-mono text-slate-500">{op.date}</td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {op.warehouseName}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold block">{op.productName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{op.sku}</span>
                        </td>
                        <td className="p-3 font-mono">{op.batchNumber}</td>
                        <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">
                          {op.quantity} units
                        </td>
                        <td className="p-3 text-right">BDT {op.unitCostBDT.toLocaleString()}</td>
                        <td className="p-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          BDT {op.totalCostBDT.toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-500">{op.rackLocation}</td>
                        <td className="p-3 text-slate-400 text-[11px]">{op.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: UPLOAD OPENING STOCK                                          */}
      {/* ========================================================================= */}
      {currentTab === 'stock-upload-opening' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Upload Opening Stock (Bulk Excel / CSV Ingestion)
                </h2>
                
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent(
                    'SKU,Product_Name,Warehouse_Code,Batch_Number,Quantity,Unit_Cost_BDT,Rack_Location\nENS-TEL-48100,Ensec Telecom PowerRack LiFePO4 48V 100Ah,wh-dhaka-1,OP-B2610-01,30,75070,Bay A-01\nENS-SOL-12200,Ensec SolarPro LiFePO4 12.8V 200Ah,wh-dhaka-1,OP-B2610-02,50,29500,Bay B-03\n'
                  )}`}
                  download="ensec_opening_stock_template.csv"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV Template</span>
                </a>
                <button
                  onClick={handlePreloadOpeningSample}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preload Sample Data</span>
                </button>
              </div>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Drag and drop your Opening Stock CSV file here, or click to browse
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports UTF-8 .CSV and .TXT files with column headers: SKU, Product_Name, Warehouse_Code, Batch_Number, Quantity, Unit_Cost_BDT, Rack_Location
                </p>
              </div>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handlePreloadOpeningSample();
                  }
                }}
                className="hidden"
                id="opening-csv-input"
              />
              <label
                htmlFor="opening-csv-input"
                className="inline-block px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Choose Local CSV File
              </label>
            </div>

            {/* Preview table */}
            {openingUploadRows.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Parsed Opening Stock Rows</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {openingUploadRows.length} Records Verified
                    </span>
                  </h3>

                  {!uploadOpeningCommitted ? (
                    <button
                      onClick={handleCommitBulkOpeningStock}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Commit Bulk Opening Stock into System</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Successfully Committed to Live Inventory!</span>
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Warehouse</th>
                        <th className="p-3 font-mono">Batch</th>
                        <th className="p-3 text-right">Quantity</th>
                        <th className="p-3 text-right">Unit Cost</th>
                        <th className="p-3">Rack Bay</th>
                        <th className="p-3">Validation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {openingUploadRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {row.sku}
                          </td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                            {row.productName}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">
                            {row.whCode}
                          </td>
                          <td className="p-3 font-mono">{row.batch}</td>
                          <td className="p-3 text-right font-extrabold text-blue-600 dark:text-blue-400">
                            {row.qty}
                          </td>
                          <td className="p-3 text-right">BDT {row.unitCost.toLocaleString()}</td>
                          <td className="p-3 text-slate-500">{row.rack}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              {row.statusText}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: UPLOAD PRIMARY                                                */}
      {/* ========================================================================= */}
      {currentTab === 'stock-upload-primary' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Upload Primary (Factory Primary Dispatch Challans)
                </h2>
                
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreloadPrimarySample}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preload Sample Factory Consignment</span>
                </button>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Upload Primary Dispatch Consignments
              </p>
              <p className="text-[11px] text-slate-400">
                Columns: Challan_No, Date, Source_Plant, Destination_Warehouse, SKU, Batch, Quantity, Valuation, Vehicle_Reg
              </p>
            </div>

            {primaryUploadRows.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Pending Primary Consignments Preview
                  </h3>
                  {!primaryUploadCommitted ? (
                    <button
                      onClick={handleProcessPrimaryInward}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Process Inward into CID Stock</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Primary Dispatches Stocked into CID!</span>
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">Challan No</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Source Plant</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3 font-mono">Batch</th>
                        <th className="p-3 text-right">Quantity</th>
                        <th className="p-3 text-right">Valuation BDT</th>
                        <th className="p-3">Vehicle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {primaryUploadRows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-bold font-mono text-blue-600 dark:text-blue-400">
                            {r.challanNo}
                          </td>
                          <td className="p-3 font-mono text-slate-500">{r.date}</td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                            {r.sourcePlant}
                          </td>
                          <td className="p-3">{r.productName}</td>
                          <td className="p-3 font-mono">{r.batch}</td>
                          <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">
                            {r.qty} units
                          </td>
                          <td className="p-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                            BDT {r.valueBDT.toLocaleString()}
                          </td>
                          <td className="p-3 font-mono text-slate-500">{r.vehicle}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: ISSUED                                                        */}
      {/* ========================================================================= */}
      {currentTab === 'stock-issued' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderOutput className="w-4 h-4 text-blue-600" />
                Finished Stock Issued & Outward Dispatch Register
              </h2>
              
            </div>

            <form onSubmit={handleIssueStock} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Issue Reason / Type *
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="Distributor Order Dispatch">Distributor Order Dispatch</option>
                    <option value="Inter-Branch Transfer Out">Inter-Branch Transfer Out</option>
                    <option value="Warranty Replacement Issue">Warranty Replacement Issue</option>
                    <option value="Testing / Sample Demo">Testing / Sample Demo</option>
                    <option value="Internal Department">Internal Department</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Recipient / Distributor / Depot *
                  </label>
                  <input
                    type="text"
                    required
                    value={issueRecipient}
                    onChange={(e) => setIssueRecipient(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Reference Order / Requisition #
                  </label>
                  <input
                    type="text"
                    value={issueRefNo}
                    onChange={(e) => setIssueRefNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Gate Pass Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={issueGatePass}
                    onChange={(e) => setIssueGatePass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Select Battery Product *
                  </label>
                  <select
                    value={issueProdId}
                    onChange={(e) => setIssueProdId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={issueBatch}
                    onChange={(e) => setIssueBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Quantity to Issue *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={issueQty}
                    onChange={(e) => setIssueQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-600 dark:text-blue-400"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <FolderOutput className="w-4 h-4" />
                    <span>Issue Stock & Generate Gate Pass</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Issued Register */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Historical Outward Issues Log
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Issue No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Recipient</th>
                      <th className="p-3">Ref No</th>
                      <th className="p-3 text-right">Total Units</th>
                      <th className="p-3 text-right">Value BDT</th>
                      <th className="p-3">Gate Pass</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {stockIssueRecords.map((iss) => (
                      <tr key={iss.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {iss.issueNumber}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{iss.date}</td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {iss.issueType}
                        </td>
                        <td className="p-3">{iss.recipientName}</td>
                        <td className="p-3 font-mono text-slate-500">{iss.referenceNo}</td>
                        <td className="p-3 text-right font-extrabold text-blue-600 dark:text-blue-400">
                          {iss.totalQty} units
                        </td>
                        <td className="p-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          BDT {iss.totalValueBDT.toLocaleString()}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{iss.gatePassNumber}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            {iss.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: RECEIVED                                                      */}
      {/* ========================================================================= */}
      {currentTab === 'stock-received' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-blue-600" />
                Goods Received & Inward Register
              </h2>
              
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Inward Reference</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Source Origin</th>
                    <th className="p-3">Destination Warehouse</th>
                    <th className="p-3 text-right">Physical Qty</th>
                    <th className="p-3 text-right">Valuation BDT</th>
                    <th className="p-3">QC Status</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {cidStockReceipts.map((rc) => (
                    <tr key={rc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {rc.mrrNumber}
                      </td>
                      <td className="p-3 font-mono text-slate-500">{rc.receiptDate}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {rc.sourceType}
                      </td>
                      <td className="p-3">{rc.warehouseName}</td>
                      <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">
                        {rc.totalQuantity} units
                      </td>
                      <td className="p-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                        BDT {rc.totalValueBDT.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {rc.qcStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {rc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7: PRIMARY RETURN                                                */}
      {/* ========================================================================= */}
      {currentTab === 'stock-primary-return' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CornerDownLeft className="w-4 h-4 text-blue-600" />
                Primary Return (Distributor & Depot Inward Return)
              </h2>
            
            </div>

            <form onSubmit={handleRecordPrimaryReturn} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Returning Distributor / Depot *
                  </label>
                  <input
                    type="text"
                    required
                    value={returnFrom}
                    onChange={(e) => setReturnFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Returned Battery Product *
                  </label>
                  <select
                    value={returnProdId}
                    onChange={(e) => setReturnProdId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={returnBatch}
                    onChange={(e) => setReturnBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Returned Quantity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={returnQty}
                    onChange={(e) => setReturnQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-600 dark:text-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Return Reason *
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="Excess Distributor Inventory">Excess Distributor Inventory</option>
                    <option value="Order Specification Mismatch">Order Specification Mismatch</option>
                    <option value="Seasonal Depot Reallocation">Seasonal Depot Reallocation</option>
                    <option value="Packaging Distress">Packaging Distress</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    QC Inspection Outcome *
                  </label>
                  <select
                    value={returnQcStatus}
                    onChange={(e) => setReturnQcStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-hidden"
                  >
                    <option value="Restocked to Active CID">Restocked to Active CID Physical Inventory</option>
                    <option value="Quarantine Inspection">Quarantine Bay Inspection</option>
                    <option value="Sent to Factory">Sent to Kushtia Factory for Recell</option>
                  </select>
                </div>

                <div className="sm:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <CornerDownLeft className="w-4 h-4" />
                    <span>Process Primary Return & Restock</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Return history */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Primary Return Log
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Return No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Origin Distributor</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3 font-mono">Batch</th>
                      <th className="p-3 text-right">Quantity</th>
                      <th className="p-3 text-right">Valuation</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">QC Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {primaryReturnRecords.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {ret.returnNumber}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{ret.date}</td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {ret.distributorOrPlant}
                        </td>
                        <td className="p-3">{ret.productName}</td>
                        <td className="p-3 font-mono">{ret.batchNumber}</td>
                        <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">
                          {ret.quantity} units
                        </td>
                        <td className="p-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          BDT {ret.totalValueBDT.toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{ret.reason}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {ret.qcStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 8: DAMAGE RETURN                                                 */}
      {/* ========================================================================= */}
      {currentTab === 'stock-damage-return' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GitFork className="w-4 h-4 text-rose-600" />
                Damage Return & Quarantine Bay Management
              </h2>
              
            </div>

            <form onSubmit={handleRecordDamage} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Select Defective Product *
                  </label>
                  <select
                    value={damageProdId}
                    onChange={(e) => setDamageProdId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Battery Serial Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={damageSerial}
                    onChange={(e) => setDamageSerial(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Defective Quantity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={damageQty}
                    onChange={(e) => setDamageQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-rose-600 dark:text-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Defect Reason *
                  </label>
                  <select
                    value={damageReason}
                    onChange={(e) => setDamageReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="BMS Failure / Short Circuit">BMS Failure / Short Circuit</option>
                    <option value="Cell Swelling">Cell Swelling</option>
                    <option value="Transit Casing Crack">Transit Casing Crack</option>
                    <option value="Low Under-Voltage">Low Under-Voltage</option>
                    <option value="Terminal Burnout">Terminal Burnout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Origin Warehouse Location
                  </label>
                  <input
                    type="text"
                    value={damageOrigin}
                    onChange={(e) => setDamageOrigin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Designated Quarantine Bay *
                  </label>
                  <input
                    type="text"
                    value={damageQuarantineBay}
                    onChange={(e) => setDamageQuarantineBay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Log Damage & Move to Quarantine Bay</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Damage Register */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Damaged Finished Units Log
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Record ID</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3 font-mono">Serial No</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3">Defect Reason</th>
                      <th className="p-3">Quarantine Bay</th>
                      <th className="p-3 text-right">Loss Value</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {damageRecordsList.map((dmg) => (
                      <tr key={dmg.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                          {dmg.id}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{dmg.date}</td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {dmg.productName}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{dmg.serial}</td>
                        <td className="p-3 text-right font-bold text-rose-600 dark:text-rose-400">
                          {dmg.qty} units
                        </td>
                        <td className="p-3 font-semibold text-amber-600 dark:text-amber-400">
                          {dmg.reason}
                        </td>
                        <td className="p-3 text-slate-500">{dmg.quarantineBay}</td>
                        <td className="p-3 text-right font-extrabold text-slate-800 dark:text-slate-200">
                          BDT {dmg.lossValueBDT.toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            {dmg.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 9: STOCK TRANSFER                                                */}
      {/* ========================================================================= */}
      {currentTab === 'stock-transfer' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                Inter-Warehouse Stock Transfer (CID ↔ Regional Hubs)
              </h2>
              
            </div>

            <form onSubmit={handleCreateTransferRequest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    From Warehouse (Origin) *
                  </label>
                  <select
                    value={transferFromWh}
                    onChange={(e) => setTransferFromWh(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.district})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    To Warehouse (Destination) *
                  </label>
                  <select
                    value={transferToWh}
                    onChange={(e) => setTransferToWh(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                  >
                    {warehouses
                      .filter((w) => w.id !== transferFromWh)
                      .map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name} ({wh.district})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Select Battery Product *
                  </label>
                  <select
                    value={transferProdId}
                    onChange={(e) => setTransferProdId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Transfer Quantity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={transferQty}
                    onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-600 dark:text-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={transferDriver}
                    onChange={(e) => setTransferDriver(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Truck Reg Number
                  </label>
                  <input
                    type="text"
                    value={transferTruck}
                    onChange={(e) => setTransferTruck(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Create Transfer Consignment</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Transfer list */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Active & Completed Transfers Pipeline
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Transfer No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">From Warehouse</th>
                      <th className="p-3">To Warehouse</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3 text-right">Units</th>
                      <th className="p-3">Carrier</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {stockTransfers.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {tr.transferNumber}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{tr.date}</td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {tr.fromWarehouseName}
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {tr.toWarehouseName}
                        </td>
                        <td className="p-3">{tr.productName}</td>
                        <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">
                          {tr.quantity} units
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {tr.truckNumber} • {tr.driverName}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tr.status === 'Received'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : tr.status === 'In Transit'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {tr.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {tr.status === 'Requested' && (
                            <button
                              onClick={() => approveStockTransfer(tr.id)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold text-[11px] hover:bg-blue-700"
                            >
                              Dispatch
                            </button>
                          )}
                          {tr.status === 'In Transit' && (
                            <button
                              onClick={() => receiveStockTransfer(tr.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700"
                            >
                              Receive
                            </button>
                          )}
                          {tr.status === 'Received' && (
                            <span className="text-[11px] font-semibold text-slate-400">
                              Completed
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 10: WAREHOUSE-WISE STOCK ADJUSTMENT                              */}
      {/* ========================================================================= */}
      {currentTab === 'stock-adjustment' && (
        <div className="space-y-6">
          {/* Top Banner & Warehouse Switcher */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  Warehouse-Wise Physical Stock Adjustment & Reconciliation
                </h2>
                
              </div>

              {/* Warehouse Depot Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Active Depot:
                </span>
                <select
                  value={adjustWhId}
                  onChange={(e) => setAdjustWhId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-600 dark:text-blue-400 focus:outline-hidden"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.district})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Warehouse Live Status Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 to-indigo-50/40 dark:from-slate-800/60 dark:to-slate-800/30 border border-blue-200/60 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <WarehouseIcon className="w-4 h-4 text-blue-600" />
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {selectedAdjustWh?.name}
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {selectedAdjustWh?.type || 'Central Hub'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Location: <b>{selectedAdjustWh?.location}</b> • Manager: <b>{selectedAdjustWh?.managerName}</b> ({selectedAdjustWh?.phone})
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="bg-white/80 dark:bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Stock</span>
                  <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                    {currentWhStockCount.toLocaleString()} units
                  </span>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Hub Capacity</span>
                  <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300 font-mono">
                    {selectedAdjustWh?.capacityUnits.toLocaleString()} units
                  </span>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Valuation</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    BDT {(currentWhStockCount * 52000).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Adjustment Form */}
            <form onSubmit={handleApplyStockAdjustment} className="space-y-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/40 dark:bg-slate-800/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-3.5 h-3.5 text-blue-600" />
                    <span>Record Stock Adjustment in {selectedAdjustWh?.name}</span>
                  </h3>
                  <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-700 p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setAdjustMode('Increase')}
                      className={`px-3 py-1 rounded-md font-bold transition-all ${
                        adjustMode === 'Increase'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      + Add Stock (Surplus)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustMode('Decrease')}
                      className={`px-3 py-1 rounded-md font-bold transition-all ${
                        adjustMode === 'Decrease'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      - Deduct Stock (Deficit / Damage)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Target Warehouse Depot *
                    </label>
                    <select
                      value={adjustWhId}
                      onChange={(e) => setAdjustWhId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                    >
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name} ({wh.district})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Finished Battery Product *
                    </label>
                    <select
                      value={adjustProdId}
                      onChange={(e) => setAdjustProdId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Batch Identifier
                    </label>
                    <input
                      type="text"
                      value={adjustBatch}
                      onChange={(e) => setAdjustBatch(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Adjustment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={adjustDate}
                      onChange={(e) => setAdjustDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Adjusted Quantity (Units) *
                    </label>
                    <div className="relative">
                      <span
                        className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm ${
                          adjustMode === 'Increase' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {adjustMode === 'Increase' ? '+' : '-'}
                      </span>
                      <input
                        type="number"
                        min={1}
                        required
                        value={adjustQtyInput}
                        onChange={(e) => setAdjustQtyInput(parseInt(e.target.value) || 1)}
                        className={`w-full pl-7 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-right ${
                          adjustMode === 'Increase'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Unit Cost Estimate (BDT) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      readOnly
                      value={unitCostForAdjustment}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Adjustment Category *
                    </label>
                    <select
                      value={adjustCategory}
                      onChange={(e) => setAdjustCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="Physical Audit Variance">Physical Audit Variance</option>
                      <option value="Transit Damage Write-off">Transit Damage Write-off</option>
                      <option value="Cell Voltage Degradation">Cell Voltage Degradation (&lt;40V)</option>
                      <option value="Rework & Packaging Salvage">Rework & Packaging Salvage</option>
                      <option value="Bin Relocation Discrepancy">Bin Relocation Discrepancy</option>
                      <option value="Found Stock / Reversal">Found Stock / Reversal</option>
                      <option value="Management Discretion">Management Discretion</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Authorized Auditor / Officer *
                    </label>
                    <input
                      type="text"
                      required
                      value={adjustAuthorizedBy}
                      onChange={(e) => setAdjustAuthorizedBy(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Specific Reason & Justification *
                    </label>
                    <input
                      type="text"
                      required
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Audit Verification Notes
                    </label>
                    <input
                      type="text"
                      value={adjustNotes}
                      onChange={(e) => setAdjustNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Calculation Preview Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Current Stock:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                        {currentWhStockCount} units
                      </span>
                    </div>
                    <div className="border-l border-slate-300 dark:border-slate-700 pl-3">
                      <span className="text-[10px] text-slate-400 font-bold block">Adjustment Delta:</span>
                      <span
                        className={`font-black font-mono text-sm ${
                          effectiveQtyDelta > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {effectiveQtyDelta > 0 ? `+${effectiveQtyDelta}` : effectiveQtyDelta} units
                      </span>
                    </div>
                    <div className="border-l border-slate-300 dark:border-slate-700 pl-3">
                      <span className="text-[10px] text-slate-400 font-bold block">New Resulting Stock:</span>
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono text-sm">
                        {resultingStockCount} units
                      </span>
                    </div>
                    <div className="border-l border-slate-300 dark:border-slate-700 pl-3">
                      <span className="text-[10px] text-slate-400 font-bold block">Cost Variance:</span>
                      <span
                        className={`font-black font-mono ${
                          totalVarianceCostBDT >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        BDT {totalVarianceCostBDT.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Post Warehouse Stock Adjustment</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Adjustment History Register */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Warehouse Stock Adjustment Register & Audit History</span>
                  </h3>
                  
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search ref #, product, warehouse..."
                      value={adjustSearch}
                      onChange={(e) => setAdjustSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden w-60"
                    />
                  </div>

                  <select
                    value={adjustWhFilter}
                    onChange={(e) => setAdjustWhFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="all">All Warehouses</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Adjustments Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Reference No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Warehouse Hub</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3 font-mono">Batch</th>
                      <th className="p-3 text-center">Type</th>
                      <th className="p-3 text-right">Qty Delta</th>
                      <th className="p-3 text-right">Stock Impact</th>
                      <th className="p-3 text-right">Cost Variance</th>
                      <th className="p-3">Category & Reason</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredAdjustments.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {rec.referenceNo}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{rec.date}</td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {rec.warehouseName}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold block">{rec.productName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{rec.sku}</span>
                        </td>
                        <td className="p-3 font-mono">{rec.batchNumber}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.adjustmentType === 'Increase'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {rec.adjustmentType === 'Increase' ? '+ Surplus' : '- Deficit'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`font-black font-mono text-sm ${
                              rec.qtyDelta > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {rec.qtyDelta > 0 ? `+${rec.qtyDelta}` : rec.qtyDelta}
                          </span>
                        </td>
                        <td className="p-3 text-right text-slate-500 font-mono">
                          {rec.previousQty} → <b className="text-slate-800 dark:text-white">{rec.newQty}</b>
                        </td>
                        <td className="p-3 text-right font-extrabold font-mono">
                          <span
                            className={
                              rec.totalCostVarianceBDT >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            BDT {rec.totalCostVarianceBDT.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-3 max-w-[200px]">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 block line-clamp-1">
                            {rec.category}
                          </span>
                          <span className="text-[10px] text-slate-400 line-clamp-1">
                            {rec.reason}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedAdjustmentForSlip(rec)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-semibold text-[11px] flex items-center gap-1 mx-auto"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Slip</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINTABLE STOCK ADJUSTMENT VOUCHER SLIP                           */}
      {/* ========================================================================= */}
      {selectedAdjustmentForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Physical Stock Adjustment Certificate Voucher
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAdjustmentForSlip(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 print:p-0">
              <div className="border-b-2 border-blue-600 pb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-lg font-black tracking-tight text-blue-600 dark:text-blue-400">
                    ENSEC LITHIUM BATTERIES BANGLADESH
                  </h1>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Warehouse & Central Inventory Operations • Stock Audit Certificate
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-black text-xs uppercase tracking-wider block">
                    ADJUSTMENT VOUCHER
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 block">
                    {selectedAdjustmentForSlip.referenceNo}
                  </span>
                  <span className="text-xs text-slate-500">
                    Date: {selectedAdjustmentForSlip.date}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Warehouse Hub</span>
                  <span className="font-bold">{selectedAdjustmentForSlip.warehouseName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Adjustment Mode</span>
                  <span
                    className={`font-black ${
                      selectedAdjustmentForSlip.adjustmentType === 'Increase'
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {selectedAdjustmentForSlip.adjustmentType === 'Increase'
                      ? 'Stock Addition / Surplus (+)'
                      : 'Stock Deduction / Deficit (-)'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Category</span>
                  <span className="font-bold">{selectedAdjustmentForSlip.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Product Name</span>
                  <span className="font-bold">{selectedAdjustmentForSlip.productName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">SKU / Code</span>
                  <span className="font-bold font-mono">{selectedAdjustmentForSlip.sku}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Batch Number</span>
                  <span className="font-bold font-mono">{selectedAdjustmentForSlip.batchNumber}</span>
                </div>
              </div>

              {/* Quantities & Financial Impact */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Previous On-Hand:</span>
                  <span className="text-base font-bold font-mono">{selectedAdjustmentForSlip.previousQty} units</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Adjusted Delta:</span>
                  <span
                    className={`text-lg font-black font-mono ${
                      selectedAdjustmentForSlip.qtyDelta > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {selectedAdjustmentForSlip.qtyDelta > 0
                      ? `+${selectedAdjustmentForSlip.qtyDelta}`
                      : selectedAdjustmentForSlip.qtyDelta}{' '}
                    units
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">New Resulting Stock:</span>
                  <span className="text-base font-black font-mono text-blue-600 dark:text-blue-400">
                    {selectedAdjustmentForSlip.newQty} units
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Financial Variance:</span>
                  <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                    BDT {selectedAdjustmentForSlip.totalCostVarianceBDT.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Audit Reason:</span>
                <p className="text-slate-600 dark:text-slate-400">{selectedAdjustmentForSlip.reason}</p>
                {selectedAdjustmentForSlip.notes && (
                  <p className="text-[11px] text-slate-400">Notes: {selectedAdjustmentForSlip.notes}</p>
                )}
              </div>

              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-bold block">{selectedAdjustmentForSlip.adjustedBy}</span>
                  <span className="text-[10px] text-slate-400">Warehouse Storekeeper / Controller</span>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-bold block">Internal Audit Authority</span>
                  <span className="text-[10px] text-slate-400">Finance & Supply Chain Lead</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMATION BEFORE POSTING & RECEIVING INTO CID PHYSICAL STOCK     */}
      {/* ========================================================================= */}
      {showCidReceiveConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-850 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Confirm Physical Stock Inward
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Verify goods receipt details before posting to physical inventory
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCidReceiveConfirmModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Alert / Notice Banner */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-900 dark:text-amber-300">
                    Are you sure you want to receive and post this stock?
                  </p>
                  <p className="text-amber-700 dark:text-amber-400 text-[11px]">
                    This action will officially post <strong>{totalFormQty.toLocaleString()} units</strong> into the physical stock register of{' '}
                    <strong>{warehouses.find((w) => w.id === targetWhId)?.name || 'Central Inventory Depot'}</strong> and generate an authenticated MRR voucher.
                  </p>
                </div>
              </div>

              {/* Inbound Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">MRR Voucher #</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{mrrNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Receipt Date</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{receiptDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Total Inward Units</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300 text-sm">{totalFormQty.toLocaleString()} PCS</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Total Value (BDT)</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">BDT {totalFormValuation.toLocaleString()}</span>
                </div>
              </div>

              {/* Logistics & Authorization Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Target Warehouse:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {warehouses.find((w) => w.id === targetWhId)?.name || 'Central Inventory Depot'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Production Source:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{sourceType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Challan / Gate Pass:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {challanNumber} {gatePassNumber ? `(GP: ${gatePassNumber})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Carrier Vehicle / Driver:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {carrierVehicleNo} {driverName ? `• ${driverName}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Storekeeper / QC Officer:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {receivedByOfficer} • {qcInspector}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">QC Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {qcStatus}
                  </span>
                </div>
              </div>

              {/* Product Lines Preview */}
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                  Products to be Received ({formItems.length} items):
                </span>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5">Batch / Serial</th>
                        <th className="p-2.5 text-right">Inward Qty</th>
                        <th className="p-2.5 text-right">Unit Cost</th>
                        <th className="p-2.5 text-right">Total (BDT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {formItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200">
                            {item.productName}
                            <span className="block text-[10px] text-slate-400 font-mono">{item.sku}</span>
                          </td>
                          <td className="p-2.5 text-[11px] text-slate-600 dark:text-slate-400">
                            {item.batchNumber || 'N/A'}
                          </td>
                          <td className="p-2.5 text-right font-bold text-blue-600 dark:text-blue-400">
                            {item.receivedQty} units
                          </td>
                          <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                            BDT {item.unitCostBDT.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-800 dark:text-slate-200">
                            BDT {item.totalCostBDT.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCidReceiveConfirmModal(false)}
                disabled={isPostingCidStock}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
              >
                Cancel & Review Form
              </button>
              <button
                type="button"
                onClick={handleConfirmCIDReceipt}
                disabled={isPostingCidStock}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isPostingCidStock ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Posting to Inventory...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Yes, Confirm & Post Stock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINTABLE MRR VOUCHER (MATERIAL RECEIVE REPORT)                   */}
      {/* ========================================================================= */}
      {selectedReceiptForVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Actions Header */}
            <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Material Receiving Report (MRR) Voucher Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print MRR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptForVoucher(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Voucher Content */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 print:p-0">
              {/* Company Banner */}
              <div className="border-b-2 border-blue-600 pb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-lg font-black tracking-tight text-blue-600 dark:text-blue-400">
                    ENSEC LITHIUM BATTERIES BANGLADESH
                  </h1>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Central Inventory Depot (CID) • Logistics & Supply Chain Division
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Plot 14/B, Tejgaon Industrial Area, Dhaka-1208 • Phone: +880 2-9887766
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-black text-xs uppercase tracking-wider block font-mono">
                    MRR VOUCHER
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono mt-1 block">
                    {selectedReceiptForVoucher.mrrNumber}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Date: {selectedReceiptForVoucher.receiptDate}
                  </span>
                </div>
              </div>

              {/* Inward Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Source Plant</span>
                  <span className="font-bold">{selectedReceiptForVoucher.sourceType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Receiving Store</span>
                  <span className="font-bold">{selectedReceiptForVoucher.warehouseName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Factory Challan</span>
                  <span className="font-bold font-mono">{selectedReceiptForVoucher.challanNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Gate Pass</span>
                  <span className="font-bold font-mono">{selectedReceiptForVoucher.gatePassNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Carrier Vehicle</span>
                  <span className="font-bold font-mono">{selectedReceiptForVoucher.carrierVehicleNo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Driver Name</span>
                  <span className="font-bold">{selectedReceiptForVoucher.driverName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">QC Clearance</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedReceiptForVoucher.qcStatus}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">QC Inspector</span>
                  <span className="font-bold">{selectedReceiptForVoucher.qcInspector}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Product Name & SKU</th>
                      <th className="p-3 font-mono">Batch No</th>
                      <th className="p-3 font-mono">Serial Range</th>
                      <th className="p-3 text-right">Received Qty</th>
                      <th className="p-3 text-right">Unit Cost</th>
                      <th className="p-3 text-right">Subtotal BDT</th>
                      <th className="p-3">CID Rack</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {selectedReceiptForVoucher.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3 font-semibold">
                          <span>{item.productName}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{item.sku}</span>
                        </td>
                        <td className="p-3 font-mono">{item.batchNumber}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">{item.serialRange || 'N/A'}</td>
                        <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">
                          {item.receivedQty}
                        </td>
                        <td className="p-3 text-right font-mono">BDT {item.unitCostBDT.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold font-mono">BDT {item.totalCostBDT.toLocaleString()}</td>
                        <td className="p-3 text-slate-500">{item.rackLocation}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-bold border-t border-slate-200 dark:border-slate-700">
                    <tr>
                      <td colSpan={4} className="p-3 text-right uppercase text-slate-600 dark:text-slate-400">
                        Total Physical Inward:
                      </td>
                      <td className="p-3 text-right text-blue-600 font-black text-sm">
                        {selectedReceiptForVoucher.totalQuantity} units
                      </td>
                      <td className="p-3 text-right uppercase text-slate-600 dark:text-slate-400">
                        Total Valuation:
                      </td>
                      <td className="p-3 text-right text-emerald-600 font-black text-sm font-mono">
                        BDT {selectedReceiptForVoucher.totalValueBDT.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Remarks */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                  General Receiving Notes:
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  {selectedReceiptForVoucher.generalRemarks || 'Physical finished battery count matches packing challan.'}
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-bold block">{selectedReceiptForVoucher.receivedBy}</span>
                  <span className="text-[10px] text-slate-400">CID Warehouse Storekeeper</span>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-bold block">{selectedReceiptForVoucher.qcInspector}</span>
                  <span className="text-[10px] text-slate-400">QC Inspection Lead</span>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-bold block">Authorized Signatory</span>
                  <span className="text-[10px] text-slate-400">Head of Supply Chain</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
