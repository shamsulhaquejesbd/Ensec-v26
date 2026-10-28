import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  Shield,
  CheckCircle,
  Package,
  Receipt,
  AlertCircle,
  Calendar,
  User,
  FileText,
  DollarSign,
  Layers,
  Clock,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { WarrantyTicket, ServiceJobCard } from '../../types/warranty.ts';

// ==========================================
// 1. JOB CARD MODAL
// ==========================================
interface JobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: WarrantyTicket | null;
}

export const JobCardModal: React.FC<JobCardModalProps> = ({
  isOpen,
  onClose,
  ticket,
}) => {
  const {
    warrantyTickets,
    addServiceJobCard,
    updateWarrantyTicket,
    serviceSettings,
  } = useERP();

  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [jobCardNumber, setJobCardNumber] = useState<string>('');
  const [assignedTechnician, setAssignedTechnician] = useState<string>('Engr. Tanvir Ahmed');
  const [repairPriority, setRepairPriority] = useState<string>('High');
  const [warrantyDecision, setWarrantyDecision] = useState<string>('Full Warranty Repair');
  const [status, setStatus] = useState<string>('In Repair');
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState<string>('');
  const [workDetails, setWorkDetails] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const activeTicket = ticket || warrantyTickets[0];
      const targetId = activeTicket ? activeTicket.id : '';
      setSelectedTicketId(targetId);

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setJobCardNumber(`JC-2026-${randomSuffix}`);

      const defaultTech = serviceSettings?.defaultTechnicians?.[0] || 'Engr. Tanvir Ahmed';
      setAssignedTechnician(defaultTech);
      setRepairPriority('High');
      setWarrantyDecision(activeTicket?.warrantyDecision || 'Full Warranty Repair');
      setStatus('In Repair');

      // Default estimated completion = 5 days from today
      const d = new Date();
      d.setDate(d.getDate() + 5);
      setEstimatedCompletionDate(d.toISOString().slice(0, 10));

      setWorkDetails(
        activeTicket
          ? `Disassemble casing and conduct cell module IR check for ${activeTicket.ticketNumber}. Diagnose reported fault: ${activeTicket.issueDescription || 'Power output drop'}`
          : 'Perform diagnostic check, replace faulty modules, and run full cycle capacity calibration.'
      );
      setError('');
    }
  }, [isOpen, ticket, warrantyTickets, serviceSettings]);

  if (!isOpen) return null;

  const currentTicket =
    warrantyTickets.find((t) => t.id === selectedTicketId) || ticket;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobCardNumber.trim()) {
      setError('Please provide a valid Job Card Number.');
      return;
    }
    if (!assignedTechnician.trim()) {
      setError('Please assign a technician to this Job Card.');
      return;
    }

    try {
      addServiceJobCard({
        ticketId: currentTicket?.id || undefined,
        ticketNumber: currentTicket?.ticketNumber,
        customerName: currentTicket?.customerName,
        jobCardNumber: jobCardNumber.trim(),
        assignedTechnician: assignedTechnician.trim(),
        repairPriority,
        warrantyDecision,
        status,
        estimatedCompletionDate,
        expectedCompletionDate: estimatedCompletionDate,
        workDetails: workDetails.trim(),
      });

      if (currentTicket?.id) {
        updateWarrantyTicket(currentTicket.id, {
          jobCardNumber: jobCardNumber.trim(),
          status: 'In Repair',
          warrantyDecision,
        });
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create job card.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Issue Service Job Card
              </h3>
              <p className="text-xs text-slate-500">
                Authorize factory technician to inspect, replace parts, and calibrate battery
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Ticket Selector / Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Linked Warranty Ticket
              </span>
              {currentTicket && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {currentTicket.warrantyStatus || 'Valid Warranty'}
                </span>
              )}
            </div>

            {ticket ? (
              <div className="text-xs space-y-1">
                <p className="font-mono font-bold text-blue-600">{ticket.ticketNumber}</p>
                <p className="text-slate-700 dark:text-slate-300">
                  Customer: <span className="font-semibold">{ticket.customerName}</span> ({ticket.customerPhone})
                </p>
                <p className="text-slate-500 text-[11px]">
                  Battery: {ticket.batteryBrand} • S/N: {ticket.serialNumber} • Model: {ticket.modelName}
                </p>
              </div>
            ) : (
              <select
                value={selectedTicketId}
                onChange={(e) => setSelectedTicketId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">-- Standalone (No Linked Ticket) --</option>
                {warrantyTickets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.ticketNumber} — {t.customerName} ({t.serialNumber || 'No S/N'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Job Card # & Assigned Technician */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Job Card #
              </label>
              <input
                type="text"
                value={jobCardNumber}
                onChange={(e) => setJobCardNumber(e.target.value)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Lead Technician
              </label>
              <select
                value={assignedTechnician}
                onChange={(e) => setAssignedTechnician(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {(serviceSettings?.defaultTechnicians || [
                  'Engr. Tanvir Ahmed',
                  'Engr. Shahinur Islam',
                  'Engr. Rafiqul Islam',
                  'Md. Faruk Hossain',
                ]).map((tech) => (
                  <option key={tech} value={tech}>
                    {tech}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Warranty Decision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Repair Priority
              </label>
              <select
                value={repairPriority}
                onChange={(e) => setRepairPriority(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Normal">Normal (Standard SLA)</option>
                <option value="High">High (Commercial Priority)</option>
                <option value="Critical">Critical (Immediate Line Stop)</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Warranty Coverage Determination
              </label>
              <select
                value={warrantyDecision}
                onChange={(e) => setWarrantyDecision(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Full Warranty Repair">Full Warranty Repair (100% Free)</option>
                <option value="Partial Chargeable">Partial Chargeable (Parts / Labor Split)</option>
                <option value="Out of Warranty (Chargeable)">Out of Warranty (100% Customer Payable)</option>
                <option value="Replacement Required">Complete Battery Replacement Authorized</option>
              </select>
            </div>
          </div>

          {/* Target Completion Date & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Completion Date
              </label>
              <input
                type="date"
                value={estimatedCompletionDate}
                onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Job Card Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="In Repair">In Repair</option>
                <option value="Awaiting Parts">Awaiting Parts</option>
                <option value="Bench Testing">Bench Testing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Work Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Diagnostic Scope &amp; Planned Operations
            </label>
            <textarea
              rows={3}
              value={workDetails}
              onChange={(e) => setWorkDetails(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="e.g. Replace module 3 cell, recalibrate BMS over-voltage cutoff, 24h cycling..."
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Create Job Card</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. SPARE PARTS MODAL
// ==========================================
interface SparePartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard: ServiceJobCard | null;
}

const COMMON_SPARE_PARTS = [
  { code: 'RM-CELL-3.2V-100AH', name: 'Grade-A 3.2V 100Ah LiFePO4 Prismatic Cell', category: 'Cell Module', unit: 'Pieces', defaultCost: 4800 },
  { code: 'RM-CELL-3.2V-50AH', name: 'Grade-A 3.2V 50Ah LiFePO4 Cell', category: 'Cell Module', unit: 'Pieces', defaultCost: 2600 },
  { code: 'SP-BMS-48V-100A-SMART', name: '48V 100A Smart BMS Board (Bluetooth / CAN)', category: 'BMS / Electronics', unit: 'Pieces', defaultCost: 8500 },
  { code: 'SP-BMS-60V-50A-EV', name: '60V 50A EV Traction BMS Board', category: 'BMS / Electronics', unit: 'Pieces', defaultCost: 6200 },
  { code: 'SP-BAL-16S-5A', name: '16S Active Equalizer Balancer Board 5A', category: 'BMS / Electronics', unit: 'Pieces', defaultCost: 3200 },
  { code: 'SP-CONN-AND-120A', name: 'Anderson High-Current Quick Connector 120A', category: 'Wiring / Connectors', unit: 'Sets', defaultCost: 650 },
  { code: 'SP-BUS-CU-200A', name: 'Flexible Nickel-Plated Copper Busbar 200A', category: 'Wiring / Connectors', unit: 'Pieces', defaultCost: 280 },
  { code: 'SP-NTC-10K', name: 'NTC 10K High-Precision Thermal Probe Harness', category: 'Thermal Management', unit: 'Pieces', defaultCost: 350 },
  { code: 'SP-ENC-BRK-48V', name: 'Steel Enclosure Heavy Bracket & Lock Latch', category: 'Casing & Structural', unit: 'Sets', defaultCost: 1400 },
];

export const SparePartsModal: React.FC<SparePartsModalProps> = ({
  isOpen,
  onClose,
  jobCard,
}) => {
  const {
    serviceJobCards,
    addSparePartsConsumption,
    rawMaterials,
  } = useERP();

  const [selectedJobCardId, setSelectedJobCardId] = useState<string>('');
  const [partCode, setPartCode] = useState<string>('RM-CELL-3.2V-100AH');
  const [partName, setPartName] = useState<string>('Grade-A 3.2V 100Ah LiFePO4 Prismatic Cell');
  const [componentCategory, setComponentCategory] = useState<string>('Cell Module');
  const [replacementQty, setReplacementQty] = useState<number>(1);
  const [unit, setUnit] = useState<string>('Pieces');
  const [unitCostBDT, setUnitCostBDT] = useState<number>(4800);
  const [warrantyCoverageStatus, setWarrantyCoverageStatus] = useState<string>('Free Under Warranty');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const activeJc = jobCard || serviceJobCards[0];
      setSelectedJobCardId(activeJc ? activeJc.id : '');
      const defaultPart = COMMON_SPARE_PARTS[0];
      setPartCode(defaultPart.code);
      setPartName(defaultPart.name);
      setComponentCategory(defaultPart.category);
      setUnit(defaultPart.unit);
      setUnitCostBDT(defaultPart.defaultCost);
      setReplacementQty(1);
      setWarrantyCoverageStatus(
        activeJc?.warrantyDecision === 'Full Warranty Repair'
          ? 'Free Under Warranty'
          : 'Customer Chargeable'
      );
      setError('');
    }
  }, [isOpen, jobCard, serviceJobCards]);

  if (!isOpen) return null;

  const currentJobCard =
    serviceJobCards.find((j) => j.id === selectedJobCardId) || jobCard;

  const handleSelectPresetPart = (code: string) => {
    const found = COMMON_SPARE_PARTS.find((p) => p.code === code);
    if (found) {
      setPartCode(found.code);
      setPartName(found.name);
      setComponentCategory(found.category);
      setUnit(found.unit);
      setUnitCostBDT(found.defaultCost);
    }
  };

  const totalCost = Number(replacementQty || 0) * Number(unitCostBDT || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) {
      setError('Please provide part name or select a component.');
      return;
    }
    if (replacementQty <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    try {
      addSparePartsConsumption({
        jobCardNumber: currentJobCard?.jobCardNumber || 'JC-DIRECT-ISSUE',
        partCode: partCode.trim() || 'CUSTOM-PART',
        partName: partName.trim(),
        replacementQty: Number(replacementQty),
        unit,
        warrantyCoverageStatus,
        componentCategory,
        unitCostBDT: Number(unitCostBDT),
        totalCostBDT: totalCost,
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to issue spare part.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Issue Spare Parts &amp; Consumables
              </h3>
              <p className="text-xs text-slate-500">
                Log replacement components consumed during battery service
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Job Card Selection */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target Service Job Card
            </label>
            {jobCard ? (
              <div className="text-xs space-y-0.5">
                <span className="font-mono font-bold text-blue-600">{jobCard.jobCardNumber}</span>
                <p className="text-slate-600 dark:text-slate-300">
                  Customer: <span className="font-semibold">{jobCard.customerName || 'Standard Client'}</span> • Tech: {jobCard.assignedTechnician}
                </p>
              </div>
            ) : (
              <select
                value={selectedJobCardId}
                onChange={(e) => setSelectedJobCardId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">-- General Factory Consumption --</option>
                {serviceJobCards.map((jc) => (
                  <option key={jc.id} value={jc.id}>
                    {jc.jobCardNumber} — {jc.customerName || 'Client'} ({jc.assignedTechnician})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Component Preset Quick Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Component from Catalog
            </label>
            <select
              value={partCode}
              onChange={(e) => handleSelectPresetPart(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {COMMON_SPARE_PARTS.map((p) => (
                <option key={p.code} value={p.code}>
                  [{p.category}] {p.name} (৳{p.defaultCost.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Part Name & Code Manual Override */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Part Name
              </label>
              <input
                type="text"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Part Code / SKU
              </label>
              <input
                type="text"
                value={partCode}
                onChange={(e) => setPartCode(e.target.value)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Qty, Unit, Unit Cost */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={replacementQty}
                onChange={(e) => setReplacementQty(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Pieces">Pieces</option>
                <option value="Sets">Sets</option>
                <option value="Meters">Meters</option>
                <option value="Units">Units</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit Cost (BDT)
              </label>
              <input
                type="number"
                min="0"
                value={unitCostBDT}
                onChange={(e) => setUnitCostBDT(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>
          </div>

          {/* Category & Warranty Coverage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Component Category
              </label>
              <select
                value={componentCategory}
                onChange={(e) => setComponentCategory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Cell Module">Cell Module</option>
                <option value="BMS / Electronics">BMS / Electronics</option>
                <option value="Wiring / Connectors">Wiring / Connectors</option>
                <option value="Thermal Management">Thermal Management</option>
                <option value="Casing & Structural">Casing &amp; Structural</option>
                <option value="Packaging & Consumables">Packaging &amp; Consumables</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Warranty Cost Absorbed
              </label>
              <select
                value={warrantyCoverageStatus}
                onChange={(e) => setWarrantyCoverageStatus(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Free Under Warranty">Free Under Warranty (100% Absorbed)</option>
                <option value="Customer Chargeable">Customer Chargeable (Out of Warranty)</option>
                <option value="Goodwill 50% Share">Goodwill 50% Share</option>
              </select>
            </div>
          </div>

          {/* Total Preview */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
              Total Component Valuation
            </span>
            <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
              ৳{totalCost.toLocaleString()} BDT
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Record Spare Part</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. BILLING MODAL
// ==========================================
interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard: ServiceJobCard | null;
}

export const BillingModal: React.FC<BillingModalProps> = ({
  isOpen,
  onClose,
  jobCard,
}) => {
  const {
    warrantyTickets,
    serviceJobCards,
    sparePartsConsumptions,
    addServiceInvoice,
    addServicePayment,
    updateWarrantyTicket,
  } = useERP();

  const [selectedJobCardId, setSelectedJobCardId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [laborChargeBDT, setLaborChargeBDT] = useState<number>(0);
  const [partsChargeBDT, setPartsChargeBDT] = useState<number>(0);
  const [warrantyCoveredBDT, setWarrantyCoveredBDT] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<string>('Pending');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const activeJc = jobCard || serviceJobCards[0];
      setSelectedJobCardId(activeJc ? activeJc.id : '');

      const randNum = Math.floor(1000 + Math.random() * 9000);
      setInvoiceNumber(`SRV-INV-2026-${randNum}`);
      setInvoiceDate(new Date().toISOString().slice(0, 10));

      const linkedTicket = activeJc
        ? warrantyTickets.find((t) => t.id === activeJc.ticketId || t.ticketNumber === activeJc.ticketNumber)
        : null;

      const cust = linkedTicket?.customerName || activeJc?.customerName || 'Walk-in Customer';
      setCustomerName(cust);

      // Calculate total parts from sparePartsConsumptions for this job card
      const relatedParts = activeJc
        ? sparePartsConsumptions.filter((p) => p.jobCardNumber === activeJc.jobCardNumber)
        : [];
      const partsSum = relatedParts.reduce((acc, p) => acc + (p.totalCostBDT || 0), 0);

      const isUnderWarranty =
        activeJc?.warrantyDecision === 'Full Warranty Repair' ||
        linkedTicket?.warrantyStatus?.includes('Valid');

      if (isUnderWarranty) {
        setLaborChargeBDT(1500);
        setPartsChargeBDT(partsSum || 4800);
        setWarrantyCoveredBDT((partsSum || 4800) + 1500);
        setPaymentStatus('Warranty Cleared');
        setPaymentMethod('Warranty Voucher');
      } else {
        setLaborChargeBDT(2000);
        setPartsChargeBDT(partsSum || 6500);
        setWarrantyCoveredBDT(0);
        setPaymentStatus('Pending');
        setPaymentMethod('Cash');
      }
      setError('');
    }
  }, [isOpen, jobCard, serviceJobCards, warrantyTickets, sparePartsConsumptions]);

  if (!isOpen) return null;

  const currentJobCard =
    serviceJobCards.find((j) => j.id === selectedJobCardId) || jobCard;

  const subTotal = Number(laborChargeBDT || 0) + Number(partsChargeBDT || 0);
  const netPayable = Math.max(0, subTotal - Number(warrantyCoveredBDT || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      setError('Please provide a valid Invoice Number.');
      return;
    }
    if (!customerName.trim()) {
      setError('Please provide the Customer Name.');
      return;
    }

    try {
      const invId = addServiceInvoice({
        ticketId: currentJobCard?.ticketId || undefined,
        invoiceNumber: invoiceNumber.trim(),
        customerName: customerName.trim(),
        totalInvoiceAmountBDT: netPayable,
        warrantyCoveredCostBDT: Number(warrantyCoveredBDT || 0),
        amountPaidBDT: paymentStatus === 'Paid' ? netPayable : 0,
        outstandingAmountBDT: paymentStatus === 'Paid' ? 0 : netPayable,
        paymentStatus,
        invoiceDate,
      });

      // If marked paid, also log a payment receipt
      if (paymentStatus === 'Paid' && netPayable > 0) {
        addServicePayment({
          invoiceId: invId,
          invoiceNumber: invoiceNumber.trim(),
          ticketNumber: currentJobCard?.ticketNumber,
          receiptNumber: `SRV-REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          customerName: customerName.trim(),
          paymentDate: invoiceDate,
          amountBDT: netPayable,
          paymentMethod,
        });
      }

      if (currentJobCard?.ticketId) {
        updateWarrantyTicket(currentJobCard.ticketId, {
          invoiceId: invId,
          invoiceNumber: invoiceNumber.trim(),
          invoiceTotalBDT: netPayable,
          amountPaidBDT: paymentStatus === 'Paid' ? netPayable : 0,
          paymentStatus,
        });
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to generate invoice.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Generate Service Invoice / Bill
              </h3>
              <p className="text-xs text-slate-500">
                Create billing record for repair work, parts, and warranty settlement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Job Card Selection */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Linked Job Card
            </label>
            {jobCard ? (
              <div className="text-xs space-y-0.5">
                <span className="font-mono font-bold text-purple-600">{jobCard.jobCardNumber}</span>
                <p className="text-slate-600 dark:text-slate-300">
                  {jobCard.customerName || 'Customer'} • {jobCard.warrantyDecision}
                </p>
              </div>
            ) : (
              <select
                value={selectedJobCardId}
                onChange={(e) => setSelectedJobCardId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">-- Manual Invoice (No Job Card) --</option>
                {serviceJobCards.map((jc) => (
                  <option key={jc.id} value={jc.id}>
                    {jc.jobCardNumber} — {jc.customerName || 'Client'} ({jc.warrantyDecision})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Invoice # & Customer Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invoice #
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Name / Entity
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Billing Calculations */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Labor / Service (৳)
              </label>
              <input
                type="number"
                min="0"
                value={laborChargeBDT}
                onChange={(e) => setLaborChargeBDT(Number(e.target.value))}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Parts Replaced (৳)
              </label>
              <input
                type="number"
                min="0"
                value={partsChargeBDT}
                onChange={(e) => setPartsChargeBDT(Number(e.target.value))}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                Warranty Covered (৳)
              </label>
              <input
                type="number"
                min="0"
                value={warrantyCoveredBDT}
                onChange={(e) => setWarrantyCoveredBDT(Number(e.target.value))}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300"
              />
            </div>
          </div>

          {/* Payment Status & Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Pending">Payment Pending</option>
                <option value="Paid">Fully Paid</option>
                <option value="Warranty Cleared">Warranty Cleared (0 Customer Payable)</option>
                <option value="Partial">Partial Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Warranty Voucher">Warranty Voucher (Non-cash)</option>
                <option value="Cash">Cash at Counter</option>
                <option value="bKash / Nagad">bKash / Nagad Mobile Banking</option>
                <option value="Bank Transfer">Bank Transfer / BEFTN</option>
              </select>
            </div>
          </div>

          {/* Net Payable Banner */}
          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-900 dark:text-purple-300 font-medium">
                Customer Net Payable
              </p>
              <p className="text-[11px] text-purple-600 dark:text-purple-400">
                Gross: ৳{subTotal.toLocaleString()} − Warranty: ৳{Number(warrantyCoveredBDT || 0).toLocaleString()}
              </p>
            </div>
            <span className="text-lg font-bold font-mono text-purple-700 dark:text-purple-300">
              ৳{netPayable.toLocaleString()} BDT
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Generate Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
