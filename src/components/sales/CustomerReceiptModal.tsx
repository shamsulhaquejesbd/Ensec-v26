import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  PackageCheck,
  UserCheck,
  Calendar,
  Phone,
  FileText,
  MapPin,
  ShieldCheck,
  PenTool,
  AlertCircle,
  Truck,
  Hash,
} from 'lucide-react';
import { SalesOrder } from '../../types/erp.ts';

interface CustomerReceiptModalProps {
  order: SalesOrder;
  onClose: () => void;
  onConfirmReceipt: (
    orderId: string,
    details: {
      receiverName: string;
      receiverPhone: string;
      receivedDate: string;
      receiverDesignation?: string;
      handoverNotes: string;
      deliveryStatus: 'Full' | 'Partial';
      signatureConfirmed: boolean;
      salespersonName: string;
    }
  ) => void;
}

export const CustomerReceiptModal: React.FC<CustomerReceiptModalProps> = ({
  order,
  onClose,
  onConfirmReceipt,
}) => {
  const [receiverName, setReceiverName] = useState(
    order.deliveryAddressName || order.contactPerson || 'Uzzal Hossain'
  );
  const [receiverPhone, setReceiverPhone] = useState(
    order.deliveryMobile || '+8801327-113571'
  );
  const [receiverDesignation, setReceiverDesignation] = useState('Store In-Charge / Site Supervisor');
  const [receivedDate, setReceivedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  });
  const [deliveryStatus, setDeliveryStatus] = useState<'Full' | 'Partial'>('Full');
  const [handoverNotes, setHandoverNotes] = useState(
    'All batteries inspected in good condition. Serial numbers verified with physical Challan copy. Handed over successfully.'
  );
  const [checkedSerials, setCheckedSerials] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    (order.items || []).forEach((item, itIdx) => {
      const serials = item.serialNumbers || [];
      serials.forEach((s) => {
        map[`${itIdx}-${s}`] = true;
      });
    });
    return map;
  });
  const [signatureConfirmed, setSignatureConfirmed] = useState(true);
  const [signatureType, setSignatureType] = useState<'Seal & Signature' | 'Digital Signature' | 'OTP / SMS Acknowledgement'>('Seal & Signature');

  const challanNo = order.challanNumber || `BD-ES-2026-12-${(order.orderNumber || '88').replace(/\D/g, '').slice(-2) || '88'}`;
  const totalUnits = (order.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName.trim()) {
      alert('Please provide the Customer Receiver Name.');
      return;
    }

    onConfirmReceipt(order.id, {
      receiverName,
      receiverPhone,
      receivedDate,
      receiverDesignation,
      handoverNotes,
      deliveryStatus,
      signatureConfirmed,
      salespersonName: order.salespersonName || 'Abu Jubair Khan',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-emerald-600 to-teal-700 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xs">
              <PackageCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Sales Force Handover Assurance
              </span>
              <h2 className="text-lg font-black text-white mt-0.5">
                Ensure Customer Receipt of Sales Order
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Confirm that goods and physical Challan copy were delivered and verified with customer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order & Challan Meta Card */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Order &amp; Factory Challan No.
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                    {order.orderNumber}
                  </span>
                  <span className="text-xs font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    {challanNo}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Order Units
                </span>
                <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {totalUnits} PCS
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Customer / Buyer:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {order.customerName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Delivery Destination:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {order.deliveryAddress || 'Tongi, Gazipur'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Assigned Salesman / Engineer:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {order.salespersonName || 'Abu Jubair Khan'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Factory Dispatch Status:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  Dispatched &amp; Invoiced from Factory
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Battery Serials Inspection Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Physical Battery Serials Verification against Challan</span>
                </label>
                <span className="text-[10px] text-slate-400">Verify battery units with buyer</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                {(order.items || []).map((item, itIdx) => {
                  const serials = item.serialNumbers && item.serialNumbers.length > 0
                    ? item.serialNumbers
                    : [itIdx === 0 ? '17158202615' : '171772026316'];

                  return (
                    <div key={itIdx} className="text-xs border-b border-slate-200/60 dark:border-slate-700/60 pb-2 last:border-0 last:pb-0">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{item.productName}</span>
                        <span className="font-mono text-slate-500">{item.quantity} Pcs</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5 pl-2">
                        {serials.map((s, sIdx) => {
                          const key = `${itIdx}-${s}`;
                          const isChecked = !!checkedSerials[key];
                          return (
                            <label
                              key={sIdx}
                              className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                                isChecked
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                                  : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  setCheckedSerials((prev) => ({ ...prev, [key]: e.target.checked }))
                                }
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="font-mono text-[11px] font-bold">SL: {s}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Handover Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Receiver Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="e.g. Uzzal Hossain"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Receiver Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    placeholder="e.g. +8801327-113571"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Receiver Designation / Role
                </label>
                <input
                  type="text"
                  value={receiverDesignation}
                  onChange={(e) => setReceiverDesignation(e.target.value)}
                  placeholder="e.g. Site Supervisor / Store Incharge"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Received Date &amp; Time
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Handover Status & Signature */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Condition
                </label>
                <select
                  value={deliveryStatus}
                  onChange={(e: any) => setDeliveryStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="Full">Full Order Received (100% Units Delivered)</option>
                  <option value="Partial">Partial Order Received (Pending Remaining)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Receipt Acknowledgement
                </label>
                <select
                  value={signatureType}
                  onChange={(e: any) => setSignatureType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="Seal & Signature">Physical Seal &amp; Signature on Challan</option>
                  <option value="Digital Signature">Digital On-Screen Handover Signature</option>
                  <option value="OTP / SMS Acknowledgement">Verbal Confirmation with Buyer PIN</option>
                </select>
              </div>
            </div>

            {/* Signature Acknowledgment Box */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sig-confirm"
                  checked={signatureConfirmed}
                  onChange={(e) => setSignatureConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="sig-confirm" className="text-xs text-emerald-950 dark:text-emerald-200 font-semibold cursor-pointer">
                  Customer has signed and verified the printed Challan copy ({challanNo})
                </label>
              </div>
              <div className="text-[11px] font-mono text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                Seal &amp; Signed
              </div>
            </div>

            {/* Handover Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Salesman Handover &amp; Customer Verification Remarks
              </label>
              <textarea
                rows={2}
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="Enter remarks, battery serial verification details, site location notes..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-950/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Confirm Customer Received</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
