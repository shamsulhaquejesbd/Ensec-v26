import React, { useState, useMemo } from 'react';
import {
  FileSignature,
  PlusCircle,
  Search,
  Building2,
  Phone,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  MessageSquare,
  Send,
  Briefcase,
  TrendingUp,
  Tag,
  Filter,
  Check,
  ChevronRight,
  ShieldCheck,
  Package,
  Layers,
  FileCheck2,
  X,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { CRMLeadAgreement } from '../../types/erp.ts';

const STAGE_CONFIG: Record<
  CRMLeadAgreement['stage'],
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  Lead: {
    label: 'Lead',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  Contacted: {
    label: 'Contacted',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  'Proposal Sent': {
    label: 'Proposal Sent',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  'Agreement Signed': {
    label: 'Agreement Signed',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  Lost: {
    label: 'Lost / Closed',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
};

export const CRMAgreementsPage: React.FC = () => {
  const {
    crmAgreements,
    addCRMLead,
    addCRMCommunicationNote,
    updateCRMDealStage,
    deleteCRMDeal,
    products,
    currentUser,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('All');
  const [selectedDealId, setSelectedDealId] = useState<string>(crmAgreements[0]?.id || '');
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedQuickTag, setSelectedQuickTag] = useState('');

  // Form State for New Deal
  const [dealClientName, setDealClientName] = useState('');
  const [dealCompanyName, setDealCompanyName] = useState('');
  const [dealPhone, setDealPhone] = useState('');
  const [dealVolumeUnits, setDealVolumeUnits] = useState(100);
  const [dealEstValueBDT, setDealEstValueBDT] = useState(11500000);
  const [dealTermMonths, setDealTermMonths] = useState(12);
  const [dealStage, setDealStage] = useState<CRMLeadAgreement['stage']>('Lead');
  const [dealSalesperson, setDealSalesperson] = useState('Tanvir Hossain');
  const [initialNote, setInitialNote] = useState('');

  // Selected Deal
  const selectedDeal = useERP().crmAgreements.find((d) => d.id === selectedDealId) || crmAgreements[0] || null;

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return crmAgreements.filter((deal) => {
      const matchesSearch =
        deal.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.salespersonName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStage = selectedStageFilter === 'All' || deal.stage === selectedStageFilter;

      return matchesSearch && matchesStage;
    });
  }, [crmAgreements, searchTerm, selectedStageFilter]);

  // Aggregate Metrics
  const totalDeals = crmAgreements.length;
  const totalPipelineBDT = crmAgreements.reduce((sum, d) => sum + (d.estimatedValueBDT || 0), 0);
  const totalVolumeUnits = crmAgreements.reduce((sum, d) => sum + (d.expectedVolumeUnits || 0), 0);
  const signedDeals = crmAgreements.filter((d) => d.stage === 'Agreement Signed');
  const signedValueBDT = signedDeals.reduce((sum, d) => sum + (d.estimatedValueBDT || 0), 0);

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    const notes = initialNote.trim()
      ? [
          {
            date: new Date().toISOString().substring(0, 10),
            author: currentUser.name,
            note: initialNote.trim(),
          },
        ]
      : [
          {
            date: new Date().toISOString().substring(0, 10),
            author: currentUser.name,
            note: `Initial lead registered for ${dealCompanyName} with target volume of ${dealVolumeUnits} units.`,
          },
        ];

    addCRMLead({
      clientName: dealClientName,
      companyName: dealCompanyName,
      phone: dealPhone,
      stage: dealStage,
      expectedVolumeUnits: Number(dealVolumeUnits),
      estimatedValueBDT: Number(dealEstValueBDT),
      contractTermMonths: Number(dealTermMonths),
      salespersonId: currentUser.id,
      salespersonName: dealSalesperson,
      lastContactDate: new Date().toISOString().substring(0, 10),
      communicationNotes: notes,
    });

    setShowAddDealModal(false);
    // Reset Form
    setDealClientName('');
    setDealCompanyName('');
    setDealPhone('');
    setDealVolumeUnits(100);
    setDealEstValueBDT(11500000);
    setDealTermMonths(12);
    setDealStage('Lead');
    setInitialNote('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !newNoteText.trim()) return;
    const finalNote = selectedQuickTag ? `[${selectedQuickTag}] ${newNoteText.trim()}` : newNoteText.trim();
    addCRMCommunicationNote(selectedDeal.id, finalNote);
    setNewNoteText('');
    setSelectedQuickTag('');
  };

  const handleStageChange = (dealId: string, newStage: CRMLeadAgreement['stage']) => {
    updateCRMDealStage(dealId, newStage);
  };

  const handleDelete = (deal: CRMLeadAgreement) => {
    if (confirm(`Are you sure you want to delete CRM agreement "${deal.clientName}" (${deal.companyName})?`)) {
      deleteCRMDeal(deal.id);
      if (selectedDealId === deal.id) {
        const remaining = crmAgreements.filter((d) => d.id !== deal.id);
        setSelectedDealId(remaining[0]?.id || '');
      }
    }
  };

  const QUICK_TAGS = [
    'Price Negotiation',
    'Technical Specs',
    'Site Survey',
    'Proposal Sent',
    'SLA Finalized',
    'Signed Contract',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <span>Field Force & Sales</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">CRM Agreements</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              CRM Agreements & Corporate Contracts
            </h1>
            
          </div>
          
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddDealModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Agreement</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Deals Pipeline</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <FileSignature className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {totalDeals} <span className="text-xs font-normal text-slate-400">agreements</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{signedDeals.length} Signed</span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              {crmAgreements.filter((d) => d.stage === 'Proposal Sent').length} Proposals
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Pipeline Value</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2 font-mono">
            ৳ {(totalPipelineBDT / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            ৳ {(totalPipelineBDT / 100000).toFixed(1)} Lakh institutional value
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Contracted Volume</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
            {totalVolumeUnits.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">Units</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Lithium battery packs across telecom & micro-grids
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Signed Value Secured</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            ৳ {(signedValueBDT / 100000).toFixed(1)} Lakh
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {totalPipelineBDT > 0
              ? `${Math.round((signedValueBDT / totalPipelineBDT) * 100)}% contract conversion rate`
              : '0% conversion'}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client, company, phone, or salesperson..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Stage Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {['All', 'Lead', 'Contacted', 'Proposal Sent', 'Agreement Signed', 'Lost'].map((stg) => {
            const isSelected = selectedStageFilter === stg;
            return (
              <button
                key={stg}
                onClick={() => setSelectedStageFilter(stg)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {stg}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Deals Pipeline List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>Agreements List</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                {filteredDeals.length}
              </span>
            </h3>
            <span className="text-[11px] text-slate-400">Click to view details</span>
          </div>

          {filteredDeals.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <FileSignature className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs text-slate-500">No agreements matching filters</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStageFilter('All');
                }}
                className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
              {filteredDeals.map((deal) => {
                const isSelected = selectedDeal?.id === deal.id;
                const stageStyle = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.Lead;

                return (
                  <div
                    key={deal.id}
                    onClick={() => setSelectedDealId(deal.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${stageStyle.dot}`} />
                        {stageStyle.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {deal.lastContactDate}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {deal.clientName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{deal.companyName}</span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-sans">Volume Target</span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {deal.expectedVolumeUnits} Units
                        </span>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-sans">Agreement Value</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          ৳ {deal.estimatedValueBDT.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>👤 {deal.salespersonName}</span>
                      <span className="text-[10px] font-mono">{deal.contractTermMonths} Mo Term</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Agreement Dossier */}
        <div className="lg:col-span-7">
          {selectedDeal ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xs">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedDeal.clientName}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        STAGE_CONFIG[selectedDeal.stage]?.bg
                      } ${STAGE_CONFIG[selectedDeal.stage]?.text} ${STAGE_CONFIG[selectedDeal.stage]?.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${STAGE_CONFIG[selectedDeal.stage]?.dot}`} />
                      {selectedDeal.stage}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <span>🏢 {selectedDeal.companyName}</span>
                    <span>•</span>
                    <span>📞 {selectedDeal.phone}</span>
                    <span>•</span>
                    <span>👤 Salesman: {selectedDeal.salespersonName}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleDelete(selectedDeal)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 transition-colors"
                    title="Delete Agreement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stage Progress Bar / Quick Stage Switcher */}
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Update Agreement Pipeline Stage:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
                  {(['Lead', 'Contacted', 'Proposal Sent', 'Agreement Signed', 'Lost'] as CRMLeadAgreement['stage'][]).map(
                    (stg) => {
                      const isCurrent = selectedDeal.stage === stg;
                      return (
                        <button
                          key={stg}
                          onClick={() => handleStageChange(selectedDeal.id, stg)}
                          className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow-xs font-bold'
                              : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {isCurrent && <Check className="w-3 h-3" />}
                          <span>{stg}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Deal Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-sans">Agreement Value</span>
                  <span className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono">
                    ৳ {selectedDeal.estimatedValueBDT.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                    ≈ ৳ {(selectedDeal.estimatedValueBDT / 100000).toFixed(1)} Lakh
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-sans">Volume Target</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                    {selectedDeal.expectedVolumeUnits} Units
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Lithium Battery Packs</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-sans">Effective Rate / Unit</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ৳{' '}
                    {selectedDeal.expectedVolumeUnits > 0
                      ? Math.round(selectedDeal.estimatedValueBDT / selectedDeal.expectedVolumeUnits).toLocaleString()
                      : 0}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Contract negotiated</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-sans">Contract Term</span>
                  <span className="text-base font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {selectedDeal.contractTermMonths} Months
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">SLA supply duration</span>
                </div>
              </div>

              {/* Communication Timeline & Interaction History */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span>Communication Logs & Interaction Timeline</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {selectedDeal.communicationNotes.length} entries
                  </span>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {selectedDeal.communicationNotes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No notes logged yet.</p>
                  ) : (
                    selectedDeal.communicationNotes.map((note, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px]">
                              {note.author.slice(0, 1)}
                            </span>
                            <span>{note.author}</span>
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {note.date}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-7 whitespace-pre-wrap">
                          {note.note}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add New Communication Log Form */}
                <form
                  onSubmit={handleAddNote}
                  className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-slate-400">Quick Tags:</span>
                    {QUICK_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedQuickTag(selectedQuickTag === tag ? '' : tag)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${
                          selectedQuickTag === tag
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder={
                        selectedQuickTag
                          ? `[${selectedQuickTag}] Type meeting discussion, client technical requirement, or price agreed...`
                          : 'Type salesman visit discussion, battery specs requested, or agreement status...'
                      }
                      className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newNoteText.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Log Communication</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <FileSignature className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Select an agreement from the left to view dossier</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Agreement Lead */}
      {showAddDealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Register New CRM Agreement Lead
                </h3>
              </div>
              <button
                onClick={() => setShowAddDealModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Agreement Title / Contact Person <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Banglalink Tower Battery Bank Project"
                  value={dealClientName}
                  onChange={(e) => setDealClientName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Company / Organization <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VEON / Banglalink BD"
                    value={dealCompanyName}
                    onChange={(e) => setDealCompanyName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+880 1711-XXXXXX"
                    value={dealPhone}
                    onChange={(e) => setDealPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Expected Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dealVolumeUnits}
                    onChange={(e) => setDealVolumeUnits(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Estimated Value (BDT)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dealEstValueBDT}
                    onChange={(e) => setDealEstValueBDT(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Term (Months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dealTermMonths}
                    onChange={(e) => setDealTermMonths(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Initial Pipeline Stage
                  </label>
                  <select
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value as CRMLeadAgreement['stage'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Lead">Lead (Prospect Identified)</option>
                    <option value="Contacted">Contacted (Initial Pitch)</option>
                    <option value="Proposal Sent">Proposal Sent (Technical & Commercial)</option>
                    <option value="Agreement Signed">Agreement Signed (Contract Finalized)</option>
                    <option value="Lost">Lost / Archived</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Assigned Field Officer / Salesman
                  </label>
                  <input
                    type="text"
                    value={dealSalesperson}
                    onChange={(e) => setDealSalesperson(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Initial Scope / Technical Notes
                </label>
                <textarea
                  rows={2}
                  value={initialNote}
                  onChange={(e) => setInitialNote(e.target.value)}
                  placeholder="e.g. Requires 48V 100Ah lithium iron phosphate packs for telecom BTS towers with 5-year warranty..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDealModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Create Agreement Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
