import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  PackageCheck,
  Search,
  Boxes,
  Calculator,
  Receipt,
  CheckCircle2,
  Truck,
  BookOpen,
  History,
  BarChart3,
  Settings,
  Plus,
  Filter,
  DollarSign,
  BatteryCharging,
  Eye,
  Edit2,
  Trash2,
  Check,
  X,
  Printer,
  ChevronRight,
  Clock,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  FileText,
  UserCheck,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import {
  WarrantyTicket,
  ServiceJobCard,
  SparePartReplacement,
  RepairEstimation,
  ServiceInvoice,
  QualityControlRecord,
  BatteryDeliveryDispatch,
  WarrantyPolicy,
} from '../../types/warranty.ts';
import {
  JobCardModal,
  SparePartsModal,
  BillingModal,
} from './WarrantyActionModals.tsx';

interface WarrantyManagementModuleProps {
  initialSubTab?: string;
  onNavigate?: (subTab: string) => void;
}

export const WarrantyManagementModule: React.FC<WarrantyManagementModuleProps> = ({
  initialSubTab = 'warranty-dashboard',
  onNavigate,
}) => {
  const {
    warrantyTickets,
    addWarrantyTicket,
    updateWarrantyTicket,
    deleteWarrantyTicket,
    batteryReceivings,
    addBatteryReceiving,
    technicalInspections,
    addTechnicalInspection,
    serviceJobCards,
    addServiceJobCard,
    updateServiceJobCard,
    sparePartsConsumptions,
    addSparePartsConsumption,
    serviceEstimations,
    addServiceEstimation,
    updateServiceEstimation,
    serviceInvoices,
    updateServiceInvoice,
    servicePayments,
    addServicePayment,
    qualityControlRecords,
    addQualityControlRecord,
    batteryDispatches,
    addBatteryDispatch,
    warrantyPolicies,
    addWarrantyPolicy,
    serviceSettings,
    updateServiceSettings,
    products,
    distributors,
  } = useERP();

  const [activeTab, setActiveTab] = useState<string>(initialSubTab);

  // Synchronize activeTab whenever initialSubTab changes from parent
  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onNavigate?.(tabId);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal controls
  const [selectedTicketForJobCard, setSelectedTicketForJobCard] = useState<WarrantyTicket | null>(null);
  const [isJobCardModalOpen, setIsJobCardModalOpen] = useState(false);
  const [selectedJobCardForParts, setSelectedJobCardForParts] = useState<ServiceJobCard | null>(null);
  const [isPartsModalOpen, setIsPartsModalOpen] = useState(false);
  const [selectedJobCardForBilling, setSelectedJobCardForBilling] = useState<ServiceJobCard | null>(null);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

  // New Ticket Form State
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [ticketCustomerName, setTicketCustomerName] = useState('');
  const [ticketCustomerPhone, setTicketCustomerPhone] = useState('');
  const [ticketCustomerEmail, setTicketCustomerEmail] = useState('');
  const [ticketOwnershipType, setTicketOwnershipType] = useState<'Ensec Battery' | 'Third-Party Battery'>('Ensec Battery');
  const [ticketBatteryBrand, setTicketBatteryBrand] = useState('ENSEC PowerCore');
  const [ticketBatteryModel, setTicketBatteryModel] = useState('48V 100Ah Wall-Mount ESS (5.12 kWh)');
  const [ticketSerialNumber, setTicketSerialNumber] = useState('');
  const [ticketReportedFault, setTicketReportedFault] = useState('');
  const [ticketDistributorName, setTicketDistributorName] = useState('Maharam Store (Mirpur)');
  const [ticketCollectionPoint, setTicketCollectionPoint] = useState('Dhaka Central Hub - Tejgaon');

  // New Battery Receiving Form State
  const [showReceivingModal, setShowReceivingModal] = useState(false);
  const [receivingTicketId, setReceivingTicketId] = useState('');
  const [receivingDeliveryMethod, setReceivingDeliveryMethod] = useState('Sundarban Courier Service');
  const [receivingCourierTracking, setReceivingCourierTracking] = useState('');
  const [receivingCondition, setReceivingCondition] = useState('Exterior intact, no swelling or electrolyte leakage.');
  const [receivingInitialVoltage, setReceivingInitialVoltage] = useState(51.2);

  // New Technical Inspection Form State
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionTicketId, setInspectionTicketId] = useState('');
  const [inspectionTechnician, setInspectionTechnician] = useState(
    serviceSettings?.defaultTechnicians?.[0] || 'Engr. Rafiqul Islam'
  );
  const [inspectionVoltage, setInspectionVoltage] = useState(51.2);
  const [inspectionIR, setInspectionIR] = useState(12.5);
  const [inspectionBMSResult, setInspectionBMSResult] = useState('Normal communication, 1 cell balance drift detected.');
  const [inspectionIsSafetyHold, setInspectionIsSafetyHold] = useState(false);
  const [inspectionHoldReason, setInspectionHoldReason] = useState('');
  const [inspectionRootCause, setInspectionRootCause] = useState('Cell balance divergence after deep discharge.');
  const [inspectionAction, setInspectionAction] = useState('Active balance calibration & 48-hour soak test.');

  // New Quality Control Record Modal
  const [showQCModal, setShowQCModal] = useState(false);
  const [qcTicketNumber, setQcTicketNumber] = useState('');
  const [qcInspector, setQcInspector] = useState(
    serviceSettings?.qcInspectors?.[0] || 'Tariqul Anam (Lead QC)'
  );
  const [qcOCV, setQcOCV] = useState(53.2);
  const [qcIR, setQcIR] = useState(8.5);
  const [qcResult, setQcResult] = useState<'QC Passed' | 'QC Failed'>('QC Passed');
  const [qcNotes, setQcNotes] = useState('100A sustained discharge load test passed without thermal runaway.');

  // New Dispatch Form Modal
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchTicketId, setDispatchTicketId] = useState('');
  const [dispatchDeliveryMethod, setDispatchDeliveryMethod] = useState<'Courier' | 'Customer Pickup' | 'Company Transport' | 'Distributor Vehicle'>('Courier');
  const [dispatchCourierName, setDispatchCourierName] = useState('Sundarban Courier');
  const [dispatchTrackingNo, setDispatchTrackingNo] = useState('');
  const [dispatchDeliveredBy, setDispatchDeliveredBy] = useState('Ensec Dispatch Logistics Officer');

  // Warranty Verification State
  const [verifySerialInput, setVerifySerialInput] = useState('');
  const [verifiedTicket, setVerifiedTicket] = useState<WarrantyTicket | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Lifecycle History Search
  const [historySearchSerial, setHistorySearchSerial] = useState(
    warrantyTickets[0]?.serialNumber || 'ENS-BAT-2025-001'
  );

  // New Estimation Modal
  const [showEstimationModal, setShowEstimationModal] = useState(false);
  const [estimateTicketId, setEstimateTicketId] = useState('');
  const [estimatePartsCost, setEstimatePartsCost] = useState(12500);
  const [estimateLaborCost, setEstimateLaborCost] = useState(3000);
  const [estimateNotes, setEstimateNotes] = useState('Out-of-warranty cell module replacement and BMS re-flashing.');

  // New Policy Modal
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState('LiFePO4 Home ESS Extended Care');
  const [newPolicyCategory, setNewPolicyCategory] = useState('Wall-Mount Lithium ESS');
  const [newPolicyDuration, setNewPolicyDuration] = useState(60);
  const [newPolicyFreeReplace, setNewPolicyFreeReplace] = useState(24);
  const [newPolicyTerms, setNewPolicyTerms] = useState('Covers BMS defects, cell degradation >30% within warranty period.');

  // Settings State
  const [settingsTechList, setSettingsTechList] = useState<string[]>(
    serviceSettings?.defaultTechnicians || ['Engr. Tanvir Ahmed', 'Engr. Shahinur Islam', 'Engr. Rafiqul Islam', 'Md. Faruk Hossain']
  );
  const [settingsQCList, setSettingsQCList] = useState<string[]>(
    serviceSettings?.qcInspectors || ['Tariqul Anam (Lead QC)', 'Engr. Nazmul Huda', 'Sultana Razia (QA)']
  );
  const [newTechName, setNewTechName] = useState('');
  const [newQCName, setNewQCName] = useState('');
  const [settingsLaborRate, setSettingsLaborRate] = useState(1500);
  const [settingsVat, setSettingsVat] = useState(serviceSettings?.vatPercentage || 15);
  const [settingsSlaDays, setSettingsSlaDays] = useState(7);
  const [settingsFeedback, setSettingsFeedback] = useState('');

  // Repair Bench active stage mock tracking
  const [repairStepProgress, setRepairStepProgress] = useState<{ [ticketNumber: string]: number }>({
    'ENS-WAR-2026-00001': 3,
    'ENS-WAR-2026-00002': 4,
  });

  // KPI Calculations
  const stats = useMemo(() => {
    const totalTickets = warrantyTickets.length;
    const inRepairCount = warrantyTickets.filter(
      (t) => t.status === 'In Repair' || t.status === 'Technical Inspection'
    ).length;
    const readyForDispatchCount = warrantyTickets.filter(
      (t) => t.status === 'Ready for Dispatch' || t.status === 'Quality Control Pending'
    ).length;
    const deliveredCount = warrantyTickets.filter((t) => t.status === 'Delivered').length;
    const warrantyAbsorbedBDT = serviceInvoices.reduce((sum, inv) => sum + (inv.warrantyCoveredCostBDT || 0), 0);
    const customerPayableBDT = serviceInvoices.reduce((sum, inv) => sum + (inv.totalInvoiceAmountBDT || 0), 0);

    return {
      totalTickets,
      inRepairCount,
      readyForDispatchCount,
      deliveredCount,
      warrantyAbsorbedBDT,
      customerPayableBDT,
    };
  }, [warrantyTickets, serviceInvoices]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return warrantyTickets.filter((ticket) => {
      const matchSearch =
        ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.batteryModel.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || ticket.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [warrantyTickets, searchTerm, filterStatus]);

  // Handlers
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCustomerName || !ticketSerialNumber) return;

    addWarrantyTicket({
      ticketNumber: `ENS-WAR-2026-${(warrantyTickets.length + 1).toString().padStart(5, '0')}`,
      customerName: ticketCustomerName,
      customerPhone: ticketCustomerPhone,
      customerEmail: ticketCustomerEmail,
      ownershipType: ticketOwnershipType,
      batteryBrand: ticketBatteryBrand,
      batteryModel: ticketBatteryModel,
      serialNumber: ticketSerialNumber.toUpperCase(),
      reportedFault: ticketReportedFault || 'General battery fault reported by customer.',
      distributorName: ticketDistributorName,
      collectionPoint: ticketCollectionPoint,
      status: 'Complaint Registered',
      warrantyStatus: ticketOwnershipType === 'Ensec Battery' ? 'Valid' : 'Out of Warranty',
    });

    setShowCreateTicketModal(false);
    setTicketCustomerName('');
    setTicketSerialNumber('');
    setTicketReportedFault('');
  };

  const handleCreateReceiving = (e: React.FormEvent) => {
    e.preventDefault();
    const ticket = warrantyTickets.find((t) => t.id === receivingTicketId);
    if (!ticket) return;

    addBatteryReceiving({
      receivingReceiptNumber: `RCV-2026-${(batteryReceivings.length + 1).toString().padStart(4, '0')}`,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      customerName: ticket.customerName,
      batteryBrand: ticket.batteryBrand,
      batteryModel: ticket.batteryModel,
      serialNumber: ticket.serialNumber,
      receivingDate: new Date().toISOString().slice(0, 10),
      deliveryMethod: receivingDeliveryMethod,
      courierTracking: receivingCourierTracking,
      receivedBy: 'Asaduzzaman (Factory QA)',
      physicalCondition: receivingCondition,
      initialVoltage: Number(receivingInitialVoltage),
    });

    updateWarrantyTicket(ticket.id, {
      status: 'Received at Kushtia Bay',
      isReceivedAtFactory: true,
      receivedDate: new Date().toISOString().slice(0, 10),
    });

    setShowReceivingModal(false);
  };

  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const ticket = warrantyTickets.find((t) => t.id === inspectionTicketId);
    if (!ticket) return;

    addTechnicalInspection({
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      serialNumber: ticket.serialNumber,
      technicianName: inspectionTechnician,
      inspectionDate: new Date().toISOString().slice(0, 10),
      testedVoltage: Number(inspectionVoltage),
      testedInternalResistance: Number(inspectionIR),
      bmsDiagnosticResult: inspectionBMSResult,
      isSafetyHold: inspectionIsSafetyHold,
      safetyHoldReason: inspectionIsSafetyHold ? inspectionHoldReason : undefined,
      rootCauseDescription: inspectionRootCause,
      recommendedAction: inspectionAction,
    });

    updateWarrantyTicket(ticket.id, {
      status: inspectionIsSafetyHold ? 'Safety Hold' : 'Technical Inspection',
      isSafetyHold: inspectionIsSafetyHold,
      safetyHoldReason: inspectionHoldReason,
    });

    setShowInspectionModal(false);
  };

  const handleCreateQC = (e: React.FormEvent) => {
    e.preventDefault();
    const ticket = warrantyTickets.find((t) => t.ticketNumber === qcTicketNumber);

    addQualityControlRecord({
      qcNumber: `QC-CERT-2026-${(qualityControlRecords.length + 1).toString().padStart(4, '0')}`,
      ticketNumber: qcTicketNumber,
      qcInspector,
      result: qcResult,
      openCircuitVoltage: Number(qcOCV),
      internalResistanceMilliOhm: Number(qcIR),
      notes: qcNotes,
      inspectionDate: new Date().toISOString().slice(0, 10),
      thermalImagingStatus: 'Pass (Delta T < 4°C)',
      bmsCommunicationStatus: 'Verified CAN-bus 500kbps handshake',
    });

    if (ticket) {
      updateWarrantyTicket(ticket.id, {
        status: qcResult === 'QC Passed' ? 'Ready for Dispatch' : 'In Repair',
        qcStatus: qcResult,
      });
    }

    setShowQCModal(false);
  };

  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const ticket = warrantyTickets.find((t) => t.id === dispatchTicketId);
    if (!ticket) return;

    addBatteryDispatch({
      gatePassNumber: `GP-2026-${(batteryDispatches.length + 1).toString().padStart(4, '0')}`,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      customerName: ticket.customerName,
      batteryBrand: ticket.batteryBrand,
      serialNumber: ticket.serialNumber,
      dispatchDate: new Date().toISOString().slice(0, 10),
      deliveryMethod: dispatchDeliveryMethod,
      courierName: dispatchCourierName,
      consignmentTrackingNumber: dispatchTrackingNo || `TRK-${Date.now().toString().slice(-6)}`,
      deliveredBy: dispatchDeliveredBy,
      status: 'Dispatched in Transit',
    });

    updateWarrantyTicket(ticket.id, {
      status: 'Delivered',
      dispatchDate: new Date().toISOString().slice(0, 10),
    });

    setShowDispatchModal(false);
  };

  const handleVerifySerial = (e: React.FormEvent) => {
    e.preventDefault();
    const term = verifySerialInput.trim().toUpperCase();
    if (!term) return;

    const found = warrantyTickets.find((t) => t.serialNumber?.toUpperCase() === term);
    if (found) {
      setVerifiedTicket(found);
      setVerificationFeedback(null);
    } else {
      setVerifiedTicket(null);
      setVerificationFeedback(`No prior service tickets recorded for Serial "${term}". Battery is registered in ERP Master Products.`);
    }
  };

  const handleCreateEstimation = (e: React.FormEvent) => {
    e.preventDefault();
    const ticket = warrantyTickets.find((t) => t.id === estimateTicketId);
    if (!ticket) return;

    const subtotal = estimatePartsCost + estimateLaborCost;
    const vat = subtotal * (settingsVat / 100);
    const total = subtotal + vat;

    addServiceEstimation({
      estimationNumber: `EST-2026-${(serviceEstimations.length + 1).toString().padStart(4, '0')}`,
      ticketId: ticket.id,
      customerName: ticket.customerName,
      totalEstimatedAmountBDT: total,
      customerApprovalStatus: 'Approved by Customer',
      notes: estimateNotes,
    });

    setShowEstimationModal(false);
  };

  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    addWarrantyPolicy({
      policyName: newPolicyName,
      batteryType: newPolicyCategory,
      batteryCategory: newPolicyCategory,
      durationMonths: Number(newPolicyDuration),
      warrantyMonths: Number(newPolicyDuration),
      freeReplacementMonths: Number(newPolicyFreeReplace),
      replacementTerms: `${newPolicyFreeReplace} months free replacement, remaining pro-rata warranty.`,
      termsAndConditions: newPolicyTerms,
      coveragePercentage: 100,
      status: 'Active',
    });
    setShowPolicyModal(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateServiceSettings({
      defaultTechnicians: settingsTechList,
      qcInspectors: settingsQCList,
      vatPercentage: Number(settingsVat),
    });
    setSettingsFeedback('Warranty & Service configuration saved successfully!');
    setTimeout(() => setSettingsFeedback(''), 3000);
  };

  // Nav subtabs configuration
  const warrantyNavTabs = [
    { id: 'warranty-dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'warranty-complaints', label: 'Customer Complaints', icon: AlertCircle, count: warrantyTickets.length },
    { id: 'warranty-jobcards', label: 'Service Job Cards', icon: FileSpreadsheet, count: serviceJobCards.length },
    { id: 'warranty-receiving', label: 'Battery Receiving', icon: PackageCheck, count: batteryReceivings.length },
    { id: 'warranty-verification', label: 'Warranty Verification', icon: ShieldCheck },
    { id: 'warranty-inspection', label: 'Technical Inspection', icon: Search, count: technicalInspections.length },
    { id: 'warranty-repair', label: 'Repair & Parts Replacement', icon: Wrench },
    { id: 'warranty-parts-consumption', label: 'Spare Parts Consumption', icon: Boxes, count: sparePartsConsumptions.length },
    { id: 'warranty-estimation', label: 'Repair Cost Estimation', icon: Calculator, count: serviceEstimations.length },
    { id: 'warranty-billing', label: 'Customer Billing & Payments', icon: Receipt, count: serviceInvoices.length },
    { id: 'warranty-qc', label: 'Quality Control', icon: CheckCircle2, count: qualityControlRecords.length },
    { id: 'warranty-dispatch', label: 'Battery Delivery & Dispatch', icon: Truck, count: batteryDispatches.length },
    { id: 'warranty-policies', label: 'Warranty Policies', icon: BookOpen, count: warrantyPolicies.length },
    { id: 'warranty-history', label: 'Service History', icon: History },
    { id: 'warranty-reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'warranty-settings', label: 'Service Settings', icon: Settings },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Warranty &amp; Service Management
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  Kushtia Bay &amp; RMA Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                End-to-end lifecycle tracking: Complaint registration, physical arrival, bench diagnostics, spare replacement, QC sign-off &amp; gate pass delivery.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCreateTicketModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Claim</span>
            </button>
            <button
              onClick={() => setShowReceivingModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span>Log Arrival</span>
            </button>
            <button
              onClick={() => setShowInspectionModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              <Search className="w-4 h-4 text-blue-600" />
              <span>Log Inspection</span>
            </button>
            <button
              onClick={() => setShowQCModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span>QC Sign-off</span>
            </button>
            <button
              onClick={() => setShowDispatchModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Dispatch Battery</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs scrollbar-thin">
          {warrantyNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          SUBTAB 1: WARRANTY DASHBOARD
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-dashboard' && (
        <div className="space-y-5">
          {/* KPI Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] text-slate-500 block">Total Claims Logged</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                {stats.totalTickets}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>LiFePO4 &amp; 3rd-Party</span>
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] text-slate-500 block">In Repair / Diagnostic</span>
              <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                {stats.inRepairCount}
              </span>
              <span className="text-[10px] text-amber-600/80 mt-1 flex items-center gap-1">
                <Wrench className="w-3 h-3" />
                <span>Active Bay Testing</span>
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] text-slate-500 block">Ready for Dispatch</span>
              <span className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1 block">
                {stats.readyForDispatchCount}
              </span>
              <span className="text-[10px] text-purple-600/80 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>QC Approved</span>
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] text-slate-500 block">Delivered / Settled</span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                {stats.deliveredCount}
              </span>
              <span className="text-[10px] text-emerald-600/80 mt-1 flex items-center gap-1">
                <Truck className="w-3 h-3" />
                <span>Customer Handover</span>
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] text-slate-500 block">Warranty Cost Absorbed</span>
              <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 block">
                ৳{stats.warrantyAbsorbedBDT.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">Free Under Policy</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] text-slate-500 block">Customer Paid Repair</span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                ৳{stats.customerPayableBDT.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-500 mt-1">Paid Service Recovery</span>
            </div>
          </div>

          {/* Workflow Stage distribution cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
            {[
              { label: 'Registered', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300', count: warrantyTickets.filter(t => t.status === 'Complaint Registered').length },
              { label: 'Factory Received', color: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300', count: warrantyTickets.filter(t => t.status.includes('Received')).length },
              { label: 'Technical Inspection', color: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300', count: warrantyTickets.filter(t => t.status.includes('Inspection')).length },
              { label: 'In Repair Bench', color: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300', count: warrantyTickets.filter(t => t.status === 'In Repair').length },
              { label: 'QC Sign-Off', color: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300', count: warrantyTickets.filter(t => t.status.includes('Quality')).length },
              { label: 'Ready for Dispatch', color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300', count: warrantyTickets.filter(t => t.status === 'Ready for Dispatch').length },
              { label: 'Delivered', color: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300', count: warrantyTickets.filter(t => t.status === 'Delivered').length },
            ].map((stage, idx) => (
              <div key={idx} className={`p-3 rounded-xl border border-slate-200 dark:border-slate-800 ${stage.color}`}>
                <div className="text-[10px] font-semibold opacity-75">{stage.label}</div>
                <div className="text-base font-bold font-mono mt-1">{stage.count} Batteries</div>
              </div>
            ))}
          </div>

          {/* Recent Claims Overview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Warranty Claim Tickets</h3>
                <p className="text-[11px] text-slate-500">Live operational queues across Kushtia Factory &amp; Regional Depots</p>
              </div>
              <button
                onClick={() => handleSelectTab('warranty-complaints')}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View Full Complaints Register</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Ticket #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Serial &amp; Model</th>
                    <th className="p-3">Ownership</th>
                    <th className="p-3">Reported Fault</th>
                    <th className="p-3">Workflow Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {warrantyTickets.slice(0, 5).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{t.ticketNumber}</td>
                      <td className="p-3 font-medium text-slate-900 dark:text-white">{t.customerName}</td>
                      <td className="p-3">
                        <span className="font-mono block font-semibold text-slate-700 dark:text-slate-300">{t.serialNumber}</span>
                        <span className="text-[11px] text-slate-400">{t.batteryModel}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.ownershipType === 'Ensec Battery' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {t.ownershipType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{t.reportedFault}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedTicketForJobCard(t);
                            setIsJobCardModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[11px] font-bold"
                        >
                          Job Card
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          SUBTAB 2: CUSTOMER COMPLAINTS
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-complaints' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Customer Complaints &amp; RMA Register</h3>
              <p className="text-[11px] text-slate-500">Record initial battery return requests, distributor intake, and verify claims.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Ticket, Customer, Serial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs w-48 sm:w-64"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="Complaint Registered">Complaint Registered</option>
                <option value="Received at Kushtia Bay">Received at Kushtia</option>
                <option value="Technical Inspection">Technical Inspection</option>
                <option value="In Repair">In Repair</option>
                <option value="Ready for Dispatch">Ready for Dispatch</option>
                <option value="Delivered">Delivered</option>
              </select>
              <button
                onClick={() => setShowCreateTicketModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>New Complaint</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Ticket #</th>
                  <th className="p-3">Customer Details</th>
                  <th className="p-3">Battery Specification</th>
                  <th className="p-3">Serial Number</th>
                  <th className="p-3">Warranty State</th>
                  <th className="p-3">Collection Hub</th>
                  <th className="p-3">Workflow Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {ticket.ticketNumber}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-900 dark:text-white block">{ticket.customerName}</span>
                      <span className="text-[11px] text-slate-400 block">{ticket.customerPhone}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">{ticket.batteryModel}</span>
                      <span className="text-[10px] text-slate-400">{ticket.batteryBrand}</span>
                    </td>
                    <td className="p-3 font-mono font-bold">{ticket.serialNumber}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ticket.warrantyStatus === 'Valid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {ticket.warrantyStatus || 'Valid'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{ticket.collectionPoint}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedTicketForJobCard(ticket);
                            setIsJobCardModalOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold"
                          title="Generate Service Job Card"
                        >
                          Job Card
                        </button>
                        <button
                          onClick={() => {
                            setReceivingTicketId(ticket.id);
                            setShowReceivingModal(true);
                          }}
                          className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold"
                          title="Record Factory Arrival"
                        >
                          Receive
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

      {/* -------------------------------------------------------------------------
          SUBTAB 3: SERVICE JOB CARDS
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-jobcards' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Service Job Cards</h3>
              <p className="text-[11px] text-slate-500">Technician work assignment, diagnostic milestones, and repair authorization.</p>
            </div>
            <button
              onClick={() => {
                setSelectedTicketForJobCard(null);
                setIsJobCardModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create Job Card</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Job Card #</th>
                  <th className="p-3">Service Ticket</th>
                  <th className="p-3">Technician</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Target Completion</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {serviceJobCards.map((jc) => (
                  <tr key={jc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-blue-600">{jc.jobCardNumber}</td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">
                      {jc.ticketNumber} — {jc.customerName}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{jc.assignedTechnician}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {jc.repairPriority}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{jc.expectedCompletionDate || jc.creationDate || '2026-10-20'}</td>
                    <td className="p-3 font-semibold">{jc.status}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedJobCardForParts(jc);
                            setIsPartsModalOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100"
                        >
                          Issue Spares
                        </button>
                        <button
                          onClick={() => {
                            setSelectedJobCardForBilling(jc);
                            setIsBillingModalOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-purple-50 text-purple-700 text-[10px] font-bold hover:bg-purple-100"
                        >
                          Generate Invoice
                        </button>
                        <button
                          onClick={() => {
                            updateServiceJobCard(jc.id, { status: 'Quality Control Pending' });
                          }}
                          className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold hover:bg-blue-100"
                        >
                          Pass to QC
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

      {/* -------------------------------------------------------------------------
          SUBTAB 4: BATTERY RECEIVING
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-receiving' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Battery Receiving at Kushtia Bay</h3>
              <p className="text-[11px] text-slate-500">Inward logistics receipt, physical inspection, courier waybill audit, and initial OCV test.</p>
            </div>
            <button
              onClick={() => setShowReceivingModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Log Battery Arrival</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Receipt #</th>
                  <th className="p-3">Ticket #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Model &amp; Serial</th>
                  <th className="p-3">Delivery Method</th>
                  <th className="p-3">Initial Voltage</th>
                  <th className="p-3">Received Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batteryReceivings.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 font-mono font-bold text-emerald-600">{r.receivingReceiptNumber}</td>
                    <td className="p-3 font-mono">{r.ticketNumber}</td>
                    <td className="p-3 font-medium">{r.customerName}</td>
                    <td className="p-3">{r.batteryModel} ({r.serialNumber})</td>
                    <td className="p-3">{r.deliveryMethod}</td>
                    <td className="p-3 font-mono">{r.initialVoltage}V</td>
                    <td className="p-3">{r.receivingDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          SUBTAB 5: WARRANTY VERIFICATION (INTERACTIVE TOOL)
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-verification' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="max-w-xl">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>Battery Serial Warranty Verification Engine</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter or scan any battery serial number to verify manufacturing pedigree, active warranty duration, distributor sales invoice, and prior service records.
              </p>
            </div>

            <form onSubmit={handleVerifySerial} className="flex gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. ENS-48100-2025-001 or ENS-BAT-2025-001"
                  value={verifySerialInput}
                  onChange={(e) => setVerifySerialInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Verify Warranty
              </button>
            </form>

            {/* Quick Sample Serial Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
              <span>Quick Test Serials:</span>
              {warrantyTickets.slice(0, 4).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setVerifySerialInput(t.serialNumber);
                    setVerifiedTicket(t);
                    setVerificationFeedback(null);
                  }}
                  className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t.serialNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Verification Results Panel */}
          {verifiedTicket && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                      {verifiedTicket.serialNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      GENUINE ENSEC BATTERY
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{verifiedTicket.batteryModel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500 text-white shadow-2xs">
                    WARRANTY ACTIVE • 28 MONTHS REMAINING
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Primary Customer</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">{verifiedTicket.customerName}</span>
                  <span className="text-slate-500">{verifiedTicket.customerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Distributor / Dealer</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">{verifiedTicket.distributorName}</span>
                  <span className="text-slate-500">Dhaka Central Distribution</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Battery Chemistry</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">16S LiFePO4 (LFP)</span>
                  <span className="text-slate-500">51.2V Nominal • 100Ah (5.12 kWh)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Warranty Policy</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">36-Month Standard ESS</span>
                  <span className="text-slate-500">Free Replacement: 12 Mos</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] text-slate-500">
                  Last known status: <b className="text-slate-700 dark:text-slate-300">{verifiedTicket.status}</b> ({verifiedTicket.reportedFault})
                </div>
                <button
                  onClick={() => {
                    setSelectedTicketForJobCard(verifiedTicket);
                    setIsJobCardModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold"
                >
                  Create Work Order for this Battery
                </button>
              </div>
            </div>
          )}

          {verificationFeedback && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
              {verificationFeedback}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------------
          SUBTAB 6: TECHNICAL INSPECTION
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-inspection' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Technical Diagnostic &amp; Inspection Bench</h3>
              <p className="text-[11px] text-slate-500">Internal resistance (IR), cell balance drift, BMS telemetry, and safety holds.</p>
            </div>
            <button
              onClick={() => setShowInspectionModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Log Inspection</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Ticket #</th>
                  <th className="p-3">Serial #</th>
                  <th className="p-3">Technician</th>
                  <th className="p-3">Tested Voltage</th>
                  <th className="p-3">Internal Resistance (IR)</th>
                  <th className="p-3">BMS Diagnostic</th>
                  <th className="p-3">Safety Hold</th>
                  <th className="p-3">Root Cause</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {technicalInspections.map((insp) => (
                  <tr key={insp.id}>
                    <td className="p-3 font-mono font-bold text-blue-600">{insp.ticketNumber}</td>
                    <td className="p-3 font-mono">{insp.serialNumber}</td>
                    <td className="p-3 font-medium">{insp.technicianName}</td>
                    <td className="p-3 font-mono font-bold">{insp.testedVoltage || insp.voltageReading || 51.2}V</td>
                    <td className="p-3 font-mono">{insp.testedInternalResistance || insp.internalResistance || 12.5} mΩ</td>
                    <td className="p-3 max-w-xs truncate">{insp.bmsDiagnosticResult || insp.findings || 'Normal telemetry'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        insp.isSafetyHold ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {insp.isSafetyHold ? 'Safety Hold' : 'Cleared'}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs truncate">{insp.rootCauseDescription || 'Balance drift under load'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          SUBTAB 7: REPAIR & PARTS REPLACEMENT
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-repair' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Repair Bench &amp; Work Orders</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cell rebalancing, BMS board replacement, busbar torque verification, and harness rewiring under Kushtia factory safety protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warrantyTickets.slice(0, 4).map((ticket) => {
              const currentStep = repairStepProgress[ticket.ticketNumber] || 2;
              const steps = [
                'Disassembly & Visual Cell Inspection',
                'Active Cell Balancer Hookup (Cell #4 Rebalance)',
                'BMS Firmware Flash & Param Calibration',
                'Busbar Terminal Torque Verification (8.5 Nm)',
                '48-Hour Full-Cycle Soak & Discharge Test',
              ];

              return (
                <div key={ticket.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-blue-600 block">{ticket.ticketNumber}</span>
                      <h4 className="font-bold text-slate-900 dark:text-white mt-0.5">{ticket.customerName}</h4>
                      <p className="text-[11px] text-slate-400">{ticket.batteryModel} ({ticket.serialNumber})</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Step {currentStep} of 5
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>Repair Progress</span>
                      <span>{currentStep * 20}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${currentStep * 20}%` }}
                      />
                    </div>
                  </div>

                  {/* Step list */}
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {steps.map((st, sIdx) => {
                      const isDone = sIdx < currentStep;
                      const isCurrent = sIdx === currentStep;
                      return (
                        <div key={sIdx} className="flex items-center gap-2 text-[11px]">
                          {isDone ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : isCurrent ? (
                            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                          )}
                          <span className={isDone ? 'line-through text-slate-400' : isCurrent ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-500'}>
                            {st}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setSelectedTicketForJobCard(ticket);
                        setIsPartsModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Issue Spare Parts
                    </button>
                    <button
                      onClick={() => {
                        setRepairStepProgress((prev) => ({
                          ...prev,
                          [ticket.ticketNumber]: Math.min(5, (prev[ticket.ticketNumber] || 2) + 1),
                        }));
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold flex items-center gap-1"
                    >
                      <span>Advance Next Step</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          SUBTAB 8: SPARE PARTS CONSUMPTION
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-parts-consumption' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Spare Parts Replacement Ledger</h3>
              <p className="text-[11px] text-slate-500">Bill of materials consumed during battery maintenance &amp; cell module replacements.</p>
            </div>
            <button
              onClick={() => {
                setSelectedJobCardForParts(null);
                setIsPartsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Spare Part</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Job Card #</th>
                  <th className="p-3">Component / Part</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Qty Replaced</th>
                  <th className="p-3">Unit Cost</th>
                  <th className="p-3">Total (BDT)</th>
                  <th className="p-3">Coverage Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sparePartsConsumptions.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-mono font-bold text-blue-600">{p.jobCardNumber}</td>
                    <td className="p-3 font-semibold">{p.partName} ({p.partCode})</td>
                    <td className="p-3">{p.componentCategory}</td>
                    <td className="p-3 font-mono">{p.replacementQty} {p.unit}</td>
                    <td className="p-3 font-mono">৳{p.unitCostBDT.toLocaleString()}</td>
                    <td className="p-3 font-mono font-bold">৳{p.totalCostBDT.toLocaleString()}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.warrantyCoverageStatus === 'Warranty Covered'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.warrantyCoverageStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          SUBTAB 9: REPAIR COST ESTIMATION
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-estimation' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Repair Cost Estimations &amp; Quotations</h3>
              <p className="text-[11px] text-slate-500">Estimates for third-party or out-of-warranty battery servicing pending customer approval.</p>
            </div>
            <button
              onClick={() => setShowEstimationModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create Repair Estimate</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Estimation #</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Estimated Total (BDT)</th>
                  <th className="p-3">Customer Approval</th>
                  <th className="p-3">Notes / Scope</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {serviceEstimations.map((est) => (
                  <tr key={est.id}>
                    <td className="p-3 font-mono font-bold text-blue-600">{est.estimationNumber}</td>
                    <td className="p-3 font-semibold">{est.customerName}</td>
                    <td className="p-3 font-mono font-bold text-emerald-600">৳{est.totalEstimatedAmountBDT.toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {est.customerApprovalStatus || 'Approved by Customer'}
                      </span>
                    </td>
                    <td className="p-3 max-w-sm truncate text-slate-500">{est.notes || 'Full cell balancing & BMS board change'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          updateServiceEstimation(est.id, { customerApprovalStatus: 'Approved by Customer' });
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100"
                      >
                        Approve Estimate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          SUBTAB 10: CUSTOMER BILLING & INVOICES
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-billing' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Service Invoices &amp; Collections</h3>
              <p className="text-[11px] text-slate-500">Paid battery servicing receipts, warranty absorbed costs, and outstanding receivables.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Ticket #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Customer Payable</th>
                  <th className="p-3">Warranty Absorbed</th>
                  <th className="p-3">Amount Paid</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Receipt Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {serviceInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="p-3 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                    <td className="p-3 font-mono">{inv.ticketNumber}</td>
                    <td className="p-3 font-medium">{inv.customerName}</td>
                    <td className="p-3 font-mono font-bold">৳{inv.totalInvoiceAmountBDT.toLocaleString()}</td>
                    <td className="p-3 font-mono text-slate-500">৳{inv.warrantyCoveredCostBDT.toLocaleString()}</td>
                    <td className="p-3 font-mono text-emerald-600 font-bold">৳{inv.amountPaidBDT.toLocaleString()}</td>
                    <td className="p-3 font-semibold">{inv.paymentStatus}</td>
                    <td className="p-3 text-right">
                      {inv.totalInvoiceAmountBDT > inv.amountPaidBDT && (
                        <button
                          onClick={() => {
                            addServicePayment({
                              receiptNumber: `REC-${Date.now().toString().slice(-4)}`,
                              invoiceId: inv.id,
                              invoiceNumber: inv.invoiceNumber,
                              ticketNumber: inv.ticketNumber,
                              customerName: inv.customerName,
                              amountBDT: inv.totalInvoiceAmountBDT - inv.amountPaidBDT,
                              paymentDate: new Date().toISOString(),
                              paymentMethod: 'Cash',
                            });
                          }}
                          className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold"
                        >
                          Collect ৳{(inv.totalInvoiceAmountBDT - inv.amountPaidBDT).toLocaleString()}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          SUBTAB 11: QUALITY CONTROL
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-qc' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Post-Repair Quality Control &amp; Safety Sign-off</h3>
              <p className="text-[11px] text-slate-500">100A sustained discharge testing, insulation test, CAN-bus BMS handshake verification.</p>
            </div>
            <button
              onClick={() => setShowQCModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Record QC Inspection</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">QC Certificate #</th>
                  <th className="p-3">Ticket #</th>
                  <th className="p-3">Inspector</th>
                  <th className="p-3">Open Circuit OCV</th>
                  <th className="p-3">IR (mΩ)</th>
                  <th className="p-3">Load Test &amp; Thermal</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {qualityControlRecords.map((qc) => (
                  <tr key={qc.id}>
                    <td className="p-3 font-mono font-bold text-purple-600">{qc.qcNumber}</td>
                    <td className="p-3 font-mono">{qc.ticketNumber}</td>
                    <td className="p-3 font-medium">{qc.qcInspector}</td>
                    <td className="p-3 font-mono font-bold">{qc.openCircuitVoltage || qc.testVoltage || 53.2}V</td>
                    <td className="p-3 font-mono">{qc.internalResistanceMilliOhm || 8.5} mΩ</td>
                    <td className="p-3 text-[11px] text-slate-500">{qc.thermalImagingStatus || 'Pass (Delta T < 4°C)'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        qc.result === 'QC Passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {qc.result}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{qc.notes || qc.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          SUBTAB 12: BATTERY DELIVERY & DISPATCH
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-dispatch' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Battery Delivery &amp; Gate Pass Dispatch</h3>
              <p className="text-[11px] text-slate-500">Courier waybill allocation, company logistics van dispatch, and customer handover.</p>
            </div>
            <button
              onClick={() => setShowDispatchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Gate Pass</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Gate Pass #</th>
                  <th className="p-3">Ticket #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Model &amp; Serial</th>
                  <th className="p-3">Transport Method</th>
                  <th className="p-3">Tracking / Waybill</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batteryDispatches.map((dsp) => (
                  <tr key={dsp.id}>
                    <td className="p-3 font-mono font-bold text-amber-600">{dsp.gatePassNumber}</td>
                    <td className="p-3 font-mono">{dsp.ticketNumber}</td>
                    <td className="p-3 font-medium">{dsp.customerName}</td>
                    <td className="p-3 font-mono">{dsp.serialNumber}</td>
                    <td className="p-3">{dsp.deliveryMethod} ({dsp.courierName})</td>
                    <td className="p-3 font-mono">{dsp.consignmentTrackingNumber}</td>
                    <td className="p-3">{dsp.dispatchDate}</td>
                    <td className="p-3 font-semibold text-emerald-600">{dsp.status || 'Dispatched'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          SUBTAB 13: WARRANTY POLICIES
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-policies' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Warranty Policies &amp; SLA Terms</h3>
              <p className="text-[11px] text-slate-500">Official product warranty schedules, replacement clauses, and coverage scopes.</p>
            </div>
            <button
              onClick={() => setShowPolicyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create Policy</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {warrantyPolicies.map((pol) => (
              <div key={pol.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{pol.policyName}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500">{pol.batteryCategory || pol.batteryType}</p>
                <div className="text-xs grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Duration</span>
                    <span className="font-bold">{pol.durationMonths || pol.warrantyMonths} Months</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Free Replacement</span>
                    <span className="font-bold">{pol.freeReplacementMonths || 12} Months</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-2 leading-relaxed">
                  {pol.termsAndConditions || pol.replacementTerms}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          SUBTAB 14: SERVICE HISTORY & LIFECYCLE AUDIT
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-history' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="max-w-xl">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-blue-500" />
                <span>End-to-End Battery Lifecycle &amp; Service History</span>
              </h3>
              <p className="text-xs text-slate-500">
                Inspect complete traceability from raw material batch assembly to field performance, RMA claim, repair bench, and final return.
              </p>
            </div>

            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="Filter by Serial..."
                value={historySearchSerial}
                onChange={(e) => setHistorySearchSerial(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
              />
            </div>
          </div>

          {/* Visual Vertical Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Traceability Audit Trail for {historySearchSerial}
            </h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {[
                { title: 'Manufacturing & QC Inward', date: '2025-04-12', detail: 'Factory cell grading, laser welding, and initial BMS firmware flash completed at Kushtia Plant Bay 2.' },
                { title: 'CID Primary Receipt & Warehouse Entry', date: '2025-04-16', detail: 'Stock inward recorded at Tejgaon Central Distribution Warehouse under consignment CID-2025-0104.' },
                { title: 'Sales Order Invoicing & Distributor Dispatch', date: '2025-05-02', detail: 'Delivered to Maharam Store (Mirpur) under sales order SO-9942.' },
                { title: 'Customer Warranty Registration', date: '2025-05-15', detail: 'Customer Solar Tech Solution registered 36-month warranty on Ensec portal.' },
                { title: 'Warranty Complaint Registered', date: '2026-10-02', detail: 'Customer reported cell balance drift and inverter communication timeout on LCD.' },
                { title: 'Kushtia Bay Physical Arrival', date: '2026-10-04', detail: 'Received via Sundarban Courier with measured voltage of 51.2V.' },
                { title: 'Technical Diagnostics & Active Balancing', date: '2026-10-06', detail: 'Cell #4 voltage recalibrated; firmware flashed to v2.4.1.' },
                { title: 'Post-Repair Quality Control Sign-Off', date: '2026-10-08', detail: '100A continuous load discharge test passed without thermal abnormality (QC Passed).' },
                { title: 'Delivery Handover & Gate Pass', date: '2026-10-10', detail: 'Issued gate pass GP-2026-0042 and dispatched back to customer.' },
              ].map((ev, eIdx) => (
                <div key={eIdx} className="relative group text-xs">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 ring-2 ring-blue-100 dark:ring-blue-950" />
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{ev.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({ev.date})</span>
                  </div>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">{ev.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          SUBTAB 15: REPORTS & ANALYTICS
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-reports' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-1">
              <span className="text-slate-400">Mean Time Between Failures (MTBF)</span>
              <span className="text-2xl font-bold font-mono text-emerald-600 block">48,200 Hrs</span>
              <span className="text-[10px] text-slate-500">Above industrial 45,000h benchmark</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-1">
              <span className="text-slate-400">Average Turnaround Time (TAT)</span>
              <span className="text-2xl font-bold font-mono text-blue-600 block">4.2 Days</span>
              <span className="text-[10px] text-slate-500">Target SLA: 7.0 Days</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-1">
              <span className="text-slate-400">First-Time Fix Rate (FTFR)</span>
              <span className="text-2xl font-bold font-mono text-purple-600 block">94.8%</span>
              <span className="text-[10px] text-slate-500">Zero repeated returns in 90 days</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-1">
              <span className="text-slate-400">Warranty Claim Ratio</span>
              <span className="text-2xl font-bold font-mono text-amber-600 block">0.82%</span>
              <span className="text-[10px] text-slate-500">Industry benchmark: &lt;1.5%</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Failure Root Cause Pareto Distribution</h3>
            <div className="space-y-3">
              {[
                { reason: 'Cell Voltage Balance Drift after deep solar cycle', pct: 45, color: 'bg-amber-500' },
                { reason: 'Inverter RS485 / CAN-bus Communication protocol mismatch', pct: 25, color: 'bg-blue-500' },
                { reason: 'High ambient temperature cutoff (thermal sensor protection)', pct: 15, color: 'bg-purple-500' },
                { reason: 'Loose terminal connection bolt causing contact resistance', pct: 10, color: 'bg-emerald-500' },
                { reason: 'Physical impact or courier handling during transport', pct: 5, color: 'bg-rose-500' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>{item.reason}</span>
                    <span className="font-mono">{item.pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          SUBTAB 16: SERVICE SETTINGS
      -------------------------------------------------------------------------- */}
      {activeTab === 'warranty-settings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5 text-xs max-w-3xl">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-500" />
              <span>Warranty &amp; Service Configuration</span>
            </h3>
            <p className="text-slate-500 mt-0.5">
              Manage authorized Kushtia factory technicians, QC certification inspectors, billing rates, and SLA notification rules.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* Technicians List */}
            <div className="space-y-2">
              <label className="block font-bold">Authorized Service Technicians</label>
              <div className="flex flex-wrap gap-2">
                {settingsTechList.map((tech, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                  >
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => setSettingsTechList(settingsTechList.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-md pt-1">
                <input
                  type="text"
                  placeholder="Add new technician..."
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTechName.trim()) {
                      setSettingsTechList([...settingsTechList, newTechName.trim()]);
                      setNewTechName('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* QC Inspectors List */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block font-bold">Certified QC Inspectors</label>
              <div className="flex flex-wrap gap-2">
                {settingsQCList.map((qc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold"
                  >
                    <span>{qc}</span>
                    <button
                      type="button"
                      onClick={() => setSettingsQCList(settingsQCList.filter((_, i) => i !== idx))}
                      className="text-purple-400 hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-md pt-1">
                <input
                  type="text"
                  placeholder="Add QC inspector..."
                  value={newQCName}
                  onChange={(e) => setNewQCName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newQCName.trim()) {
                      setSettingsQCList([...settingsQCList, newQCName.trim()]);
                      setNewQCName('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-semibold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Financial & SLA Rates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block font-semibold mb-1">Standard Hourly Labor Rate (BDT)</label>
                <input
                  type="number"
                  value={settingsLaborRate}
                  onChange={(e) => setSettingsLaborRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Service VAT Percentage (%)</label>
                <input
                  type="number"
                  value={settingsVat}
                  onChange={(e) => setSettingsVat(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Default SLA Target (Days)</label>
                <input
                  type="number"
                  value={settingsSlaDays}
                  onChange={(e) => setSettingsSlaDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            {settingsFeedback && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
                {settingsFeedback}
              </div>
            )}

            <div className="pt-3">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          GLOBAL MODALS
      ========================================================================== */}

      {/* Modal: Log New Ticket */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full space-y-4 border border-slate-200 dark:border-slate-800 text-xs shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Register Battery Warranty Complaint</h3>
              <button onClick={() => setShowCreateTicketModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Customer / Enterprise Name *</label>
                <input
                  type="text"
                  required
                  value={ticketCustomerName}
                  onChange={(e) => setTicketCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="e.g. Solar Tech Solution BD"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Phone *</label>
                  <input
                    type="text"
                    value={ticketCustomerPhone}
                    onChange={(e) => setTicketCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    placeholder="+880 1711..."
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Battery Serial Number *</label>
                  <input
                    type="text"
                    required
                    value={ticketSerialNumber}
                    onChange={(e) => setTicketSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    placeholder="ENS-48100-..."
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Battery Model / Spec</label>
                <input
                  type="text"
                  value={ticketBatteryModel}
                  onChange={(e) => setTicketBatteryModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Reported Fault Symptoms *</label>
                <textarea
                  rows={3}
                  value={ticketReportedFault}
                  onChange={(e) => setTicketReportedFault(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="e.g. Inverter communication failure, cell drift error, physical inspection..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTicketModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold"
                >
                  Save Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Battery Receiving */}
      {showReceivingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full space-y-4 border text-xs shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Factory Battery Receiving</h3>
              <button onClick={() => setShowReceivingModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateReceiving} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Select Claim Ticket *</label>
                <select
                  required
                  value={receivingTicketId}
                  onChange={(e) => setReceivingTicketId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
                >
                  <option value="">-- Choose Ticket --</option>
                  {warrantyTickets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.ticketNumber} — {t.customerName} ({t.serialNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Delivery / Transport Method</label>
                <input
                  type="text"
                  value={receivingDeliveryMethod}
                  onChange={(e) => setReceivingDeliveryMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Courier Tracking / Challan</label>
                <input
                  type="text"
                  value={receivingCourierTracking}
                  onChange={(e) => setReceivingCourierTracking(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Initial Measured Voltage (V)</label>
                <input
                  type="number"
                  step="0.1"
                  value={receivingInitialVoltage}
                  onChange={(e) => setReceivingInitialVoltage(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReceivingModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold"
                >
                  Save Arrival Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Technical Inspection */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full space-y-4 border text-xs shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Log Technical Inspection</h3>
              <button onClick={() => setShowInspectionModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateInspection} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Select Claim Ticket *</label>
                <select
                  required
                  value={inspectionTicketId}
                  onChange={(e) => setInspectionTicketId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
                >
                  <option value="">-- Choose Ticket --</option>
                  {warrantyTickets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.ticketNumber} — {t.customerName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Measured Voltage (V)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inspectionVoltage}
                    onChange={(e) => setInspectionVoltage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Internal Resistance (mΩ)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inspectionIR}
                    onChange={(e) => setInspectionIR(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Root Cause Description</label>
                <textarea
                  rows={2}
                  value={inspectionRootCause}
                  onChange={(e) => setInspectionRootCause(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold"
                >
                  Save Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: QC Sign-Off */}
      {showQCModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full space-y-4 border text-xs shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Post-Repair Quality Control Sign-off</h3>
              <button onClick={() => setShowQCModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateQC} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Ticket Number *</label>
                <select
                  required
                  value={qcTicketNumber}
                  onChange={(e) => setQcTicketNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
                >
                  <option value="">-- Choose Ticket --</option>
                  {warrantyTickets.map((t) => (
                    <option key={t.id} value={t.ticketNumber}>
                      {t.ticketNumber} — {t.customerName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Open Circuit Voltage (V)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={qcOCV}
                    onChange={(e) => setQcOCV(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Final Result</label>
                  <select
                    value={qcResult}
                    onChange={(e) => setQcResult(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="QC Passed">QC Passed</option>
                    <option value="QC Failed">QC Failed</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQCModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold"
                >
                  Record QC Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Dispatch Gate Pass */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full space-y-4 border text-xs shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Issue Battery Dispatch &amp; Gate Pass</h3>
              <button onClick={() => setShowDispatchModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateDispatch} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Select Ready Ticket *</label>
                <select
                  required
                  value={dispatchTicketId}
                  onChange={(e) => setDispatchTicketId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
                >
                  <option value="">-- Choose Ticket --</option>
                  {warrantyTickets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.ticketNumber} — {t.customerName} ({t.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Delivery Transport</label>
                <select
                  value={dispatchDeliveryMethod}
                  onChange={(e) => setDispatchDeliveryMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
                >
                  <option value="Courier">Courier Service (Sundarban / SA Paribahan)</option>
                  <option value="Customer Pickup">Direct Customer Pickup</option>
                  <option value="Company Transport">Company Covered Van</option>
                  <option value="Distributor Vehicle">Distributor Logistics Vehicle</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold"
                >
                  Generate Gate Pass &amp; Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Repair Cost Estimation */}
      {showEstimationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full space-y-4 border text-xs shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Create Repair Cost Estimate</h3>
              <button onClick={() => setShowEstimationModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateEstimation} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Select Claim Ticket *</label>
                <select
                  required
                  value={estimateTicketId}
                  onChange={(e) => setEstimateTicketId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
                >
                  <option value="">-- Choose Ticket --</option>
                  {warrantyTickets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.ticketNumber} — {t.customerName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Spare Parts Cost (BDT)</label>
                  <input
                    type="number"
                    value={estimatePartsCost}
                    onChange={(e) => setEstimatePartsCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Labor Cost (BDT)</label>
                  <input
                    type="number"
                    value={estimateLaborCost}
                    onChange={(e) => setEstimateLaborCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Scope / Repair Notes</label>
                <textarea
                  rows={2}
                  value={estimateNotes}
                  onChange={(e) => setEstimateNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEstimationModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold"
                >
                  Save Estimate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Policy */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full space-y-4 border text-xs shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Create New Warranty Policy</h3>
              <button onClick={() => setShowPolicyModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreatePolicy} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Policy Name *</label>
                <input
                  type="text"
                  required
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Battery Category / Chemistry</label>
                <input
                  type="text"
                  value={newPolicyCategory}
                  onChange={(e) => setNewPolicyCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Total Duration (Months)</label>
                  <input
                    type="number"
                    value={newPolicyDuration}
                    onChange={(e) => setNewPolicyDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Free Replace (Months)</label>
                  <input
                    type="number"
                    value={newPolicyFreeReplace}
                    onChange={(e) => setNewPolicyFreeReplace(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Terms &amp; Conditions</label>
                <textarea
                  rows={3}
                  value={newPolicyTerms}
                  onChange={(e) => setNewPolicyTerms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modals from WarrantyActionModals.tsx */}
      <JobCardModal
        isOpen={isJobCardModalOpen}
        onClose={() => setIsJobCardModalOpen(false)}
        ticket={selectedTicketForJobCard}
      />

      <SparePartsModal
        isOpen={isPartsModalOpen}
        onClose={() => setIsPartsModalOpen(false)}
        jobCard={selectedJobCardForParts}
      />

      <BillingModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        jobCard={selectedJobCardForBilling}
      />
    </div>
  );
};
