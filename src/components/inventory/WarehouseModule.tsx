import React, { useState } from 'react';
import {
  Warehouse as WarehouseIcon,
  Truck,
  ArrowRightLeft,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  History,
  Package,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { StockTransfer } from '../../types/erp.ts';

export const WarehouseModule: React.FC = () => {
  const {
    warehouses,
    stockTransfers,
    stockLedger,
    products,
    createStockTransfer,
    approveStockTransfer,
    receiveStockTransfer,
    adjustStock,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'hubs' | 'transfers' | 'ledger'>('hubs');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // Transfer Form State
  const [fromWhId, setFromWhId] = useState(warehouses[0]?.id || '');
  const [toWhId, setToWhId] = useState(warehouses[1]?.id || '');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [transferQty, setTransferQty] = useState(25);
  const [driverName, setDriverName] = useState('Abul Kalam');
  const [truckNumber, setTruckNumber] = useState('Dhaka Metro TA-14-8891');

  // Adjust Form State
  const [adjustWhId, setAdjustWhId] = useState(warehouses[0]?.id || '');
  const [adjustProdId, setAdjustProdId] = useState(products[0]?.id || '');
  const [adjustDelta, setAdjustDelta] = useState(-1);
  const [adjustReason, setAdjustReason] = useState('Transit physical damage during heavy rain inspection');

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const fromWh = warehouses.find((w) => w.id === fromWhId);
    const toWh = warehouses.find((w) => w.id === toWhId);
    const prod = products.find((p) => p.id === productId);
    if (!fromWh || !toWh || !prod || fromWhId === toWhId) return;

    createStockTransfer({
      date: new Date().toISOString().substring(0, 10),
      fromWarehouseId: fromWh.id,
      fromWarehouseName: fromWh.name,
      toWarehouseId: toWh.id,
      toWarehouseName: toWh.name,
      productId: prod.id,
      productName: prod.name,
      batchNumber: 'KUS-B2609-001',
      quantity: Number(transferQty),
      driverName,
      truckNumber,
      requestedBy: 'Rafiqul Alam (Supply Chain)',
    });

    setShowTransferModal(false);
  };

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    adjustStock(adjustWhId, adjustProdId, Number(adjustDelta), adjustReason);
    setShowAdjustModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Multi-Warehouse Hubs & Stock Transfers
            </h1>
            
          </div>
          
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
            <button
              onClick={() => setActiveTab('hubs')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'hubs'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Warehouses
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'transfers'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Stock Transfers ({stockTransfers.filter((t) => t.status === 'In Transit' || t.status === 'Requested').length})
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'ledger'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Stock Ledger
            </button>
          </div>

          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
          >
            <Truck className="w-4 h-4" />
            <span>Issue Transfer</span>
          </button>
        </div>
      </div>

      {activeTab === 'hubs' && (
        <div className="space-y-6">
          {/* Warehouse Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {warehouses.map((wh) => (
              <div
                key={wh.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">{wh.code}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {wh.type}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{wh.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{wh.location}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Current Battery Units:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-base">
                      {wh.currentStockUnits}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, (wh.currentStockUnits / wh.capacityUnits) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Capacity: {wh.capacityUnits} Units</span>
                    <span>Manager: {wh.managerName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Adjustment Action */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-slate-700 dark:text-slate-300">
                Need to record warehouse damaged batteries or physical stock audit reconciliation?
              </span>
            </div>
            <button
              onClick={() => setShowAdjustModal(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold self-start sm:self-auto"
            >
              Record Damage / Adjustment
            </button>
          </div>
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Inter-Warehouse Stock Transfer Logs
              </h2>
              <p className="text-xs text-slate-500">
                Kushtia Factory ➔ Dhaka Hub 1 (Tejgaon), Dhaka Hub 2 (Uttara), Chittagong Hub
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Transfer No & Date</th>
                  <th className="p-3">Origin Warehouse</th>
                  <th className="p-3">Destination Warehouse</th>
                  <th className="p-3">Battery Model & Batch</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Carrier / Truck</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {stockTransfers.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{tr.transferNumber}</div>
                      <div className="text-[10px] text-slate-400">{tr.date}</div>
                    </td>
                    <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">{tr.fromWarehouseName}</td>
                    <td className="p-3 text-slate-800 dark:text-slate-200 font-bold">{tr.toWarehouseName}</td>
                    <td className="p-3">
                      <div>{tr.productName}</div>
                      <div className="font-mono text-[10px] text-purple-600 dark:text-purple-400">
                        {tr.batchNumber}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {tr.quantity} Units
                    </td>
                    <td className="p-3 font-mono">
                      <div>{tr.truckNumber || 'Private Freight'}</div>
                      <div className="text-[10px] text-slate-400">Driver: {tr.driverName}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
                    <td className="p-3 text-right">
                      {tr.status === 'Requested' && (
                        <button
                          onClick={() => approveStockTransfer(tr.id)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10px] transition-colors"
                          title="Approve & dispatch in-transit from origin warehouse"
                        >
                          Approve Dispatch
                        </button>
                      )}
                      {tr.status === 'In Transit' && (
                        <button
                          onClick={() => receiveStockTransfer(tr.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] transition-colors"
                          title="Receive truck at destination warehouse and increment stock"
                        >
                          Receive In Hub
                        </button>
                      )}
                      {tr.status === 'Received' && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Received ({tr.receivedDate})</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Official Inventory Stock Ledger (Audited)
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Closing Stock = Opening Stock + Receive + Transfer In - Sales - Transfer Out + Return - Damage ± Adjustment
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Warehouse Hub</th>
                  <th className="p-3">Product Model</th>
                  <th className="p-3">Transaction Type</th>
                  <th className="p-3">Reference No</th>
                  <th className="p-3 text-right">Qty In</th>
                  <th className="p-3 text-right">Qty Out</th>
                  <th className="p-3 text-right">Unit Cost (BDT)</th>
                  <th className="p-3 text-right">Total Cost (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {stockLedger.map((sl) => (
                  <tr key={sl.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-slate-500">{sl.date}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{sl.warehouseName}</td>
                    <td className="p-3 text-slate-900 dark:text-white">{sl.productName}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sl.transactionType === 'Production Receive' || sl.transactionType === 'Transfer In'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : sl.transactionType === 'Sales Invoice' || sl.transactionType === 'Transfer Out'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {sl.transactionType}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-blue-600 dark:text-blue-400">{sl.referenceNo}</td>
                    <td className="p-3 font-mono text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {sl.qtyIn > 0 ? `+${sl.qtyIn}` : '-'}
                    </td>
                    <td className="p-3 font-mono text-right font-bold text-amber-600 dark:text-amber-400">
                      {sl.qtyOut > 0 ? `-${sl.qtyOut}` : '-'}
                    </td>
                    <td className="p-3 font-mono text-right text-slate-600 dark:text-slate-400">
                      ৳ {sl.unitCostBDT.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-right font-bold text-slate-900 dark:text-white">
                      ৳ {sl.totalCostBDT.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Stock Transfer */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Issue Inter-Warehouse Stock Transfer
                </h3>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Origin Warehouse (From)
                  </label>
                  <select
                    value={fromWhId}
                    onChange={(e) => setFromWhId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Destination Warehouse (To)
                  </label>
                  <select
                    value={toWhId}
                    onChange={(e) => setToWhId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} disabled={w.id === fromWhId}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Product / Battery Model
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Transfer Qty
                  </label>
                  <input
                    type="number"
                    value={transferQty}
                    onChange={(e) => setTransferQty(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Truck Reg Number
                  </label>
                  <input
                    type="text"
                    value={truckNumber}
                    onChange={(e) => setTruckNumber(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-900 dark:text-indigo-200">
                Transfers move through <b>Requested ➔ Approved ➔ In Transit ➔ Received</b> stages to maintain audit integrity and avoid duplicate inventory counting during Kushtia–Dhaka transport.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  Submit Transfer Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Damage / Adjustment */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Record Damage / Physical Adjustment
                </h3>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Warehouse Hub
                </label>
                <select
                  value={adjustWhId}
                  onChange={(e) => setAdjustWhId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Product / Battery Model
                </label>
                <select
                  value={adjustProdId}
                  onChange={(e) => setAdjustProdId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Quantity Delta (Negative for Damage/Loss, Positive for Excess)
                </label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason / Technical Audit Finding
                </label>
                <textarea
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
                >
                  Post Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
