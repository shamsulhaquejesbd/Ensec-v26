import React, { useState } from 'react';
import {
  Contact2,
  DollarSign,
  Briefcase,
  TrendingUp,
  Search,
  Plus,
  FileCheck,
  Building,
  Tag,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { CRMAgreementsPage } from './CRMAgreementsPage.tsx';

interface PricingTierCard {
  id: string;
  tierName: string;
  category: string;
  description: string;
  discountPercentage: number;
}

const DEFAULT_PRICING_TIERS: PricingTierCard[] = [
  {
    id: 'pt-1',
    tierName: 'Telecom Towers & Infrastructure',
    category: 'Corporate Enterprise',
    description: 'Bulk 48V LFP rack systems for BTS towers and telecom data centers',
    discountPercentage: 24,
  },
  {
    id: 'pt-2',
    tierName: 'Commercial Solar Mini-Grid',
    category: 'Renewable EPC',
    description: 'Utility-scale energy storage solutions with multi-year warranty',
    discountPercentage: 20,
  },
  {
    id: 'pt-3',
    tierName: 'Commercial EV Fleet',
    category: 'Mobility OEM',
    description: 'High-cycle 60V/72V swappable lithium battery packs for commercial 3-wheelers',
    discountPercentage: 18,
  },
  {
    id: 'pt-4',
    tierName: 'Authorized Division Distributor',
    category: 'Distribution Channel',
    description: 'Regional primary distributors with tiered quarterly volume rebate agreements',
    discountPercentage: 15,
  },
  {
    id: 'pt-5',
    tierName: 'Institutional & Government Tender',
    category: 'Institutional',
    description: 'Direct institutional purchase with custom delivery milestones and SLA',
    discountPercentage: 22,
  },
];

export interface CustomerCRMModuleProps {
  initialTab?: string;
}

export const CustomerCRMModule: React.FC<CustomerCRMModuleProps> = ({ initialTab = 'deals' }) => {
  const { customers, crmAgreements } = useERP();
  const pricingTiers = DEFAULT_PRICING_TIERS;
  const [activeTab, setActiveTab] = useState(initialTab === 'pricing' ? 'pricing' : 'deals');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <Contact2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Customer CRM & Key Accounts
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise telecommunications clients, solar mini-grid operators, commercial EV fleet accounts.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'deals'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Key Customers
          </button>
          <button
            onClick={() => setActiveTab('agreements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'agreements'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Agreements & Contracts
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'pricing'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Pricing Tiers
          </button>
        </div>
      </div>

      {activeTab === 'agreements' ? (
        <CRMAgreementsPage />
      ) : activeTab === 'pricing' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">{tier.tierName}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
                  {tier.category}
                </span>
              </div>
              <p className="text-xs text-slate-500">{tier.description}</p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
                <span className="text-slate-400">Discount from MRP</span>
                <span className="font-bold text-emerald-600">{tier.discountPercentage}% OFF</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Customer / Organization</th>
                  <th className="py-3 px-3">Segment</th>
                  <th className="py-3 px-3">Contact Person</th>
                  <th className="py-3 px-3">District</th>
                  <th className="py-3 px-3 text-right">Credit Limit</th>
                  <th className="py-3 px-3 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      <div>{c.name}</div>
                      <span className="text-[10px] text-slate-400">{c.code}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      <div>{c.proprietorName || c.name}</div>
                      <span className="text-[10px] text-slate-400">{c.phone}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{c.district}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ৳{c.creditLimitBDT?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ৳{c.outstandingBalanceBDT?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
