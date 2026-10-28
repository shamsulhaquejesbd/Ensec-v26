import React, { useState } from 'react';
import {
  Cpu,
  PlusCircle,
  Layers,
  Wrench,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  Building,
  ArrowRight,
  ShieldAlert,
  Truck,
  FileText,
  Printer,
  Eye,
  Check,
} from 'lucide-react';
import { DeliveryOrderModal } from '../sales/DeliveryOrderModal.tsx';
import { ChallanModal } from '../sales/ChallanModal.tsx';
import { SalesOrder } from '../../types/erp.ts';
import { useERP } from '../../context/ERPContext.tsx';
import { Product, ProductionOrder, BOMItem } from '../../types/erp.ts';

export const ManufacturingModule: React.FC = () => {
  const {
    products,
    productionOrders,
    rawMaterials,
    createProductionOrder,
    completeProductionOrder,
    updateProductBOM,
    salesOrders,
    dispatchAndInvoiceSalesOrder,
    updateSalesOrder,
  } = useERP();

  const [selectedDOForFactory, setSelectedDOForFactory] = useState<SalesOrder | null>(null);
  const [selectedChallanForFactory, setSelectedChallanForFactory] = useState<SalesOrder | null>(null);
  const [orderToDispatchConfirm, setOrderToDispatchConfirm] = useState<SalesOrder | null>(null);

  const [activeTab, setActiveTab] = useState<'orders' | 'bom' | 'delivery-orders'>('orders');
  const approvedDOOrders = (salesOrders || []).filter(
    (so) => so.status === 'Approved' || so.status === 'Dispatched' || so.status === 'Dispatched & Invoiced' || so.status === 'Invoiced'
  );
  const [showNewBatchModal, setShowNewBatchModal] = useState(false);
  const [editingBOMProduct, setEditingBOMProduct] = useState<Product | null>(null);

  // New Production Order State
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [plannedQty, setPlannedQty] = useState(50);
  const [optimumLaborCostBDT, setOptimumLaborCostBDT] = useState(150000);
  const [factoryOverheadBDT, setFactoryOverheadBDT] = useState(90000);
  const [wastagePercent, setWastagePercent] = useState(0.5);
  const [scrapKg, setScrapKg] = useState(8.5);
  const [technicianInCharge, setTechnicianInCharge] = useState('Mustafizur Rahman (Optimum Plant Head)');
  const [batchNotes, setBatchNotes] = useState('Standard QA impedance check and cell matching active.');

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Raw material cost estimate based on BOM * plannedQty
  const rawMaterialCostBDT = selectedProduct
    ? selectedProduct.bom.reduce((sum, item) => sum + item.requiredQty * item.unitCostBDT, 0) * plannedQty
    : 0;

  const conversionCostBDT = Number(optimumLaborCostBDT) + Number(factoryOverheadBDT);
  const totalProductionCostBDT = rawMaterialCostBDT + conversionCostBDT;
  const costPerUnitBDT = Math.round(totalProductionCostBDT / (plannedQty || 1));

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    createProductionOrder({
      date: new Date().toISOString().substring(0, 10),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      model: selectedProduct.model,
      plannedQty: Number(plannedQty),
      manufacturingDate: new Date().toISOString().substring(0, 10),
      status: 'In Production',
      rawMaterialCostBDT,
      optimumLaborCostBDT: Number(optimumLaborCostBDT),
      factoryOverheadBDT: Number(factoryOverheadBDT),
      conversionCostBDT,
      totalProductionCostBDT,
      costPerUnitBDT,
      wastagePercent: Number(wastagePercent),
      scrapKg: Number(scrapKg),
      technicianInCharge,
      notes: batchNotes,
    });

    setShowNewBatchModal(false);
  };

  // BOM Editing State
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);

  const startEditBOM = (prod: Product) => {
    setEditingBOMProduct(prod);
    setBomItems([...prod.bom]);
  };

  const handleUpdateBOMItemQty = (materialId: string, newQty: number) => {
    setBomItems((prev) =>
      prev.map((item) => (item.materialId === materialId ? { ...item, requiredQty: newQty } : item))
    );
  };

  const handleSaveBOM = () => {
    if (!editingBOMProduct) return;
    updateProductBOM(editingBOMProduct.id, bomItems);
    setEditingBOMProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Kushtia Manufacturing & Assembly Plant
            </h1>
            
          </div>
          
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'orders'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Production Orders & Batches
            </button>
            <button
              onClick={() => setActiveTab('delivery-orders')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'delivery-orders'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Factory Delivery Orders (D.O.) ({approvedDOOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('bom')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'bom'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Configurable BOM Master
            </button>
          </div>

          <button
            onClick={() => setShowNewBatchModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Launch Batch</span>
          </button>
        </div>
      </div>

      {activeTab === 'delivery-orders' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-black text-base text-slate-900 dark:text-white">
                  Factory Delivery Orders (D.O.) &amp; Challan Handover Queue
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Authorized Delivery Orders (D.O.) and official Challan copies for factory production release, battery serial number stamping, and transport dispatch.
                </p>
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Approved D.O. &amp; Challans: <span className="text-emerald-600 font-bold text-sm">{approvedDOOrders.length}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Factory Delivery Orders (D.O.) &amp; Transport Challans
              </h3>
              <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Both D.O. &amp; Challan Copies Available
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Challan &amp; D/O No.</th>
                    <th className="p-3.5">Buyer / Customer Details</th>
                    <th className="p-3.5">Ordered Battery Models</th>
                    <th className="p-3.5 text-center">Total Qty</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Factory Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {approvedDOOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400">
                        <Truck className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                        <p className="font-semibold text-sm">No approved Delivery Orders in queue.</p>
                        <p className="text-xs mt-1 text-slate-400">
                          When Accounts approves a sales order, the auto-generated Challan will appear here for factory dispatch.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    approvedDOOrders.map((so) => {
                      const suffix = (so.orderNumber || so.id).replace(/\D/g, "").slice(-2).padStart(2, "0") || "88";
                      const doNum = so.doNumber || `012/2026-${suffix}`;
                      const challanNum = so.challanNumber || `BD-ES-2026-12-${suffix}`;
                      const totalUnits = (so.items || []).reduce((sum, item) => sum + item.quantity, 0);
                      const isDispatched = so.status === 'Dispatched' || so.status === 'Dispatched & Invoiced' || so.status === 'Invoiced' || so.status === 'Delivered';

                      return (
                        <tr key={so.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[13px]">
                                {challanNum}
                              </span>
                              <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-1.5 py-0.2 rounded">
                                Challan
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              D/O: {doNum} • PO Ref: {so.orderNumber}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {so.customerName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {so.channel || "Direct Customer"}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="space-y-1 max-w-sm">
                              {so.items.map((it, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-2 text-[11px] bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {it.productName}
                                  </span>
                                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                    {String(it.quantity).padStart(2, "0")} Pcs
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="p-3.5 text-center font-mono font-black text-slate-900 dark:text-white text-xs">
                            {String(totalUnits).padStart(2, "0")} PCS
                          </td>

                          <td className="p-3.5 text-center">
                            {isDispatched ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                Dispatched from Plant
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Approved &amp; Verified
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* OFFICIAL FACTORY DELIVERY ORDER (D.O.) COPY */}
                              <button
                                type="button"
                                onClick={() => setSelectedDOForFactory(so)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs cursor-pointer border border-emerald-300 dark:border-emerald-800 transition-all shadow-xs"
                                title="View official Factory Delivery Order (D.O.) copy for production release authorization"
                              >
                                <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>D.O.</span>
                              </button>

                              {/* AUTO-GENERATED FACTORY CHALLAN */}
                              <button
                                type="button"
                                onClick={() => setSelectedChallanForFactory(so)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold text-xs cursor-pointer border border-blue-200 dark:border-blue-800 transition-all shadow-xs"
                                title="View auto-generated factory Challan (Matches uploaded sample format)"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Challan</span>
                              </button>

                              {/* Factory Dispatch & Invoice */}
                              {!isDispatched && (
                                <button
                                  type="button"
                                  onClick={() => setOrderToDispatchConfirm(so)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
                                  title="Dispatch order from factory & generate invoice"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Dispatch &amp; Invoice</span>
                                </button>
                              )}
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
      ) : activeTab === 'orders' ? (
        <div className="space-y-6">
          {/* Plant KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 uppercase">Active Kushtia Batches</div>
              <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-1">
                {productionOrders.filter((p) => p.status === 'In Production').length} Active
              </div>
              
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 uppercase">Completed Lithium Batteries</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {productionOrders.reduce((sum, p) => sum + p.completedQty, 0)} Units
              </div>
              
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 uppercase">Total Optimum Conversion Fees</div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1 font-mono">
                ৳ {productionOrders.reduce((sum, p) => sum + p.conversionCostBDT, 0).toLocaleString()}
              </div>
             
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 uppercase">Average Scrap / Wastage</div>
              <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">
                0.58%
              </div>
              
            </div>
          </div>

          {/* Batches Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                  Factory Production Orders & Batches
                </h2>
                
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Order & Batch No</th>
                    <th className="p-3">Product Model</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Raw Material Cost</th>
                    <th className="p-3">Optimum Conversion</th>
                    <th className="p-3">Unit Cost BDT</th>
                    <th className="p-3">Wastage / Scrap</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {productionOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{order.orderNumber}</div>
                        <div className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                          Batch: {order.batchNumber}
                        </div>
                        <div className="text-[10px] text-slate-400">{order.date}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{order.productName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Model: {order.model}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {order.completedQty} / {order.plannedQty} Units
                        </div>
                        <div className="text-[10px] text-slate-400">In Kushtia Plant</div>
                      </td>
                      <td className="p-3 font-mono">৳ {order.rawMaterialCostBDT.toLocaleString()}</td>
                      <td className="p-3 font-mono text-purple-600 dark:text-purple-400">
                        ৳ {order.conversionCostBDT.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        ৳ {order.costPerUnitBDT.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="text-slate-700 dark:text-slate-300">{order.wastagePercent}% waste</div>
                        <div className="text-[10px] text-slate-400">{order.scrapKg} kg scrap</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.status === 'Completed' || order.status === 'Transferred'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {order.status === 'In Production' && (
                          <button
                            onClick={() => completeProductionOrder(order.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] transition-colors shadow-xs"
                            title="Complete assembly: Deducts raw materials, adds finished batteries to Kushtia warehouse, updates Optimum conversion ledger"
                          >
                            Mark Completed
                          </button>
                        )}
                        {(order.status === 'Completed' || order.status === 'Transferred') && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Finished & Inspected</span>
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
      ) : (
        /* Configurable Bill of Materials (BOM) View */
        <div className="space-y-4">
          

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{prod.name}</h3>
                    <div className="text-xs text-slate-500">
                      Model: {prod.model} • {prod.voltageV}V {prod.capacityAh}Ah ({prod.batteryType})
                    </div>
                  </div>
                  <button
                    onClick={() => startEditBOM(prod)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400"
                  >
                    Configure BOM
                  </button>
                </div>

                {/* BOM Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800 text-left">
                      <tr>
                        <th className="py-2">Component / Material</th>
                        <th className="py-2">Required Qty</th>
                        <th className="py-2 text-right">Unit Landed</th>
                        <th className="py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {prod.bom.map((bItem, idx) => (
                        <tr key={idx} className="py-1.5">
                          <td className="py-1.5 text-slate-800 dark:text-slate-200">{bItem.materialName}</td>
                          <td className="py-1.5 font-bold font-mono">
                            {bItem.requiredQty} {bItem.unit}
                          </td>
                          <td className="py-1.5 font-mono text-right text-slate-500">
                            ৳ {bItem.unitCostBDT.toLocaleString()}
                          </td>
                          <td className="py-1.5 font-mono text-right font-bold text-slate-900 dark:text-white">
                            ৳ {(bItem.requiredQty * bItem.unitCostBDT).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 dark:border-slate-700 font-bold">
                        <td colSpan={3} className="py-2 text-slate-600 dark:text-slate-300">
                          Total Raw Material BOM Cost / Unit:
                        </td>
                        <td className="py-2 text-right font-mono text-blue-600 dark:text-blue-400">
                          ৳{' '}
                          {prod.bom
                            .reduce((sum, item) => sum + item.requiredQty * item.unitCostBDT, 0)
                            .toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Launch New Production Batch */}
      {showNewBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Schedule Factory Assembly Batch
                </h3>
              </div>
              <button
                onClick={() => setShowNewBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Battery Model
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Planned Assembly Units
                    </label>
                    <input
                      type="number"
                      value={plannedQty}
                      onChange={(e) => setPlannedQty(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Optimum Assembly Labor Fee (BDT)
                    </label>
                    <input
                      type="number"
                      value={optimumLaborCostBDT}
                      onChange={(e) => setOptimumLaborCostBDT(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Kushtia Plant Overhead (BDT)
                    </label>
                    <input
                      type="number"
                      value={factoryOverheadBDT}
                      onChange={(e) => setFactoryOverheadBDT(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Expected Scrap / Wastage (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={wastagePercent}
                      onChange={(e) => setWastagePercent(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Quality Inspection & Batch Notes
                  </label>
                  <textarea
                    rows={2}
                    value={batchNotes}
                    onChange={(e) => setBatchNotes(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Cost Calculation Summary */}
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Raw Material Consumption Cost:</span>
                  <b>৳ {rawMaterialCostBDT.toLocaleString()}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Optimum Conversion & Overhead Fee:</span>
                  <b className="text-purple-600 dark:text-purple-400">৳ {conversionCostBDT.toLocaleString()}</b>
                </div>
                <div className="flex justify-between pt-1 border-t border-purple-200 dark:border-purple-700 text-sm">
                  <span className="font-bold">Total Batch Production Cost:</span>
                  <span className="font-black text-purple-700 dark:text-purple-300">
                    ৳ {totalProductionCostBDT.toLocaleString()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1">
                  Cost per finished battery: ৳ {costPerUnitBDT.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewBatchModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs"
                >
                  Confirm & Schedule Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit BOM */}
      {editingBOMProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Edit BOM: {editingBOMProduct.name}
              </h3>
              <button
                onClick={() => setEditingBOMProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {bomItems.map((item) => (
                <div
                  key={item.materialId}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{item.materialName}</div>
                    <div className="text-[10px] text-slate-500">Unit Cost: ৳ {item.unitCostBDT.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={item.requiredQty}
                      onChange={(e) => handleUpdateBOMItemQty(item.materialId, Number(e.target.value))}
                      className="w-20 p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setEditingBOMProduct(null)}
                className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBOM}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
              >
                Save BOM Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedChallanForFactory && (
        <ChallanModal
          order={selectedChallanForFactory}
          onClose={() => setSelectedChallanForFactory(null)}
          onUpdateOrder={updateSalesOrder}
          onSwitchToDO={() => {
            const ord = selectedChallanForFactory;
            setSelectedChallanForFactory(null);
            setSelectedDOForFactory(ord);
          }}
          onDispatchAndInvoice={(orderId) => {
            dispatchAndInvoiceSalesOrder(orderId);
            setSelectedChallanForFactory(null);
          }}
        />
      )}

      {selectedDOForFactory && (
        <DeliveryOrderModal
          order={selectedDOForFactory}
          onClose={() => setSelectedDOForFactory(null)}
          onUpdateOrder={updateSalesOrder}
          onSwitchToChallan={() => {
            const ord = selectedDOForFactory;
            setSelectedDOForFactory(null);
            setSelectedChallanForFactory(ord);
          }}
        />
      )}

      {/* CONFIRMATION MODAL: FACTORY DISPATCH & INVOICE */}
      {orderToDispatchConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-800 dark:text-slate-100 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Factory Dispatch &amp; Invoice
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to dispatch this order from the factory and post the commercial invoice?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 space-y-2 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Number:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{orderToDispatchConfirm.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Buyer:</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">{orderToDispatchConfirm.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Units:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(orderToDispatchConfirm.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0)} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Net Invoice Amount:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  BDT {orderToDispatchConfirm.netAmountBDT?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Factory Challan:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                  {orderToDispatchConfirm.challanNumber || 'Auto Pre-Generated'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                Confirming will deduct finished battery units from factory warehouse stock, issue the commercial invoice, and move the status to "Dispatched & Invoiced".
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDispatchConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = orderToDispatchConfirm;
                  setOrderToDispatchConfirm(null);
                  dispatchAndInvoiceSalesOrder(target.id);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white cursor-pointer shadow-sm transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Yes, Dispatch &amp; Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
