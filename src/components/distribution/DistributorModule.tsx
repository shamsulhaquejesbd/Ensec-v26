import React, { useState, useMemo, useEffect } from 'react';
import {
  Users2,
  Plus,
  Search,
  MapPin,
  Phone,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Check,
  Network,
  Tag,
  Filter,
  UserPlus,
  Store,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { Distributor, Customer } from '../../types/erp.ts';
import {
  getStoredMarketHierarchies,
  addStoredMarketHierarchy,
  extractHierarchiesFromOrgNode,
  MarketHierarchyItem,
  INITIAL_MARKET_HIERARCHIES,
} from '../../data/marketHierarchy.ts';

export interface DistributorModuleProps {
  onNavigate?: (module: string) => void;
}

const BANGLADESH_DISTRICTS = [
  'Dhaka',
  'Chittagong',
  'Kushtia',
  'Rajshahi',
  'Khulna',
  'Sylhet',
  'Rangpur',
  'Barisal',
  'Bogra',
  'Jessore',
  'Dinajpur',
  "Cox's Bazar",
  'Tangail',
  'Faridpur',
  'Pabna',
  'Noakhali',
  'Comilla',
  'Mymensingh',
  'Gazipur',
  'Narayanganj',
];

const DISTRICT_TO_REGION: Record<string, string> = {
  Dhaka: 'Dhaka Division',
  Gazipur: 'Dhaka Division',
  Narayanganj: 'Dhaka Division',
  Tangail: 'Dhaka Division',
  Faridpur: 'Dhaka Division',
  Chittagong: 'Chittagong Division',
  Comilla: 'Chittagong Division',
  Noakhali: 'Chittagong Division',
  "Cox's Bazar": 'Chittagong Division',
  Kushtia: 'Khulna Division',
  Khulna: 'Khulna Division',
  Jessore: 'Khulna Division',
  Rajshahi: 'Rajshahi Division',
  Bogra: 'Rajshahi Division',
  Pabna: 'Rajshahi Division',
  Rangpur: 'Rangpur Division',
  Dinajpur: 'Rangpur Division',
  Sylhet: 'Sylhet Division',
  Barisal: 'Barisal Division',
  Mymensingh: 'Mymensingh Division',
};

const BANGLADESH_DIVISIONS = [
  'Dhaka North',
  'Dhaka South',
  'Dhaka Division',
  'Chittagong',
  'Chittagong Division',
  'Khulna',
  'Khulna Division',
  'Rajshahi',
  'Rajshahi Division',
  'Sylhet',
  'Sylhet Division',
  'Rangpur',
  'Rangpur Division',
  'Barisal',
  'Barisal Division',
  'Mymensingh',
  'Mymensingh Division',
];

export const DistributorModule: React.FC<DistributorModuleProps> = ({ onNavigate }) => {
  const {
    distributors,
    addDistributor,
    updateDistributor,
    customers,
    addCustomer,
    updateCustomer,
    customerCategories,
    orgHierarchy,
  } = useERP();

  // Active sub-navigation tab
  const [activeTab, setActiveTab] = useState<'distributors' | 'customers'>('distributors');

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHierarchyFilter, setSelectedHierarchyFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedDistributorFilter, setSelectedDistributorFilter] = useState<string>('all');

  // Market hierarchy list with persistent storage
  const [storedHierarchies, setStoredHierarchies] = useState<MarketHierarchyItem[]>(() => getStoredMarketHierarchies());

  useEffect(() => {
    const handleHierarchyUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setStoredHierarchies(e.detail);
      } else {
        setStoredHierarchies(getStoredMarketHierarchies());
      }
    };
    window.addEventListener('ensec-market-hierarchy-updated', handleHierarchyUpdate);
    return () => window.removeEventListener('ensec-market-hierarchy-updated', handleHierarchyUpdate);
  }, []);

  // Merge stored market hierarchies with all relevant Org Hierarchy nodes (Territories, DB Points, Beats, Areas)
  const hierarchies = useMemo(() => {
    const map = new Map<string, MarketHierarchyItem>();
    storedHierarchies.forEach((h) => {
      if (h && h.fullName) {
        map.set(h.fullName.toLowerCase().trim(), h);
      }
    });
    const fromOrg = extractHierarchiesFromOrgNode(orgHierarchy);
    fromOrg.forEach((h) => {
      if (h && h.fullName && !map.has(h.fullName.toLowerCase().trim())) {
        map.set(h.fullName.toLowerCase().trim(), h);
      }
    });
    return Array.from(map.values());
  }, [storedHierarchies, orgHierarchy]);

  // UI feedback & toasts
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // MODAL 1: ADD NEW MARKET HIERARCHY
  // -------------------------------------------------------------
  const [showAddHierarchyModal, setShowAddHierarchyModal] = useState(false);
  const [newHierarchyCode, setNewHierarchyCode] = useState('');
  const [newHierarchyName, setNewHierarchyName] = useState('');
  const [newHierarchyRegion, setNewHierarchyRegion] = useState('Dhaka North');
  const [newHierarchyArea, setNewHierarchyArea] = useState('');
  const [hierarchyAssignDistributorId, setHierarchyAssignDistributorId] = useState('');
  const [hierarchyAssignCustomerId, setHierarchyAssignCustomerId] = useState('');
  const [hierarchyModalError, setHierarchyModalError] = useState<string | null>(null);

  const handleOpenAddHierarchy = (presetRegion?: string, presetArea?: string) => {
    const nextCode = `MH0${hierarchies.length + 1}`;
    setNewHierarchyCode(nextCode);
    setNewHierarchyName('');
    setNewHierarchyRegion(presetRegion || 'Dhaka North');
    setNewHierarchyArea(presetArea || '');
    setHierarchyAssignDistributorId('');
    setHierarchyAssignCustomerId('');
    setHierarchyModalError(null);
    setShowAddHierarchyModal(true);
  };

  const handleSaveMarketHierarchy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHierarchyCode.trim() || !newHierarchyName.trim()) {
      setHierarchyModalError('Please specify both Hierarchy Code and Beat / Area Name.');
      return;
    }

    const code = newHierarchyCode.trim().toUpperCase();
    const name = newHierarchyName.trim();
    const fullName = `${code} - ${name}`;

    const exists = hierarchies.some(
      (h) => h.code.toLowerCase() === code.toLowerCase() || h.fullName.toLowerCase() === fullName.toLowerCase()
    );
    if (exists) {
      setHierarchyModalError(`Market Hierarchy "${code}" or "${fullName}" already exists.`);
      return;
    }

    const newItem: MarketHierarchyItem = {
      code,
      name,
      fullName,
      region: newHierarchyRegion.trim(),
      area: newHierarchyArea.trim() || name,
    };

    const updated = addStoredMarketHierarchy(newItem);
    setStoredHierarchies(updated);

    if (showAddModal) {
      setMarketHierarchy(fullName);
    }

    // If a distributor was selected for immediate assignment
    if (hierarchyAssignDistributorId) {
      try {
        await updateDistributor(hierarchyAssignDistributorId, {
          marketHierarchy: fullName,
        });
      } catch (err) {
        console.warn('Failed assigning distributor to new hierarchy', err);
      }
    }

    // If a customer was selected for immediate assignment
    if (hierarchyAssignCustomerId) {
      try {
        await updateCustomer(hierarchyAssignCustomerId, {
          marketHierarchy: fullName,
        });
      } catch (err) {
        console.warn('Failed assigning customer to new hierarchy', err);
      }
    }

    showToast(`Market Hierarchy "${fullName}" created successfully!`, 'success');
    setShowAddHierarchyModal(false);
  };

  // -------------------------------------------------------------
  // MODAL 2: ONBOARD NEW DISTRIBUTOR
  // -------------------------------------------------------------
  const [showAddModal, setShowAddModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [region, setRegion] = useState('Dhaka Division');
  const [territory, setTerritory] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimitBDT, setCreditLimitBDT] = useState<number>(1000000);
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(30);
  const [openingBalanceBDT, setOpeningBalanceBDT] = useState<number>(0);
  const [status, setStatus] = useState<'Active' | 'Review' | 'Blocked'>('Active');
  const [marketHierarchy, setMarketHierarchy] = useState('');
  const [hierarchySearchTerm, setHierarchySearchTerm] = useState('');
  const [showHierarchyDropdown, setShowHierarchyDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleOpenAddModal = (presetHierarchy?: string) => {
    const list = distributors || [];
    const nextCode = `DIS-0${list.length + 1}`;
    setCode(nextCode);
    setName('');
    setOwnerName('');
    setPhone('');
    setEmail('');
    setDistrict('Dhaka');
    setRegion('Dhaka Division');
    setTerritory('');
    setAddress('');
    setCreditLimitBDT(1000000);
    setPaymentTermsDays(30);
    setOpeningBalanceBDT(0);
    setStatus('Active');
    setMarketHierarchy(presetHierarchy || (hierarchies[0]?.fullName || ''));
    setHierarchySearchTerm('');
    setShowHierarchyDropdown(false);
    setModalError(null);
    setShowAddModal(true);
  };

  const handleDistrictChange = (selectedDistrict: string) => {
    setDistrict(selectedDistrict);
    if (DISTRICT_TO_REGION[selectedDistrict]) {
      setRegion(DISTRICT_TO_REGION[selectedDistrict]);
    }
  };

  const handleSelectHierarchy = (h: MarketHierarchyItem) => {
    setMarketHierarchy(h.fullName);
    if (h.region) setRegion(h.region);
    if (h.area && !territory) setTerritory(h.area);
    setShowHierarchyDropdown(false);
  };

  const handleQuickAddHierarchy = (customName: string) => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    const existing = hierarchies.find(
      (h) =>
        h.fullName.toLowerCase() === trimmed.toLowerCase() ||
        h.name.toLowerCase() === trimmed.toLowerCase() ||
        h.code.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      handleSelectHierarchy(existing);
      return;
    }
    const nextCode = `MH0${hierarchies.length + 1}`;
    const code = trimmed.length <= 8 && !trimmed.includes(' ') ? trimmed.toUpperCase() : nextCode;
    const displayName = trimmed.includes('-') ? trimmed.split('-').slice(1).join('-').trim() : trimmed;
    const fullName = `${code} - ${displayName}`;
    const newItem: MarketHierarchyItem = {
      code,
      name: displayName,
      fullName,
      region: region || 'Dhaka Division',
      area: district || displayName,
    };
    const updated = addStoredMarketHierarchy(newItem);
    setStoredHierarchies(updated);
    setMarketHierarchy(fullName);
    setHierarchySearchTerm('');
    setShowHierarchyDropdown(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ownerName.trim() || !phone.trim() || !code.trim()) {
      setModalError('Please fill in all required fields (Name, Proprietor, Phone, Code).');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await addDistributor({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        district: district.trim(),
        region: region.trim(),
        territory: territory.trim() || undefined,
        address: address.trim() || undefined,
        marketHierarchy: marketHierarchy || undefined,
        paymentTermsDays: Number(paymentTermsDays) || 30,
        creditLimitBDT: Number(creditLimitBDT) || 0,
        openingBalanceBDT: Number(openingBalanceBDT) || 0,
        status: status,
      });

      if (res && res.error) {
        showToast(`Distributor registered (${res.error})`, 'warning');
      } else {
        showToast(`Distributor "${name.trim()}" onboarded with hierarchy "${marketHierarchy || 'None'}"!`, 'success');
      }

      setShowAddModal(false);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to onboard distributor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // MODAL 3: EDIT DISTRIBUTOR
  // -------------------------------------------------------------
  const [editingDistributor, setEditingDistributor] = useState<Distributor | null>(null);
  const [editName, setEditName] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDistrict, setEditDistrict] = useState('Dhaka');
  const [editRegion, setEditRegion] = useState('Dhaka Division');
  const [editTerritory, setEditTerritory] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editMarketHierarchy, setEditMarketHierarchy] = useState('');
  const [editCreditLimitBDT, setEditCreditLimitBDT] = useState<number>(1000000);
  const [editPaymentTermsDays, setEditPaymentTermsDays] = useState<number>(30);
  const [editStatus, setEditStatus] = useState<'Active' | 'Review' | 'Blocked'>('Active');
  const [editHierarchySearch, setEditHierarchySearch] = useState('');
  const [showEditHierarchyDropdown, setShowEditHierarchyDropdown] = useState(false);

  const handleOpenEditModal = (d: Distributor) => {
    setEditingDistributor(d);
    setEditName(d.name || '');
    setEditOwnerName(d.ownerName || '');
    setEditPhone(d.phone || '');
    setEditEmail(d.email || '');
    setEditDistrict(d.district || 'Dhaka');
    setEditRegion(d.region || 'Dhaka Division');
    setEditTerritory(d.territory || '');
    setEditAddress(d.address || '');
    setEditMarketHierarchy(d.marketHierarchy || '');
    setEditCreditLimitBDT(d.creditLimitBDT || 1000000);
    setEditPaymentTermsDays(d.paymentTermsDays || 30);
    setEditStatus((d.status as any) || 'Active');
    setEditHierarchySearch('');
    setShowEditHierarchyDropdown(false);
    setModalError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDistributor) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      await updateDistributor(editingDistributor.id, {
        name: editName.trim(),
        ownerName: editOwnerName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
        district: editDistrict.trim(),
        region: editRegion.trim(),
        territory: editTerritory.trim() || undefined,
        address: editAddress.trim() || undefined,
        marketHierarchy: editMarketHierarchy.trim() || undefined,
        creditLimitBDT: Number(editCreditLimitBDT) || 0,
        paymentTermsDays: Number(editPaymentTermsDays) || 30,
        status: editStatus,
      });

      showToast(`Distributor "${editName.trim()}" updated successfully!`, 'success');
      setEditingDistributor(null);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to update distributor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // MODAL 4: ADD CUSTOMER UNDER DISTRIBUTOR & MARKET HIERARCHY
  // -------------------------------------------------------------
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [custName, setCustName] = useState('');
  const [custOwnerName, setCustOwnerName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAssignedDistId, setCustAssignedDistId] = useState('');
  const [custMarketHierarchy, setCustMarketHierarchy] = useState('');
  const [custType, setCustType] = useState<string>('Retailer');
  const [custDistrict, setCustDistrict] = useState('Dhaka');
  const [custAddress, setCustAddress] = useState('');
  const [custCreditLimitBDT, setCustCreditLimitBDT] = useState<number>(200000);
  const [custCategoryId, setCustCategoryId] = useState('');
  const [custHierarchySearch, setCustHierarchySearch] = useState('');
  const [showCustHierarchyDropdown, setShowCustHierarchyDropdown] = useState(false);
  const [customerModalError, setCustomerModalError] = useState<string | null>(null);

  const handleOpenAddCustomer = (presetDistributorId?: string, presetHierarchy?: string) => {
    setCustName('');
    setCustOwnerName('');
    setCustPhone('');
    setCustEmail('');
    const targetDist = distributors.find((d) => d.id === presetDistributorId) || distributors[0];
    setCustAssignedDistId(targetDist?.id || '');
    setCustMarketHierarchy(presetHierarchy || targetDist?.marketHierarchy || hierarchies[0]?.fullName || '');
    setCustType('Retailer');
    setCustDistrict(targetDist?.district || 'Dhaka');
    setCustAddress('');
    setCustCreditLimitBDT(200000);
    setCustCategoryId(customerCategories[0]?.id || '');
    setCustHierarchySearch('');
    setShowCustHierarchyDropdown(false);
    setCustomerModalError(null);
    setShowAddCustomerModal(true);
  };

  const handleDistributorSelectForCustomer = (distId: string) => {
    setCustAssignedDistId(distId);
    const dist = distributors.find((d) => d.id === distId);
    if (dist) {
      if (dist.marketHierarchy) setCustMarketHierarchy(dist.marketHierarchy);
      if (dist.district) setCustDistrict(dist.district);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      setCustomerModalError('Please specify customer shop/enterprise name and mobile phone.');
      return;
    }

    const dist = distributors.find((d) => d.id === custAssignedDistId);
    const cat = customerCategories.find((c) => c.id === custCategoryId);
    const code = `CUST-${custType.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      const res = await addCustomer({
        code,
        name: custName.trim(),
        ownerName: custOwnerName.trim() || undefined,
        phone: custPhone.trim(),
        email: custEmail.trim() || undefined,
        channel: 'Distributor Sales',
        customerType: custType,
        district: custDistrict,
        address: custAddress.trim() || undefined,
        territory: custMarketHierarchy || `${custDistrict} Commercial`,
        marketHierarchy: custMarketHierarchy || undefined,
        creditLimitBDT: Number(custCreditLimitBDT) || 0,
        pricingTier: 'Dealer / Retailer Channel',
        customerCategoryId: cat ? cat.id : undefined,
        customerCategoryName: cat ? cat.name : undefined,
        assignedDistributorId: dist?.id,
        assignedDistributorName: dist?.name,
        status: 'Active',
      });

      if (res && res.error) {
        showToast(`Customer saved locally (${res.error})`, 'warning');
      } else {
        showToast(`Customer "${custName.trim()}" onboarded and synced to Supabase database!`, 'success');
      }
      setShowAddCustomerModal(false);
    } catch (err: any) {
      setCustomerModalError(err?.message || 'Failed to onboard customer');
    }
  };

  // -------------------------------------------------------------
  // MODAL 5: EDIT CUSTOMER MARKET HIERARCHY / PROFILE
  // -------------------------------------------------------------
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustDistId, setEditCustDistId] = useState('');
  const [editCustHierarchy, setEditCustHierarchy] = useState('');
  const [editCustType, setEditCustType] = useState('Retailer');
  const [editCustCreditLimit, setEditCustCreditLimit] = useState(0);
  const [editCustSearchHier, setEditCustSearchHier] = useState('');
  const [showEditCustHierDropdown, setShowEditCustHierDropdown] = useState(false);

  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setEditCustName(c.name || '');
    setEditCustPhone(c.phone || '');
    setEditCustDistId(c.assignedDistributorId || '');
    setEditCustHierarchy(c.marketHierarchy || '');
    setEditCustType(c.customerType || 'Retailer');
    setEditCustCreditLimit(c.creditLimitBDT || 0);
    setEditCustSearchHier('');
    setShowEditCustHierDropdown(false);
  };

  const handleUpdateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    const dist = distributors.find((d) => d.id === editCustDistId);
    try {
      await updateCustomer(editingCustomer.id, {
        name: editCustName.trim(),
        phone: editCustPhone.trim(),
        assignedDistributorId: dist ? dist.id : undefined,
        assignedDistributorName: dist ? dist.name : undefined,
        marketHierarchy: editCustHierarchy.trim() || undefined,
        customerType: editCustType,
        creditLimitBDT: Number(editCustCreditLimit) || 0,
      });

      showToast(`Customer "${editCustName.trim()}" updated successfully!`, 'success');
      setEditingCustomer(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update customer', 'error');
    }
  };

  // -------------------------------------------------------------
  // FILTERED DATA CALCULATION
  // -------------------------------------------------------------
  // Filtered Distributors
  const filteredDistributors = useMemo(() => {
    return distributors.filter((d) => {
      const matchSearch =
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.marketHierarchy?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchHierarchy =
        selectedHierarchyFilter === 'all' ||
        (selectedHierarchyFilter === 'unassigned' && !d.marketHierarchy) ||
        d.marketHierarchy === selectedHierarchyFilter;

      const matchStatus = selectedStatusFilter === 'all' || d.status === selectedStatusFilter;

      return matchSearch && matchHierarchy && matchStatus;
    });
  }, [distributors, searchTerm, selectedHierarchyFilter, selectedStatusFilter]);

  // Distribution Customers (filtered)
  const distributionCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Include if tagged as Distributor Sales OR assigned to a distributor OR has market hierarchy
      const isDistributionCust =
        c.channel === 'Distributor Sales' ||
        Boolean(c.assignedDistributorId) ||
        Boolean(c.assignedDistributorName);

      const matchSearch =
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.assignedDistributorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.marketHierarchy || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchDistributor =
        selectedDistributorFilter === 'all' || c.assignedDistributorId === selectedDistributorFilter;

      const matchHierarchy =
        selectedHierarchyFilter === 'all' ||
        (selectedHierarchyFilter === 'unassigned' && !c.marketHierarchy) ||
        c.marketHierarchy === selectedHierarchyFilter;

      return isDistributionCust && matchSearch && matchDistributor && matchHierarchy;
    });
  }, [customers, searchTerm, selectedDistributorFilter, selectedHierarchyFilter]);

  // Summary counts
  const totalExposure = distributors.reduce(
    (acc, d) => acc + (d.currentOutstandingBDT || d.openingBalanceBDT || 0),
    0
  );
  const totalLimits = distributors.reduce((acc, d) => acc + (d.creditLimitBDT || 0), 0);
  const totalDistCustomers = customers.filter(
    (c) => c.channel === 'Distributor Sales' || Boolean(c.assignedDistributorId)
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-3 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Distributor & Market Hierarchy Operations
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized regional dealers, commercial credit exposure, Market Hierarchy beats, and connected retail customers.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenAddCustomer()}
            className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>+ Add Customer</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Distributor</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Authorized Dealers</span>
            <Building className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {distributors.length}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">
            {distributors.filter((d) => d.status === 'Active').length} Active Dealers
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Distribution Customers</span>
            <Store className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalDistCustomers}
          </div>
          <div className="text-[10px] text-amber-600 font-medium mt-1">
            Shops, Dealers & Workshops
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Total Credit Limit</span>
            <CreditCard className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ৳{(totalLimits / 100000).toFixed(1)} <span className="text-sm font-semibold">Lac</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Exposure: ৳{(totalExposure / 100000).toFixed(1)} Lac
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('distributors')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'distributors'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Distributors & Dealers</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'distributors'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {distributors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'customers'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Distribution Customers</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'customers'
                ? 'bg-amber-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {totalDistCustomers}
          </span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: DISTRIBUTORS LISTING                                   */}
      {/* ============================================================= */}
      {activeTab === 'distributors' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search dealer, code, hierarchy, or proprietor..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Hierarchy Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedHierarchyFilter}
                  onChange={(e) => setSelectedHierarchyFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="all">All Market Hierarchies</option>
                  <option value="unassigned">Unassigned Only</option>
                  {hierarchies.map((h) => (
                    <option key={h.code} value={h.fullName}>
                      {h.fullName} ({h.region})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Review">Review</option>
                <option value="Blocked">Blocked</option>
              </select>

              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Dealer</span>
              </button>
            </div>
          </div>

          {/* Distributors Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Distributor Name</th>
                  <th className="py-3 px-3">Proprietor / Mobile</th>
                  <th className="py-3 px-3">Market Hierarchy Beat</th>
                  <th className="py-3 px-3">Territory & Region</th>
                  <th className="py-3 px-3 text-center">Customers</th>
                  <th className="py-3 px-3 text-right">Credit Limit</th>
                  <th className="py-3 px-3 text-right">Outstanding (BDT)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDistributors.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Building className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">No distributors match criteria</p>
                      <p className="text-[11px] mt-1">Onboard an authorized distributor or adjust active filters.</p>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenAddModal()}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Onboard Distributor Now</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDistributors.map((d) => {
                    const outstanding = d.currentOutstandingBDT || d.openingBalanceBDT || 0;
                    const isOverLimit = outstanding > (d.creditLimitBDT || 0);
                    const attachedCustomers = customers.filter(
                      (c) => c.assignedDistributorId === d.id || c.assignedDistributorName === d.name
                    );

                    return (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Name & Code */}
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          <div>{d.name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{d.code}</span>
                        </td>

                        {/* Proprietor & Phone */}
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          <div>{d.ownerName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{d.phone}</div>
                        </td>

                        {/* Market Hierarchy Option Badge */}
                        <td className="py-3 px-3">
                          {d.marketHierarchy ? (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 text-[11px] font-semibold">
                              <Network className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span>{d.marketHierarchy}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenEditModal(d)}
                              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Assign Hierarchy</span>
                            </button>
                          )}
                        </td>

                        {/* Territory & Region */}
                        <td className="py-3 px-3 text-slate-500">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {d.district}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {d.region || d.territory || 'National Territory'}
                          </div>
                        </td>

                        {/* Customer Count */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedDistributorFilter(d.id);
                              setActiveTab('customers');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-slate-700 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-300 text-[11px] font-bold cursor-pointer transition"
                            title="View connected customers"
                          >
                            <Store className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>{attachedCustomers.length} Shops</span>
                          </button>
                        </td>

                        {/* Credit Limit */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ৳{d.creditLimitBDT?.toLocaleString()}
                        </td>

                        {/* Outstanding */}
                        <td
                          className={`py-3 px-3 text-right font-mono font-bold ${
                            isOverLimit ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          ৳{outstanding.toLocaleString()}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : d.status === 'Review'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {d.status || 'Active'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenAddCustomer(d.id, d.marketHierarchy)}
                              title="Add Customer under this Distributor"
                              className="p-1.5 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 cursor-pointer"
                            >
                              <UserPlus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(d)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer inline-flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3 text-slate-400" />
                              <span>Edit</span>
                            </button>
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
      )}

      {/* ============================================================= */}
      {/* TAB 2: DISTRIBUTION CUSTOMERS & SHOPS                         */}
      {/* ============================================================= */}
      {activeTab === 'customers' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search shop name, mobile, dealer, hierarchy..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter by Distributor */}
              <select
                value={selectedDistributorFilter}
                onChange={(e) => setSelectedDistributorFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
              >
                <option value="all">All Assigned Dealers</option>
                {distributors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>

              {/* Filter by Hierarchy */}
              <select
                value={selectedHierarchyFilter}
                onChange={(e) => setSelectedHierarchyFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
              >
                <option value="all">All Market Hierarchies</option>
                {hierarchies.map((h) => (
                  <option key={h.code} value={h.fullName}>
                    {h.fullName}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleOpenAddCustomer()}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer ml-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Customer</span>
              </button>
            </div>
          </div>

          {/* Distribution Customers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Shop / Customer Name</th>
                  <th className="py-3 px-3">Proprietor / Mobile</th>
                  <th className="py-3 px-3">Assigned Distributor</th>
                  <th className="py-3 px-3">Market Hierarchy</th>
                  <th className="py-3 px-3">Customer Type</th>
                  <th className="py-3 px-3 text-right">Credit Limit</th>
                  <th className="py-3 px-3 text-right">Outstanding (BDT)</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {distributionCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Store className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No distribution retail customers found
                      </p>
                      <p className="text-[11px] mt-1">
                        Onboard shops and connect them to authorized dealers and market hierarchy beats.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenAddCustomer()}
                        className="mt-3 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Onboard First Customer</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  distributionCustomers.map((c) => {
                    const outstanding = c.outstandingBalanceBDT || 0;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        {/* Shop Name & Code */}
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          <div>{c.name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{c.code || 'CUST-AUTO'}</span>
                        </td>

                        {/* Proprietor & Contact */}
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          <div>{c.ownerName || 'Proprietor'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{c.phone}</div>
                        </td>

                        {/* Assigned Distributor */}
                        <td className="py-3 px-3">
                          {c.assignedDistributorName ? (
                            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <Building className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[150px]">{c.assignedDistributorName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Direct / Unassigned</span>
                          )}
                        </td>

                        {/* Market Hierarchy Option Badge */}
                        <td className="py-3 px-3">
                          {c.marketHierarchy ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-[11px] font-semibold">
                              <Network className="w-3 h-3 text-blue-600 shrink-0" />
                              <span className="truncate max-w-[180px]">{c.marketHierarchy}</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenEditCustomer(c)}
                              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Assign Beat</span>
                            </button>
                          )}
                        </td>

                        {/* Type & District */}
                        <td className="py-3 px-3 text-slate-500">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                            {c.customerType || 'Retailer'}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">{c.district || 'Dhaka'}</div>
                        </td>

                        {/* Credit Limit */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ৳{c.creditLimitBDT?.toLocaleString() || 0}
                        </td>

                        {/* Outstanding */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ৳{outstanding.toLocaleString()}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleOpenEditCustomer(c)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3 text-slate-400" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: ADD MARKET HIERARCHY BEAT                              */}
      {/* ============================================================= */}
      {showAddHierarchyModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setShowAddHierarchyModal(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Create Market Hierarchy Node
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add new commercial beat territory for distribution network & customer routing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddHierarchyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {hierarchyModalError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{hierarchyModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMarketHierarchy} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Hierarchy Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newHierarchyCode}
                    onChange={(e) => setNewHierarchyCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white uppercase"
                    placeholder="e.g. MEL036 or DHK01"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Short unique node code</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Beat / Market Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newHierarchyName}
                    onChange={(e) => setNewHierarchyName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    placeholder="e.g. Mirpur Section 10-11"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Recognizable market beat</span>
                </div>
              </div>

              {/* Full generated display preview */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Resulting Hierarchy String:</span>
                <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs mt-0.5">
                  {newHierarchyCode && newHierarchyName
                    ? `${newHierarchyCode.trim().toUpperCase()} - ${newHierarchyName.trim()}`
                    : 'Enter code & name above'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Administrative Region / Division *
                  </label>
                  <select
                    value={newHierarchyRegion}
                    onChange={(e) => setNewHierarchyRegion(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    {BANGLADESH_DIVISIONS.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Area / Thana Hub
                  </label>
                  <input
                    type="text"
                    value={newHierarchyArea}
                    onChange={(e) => setNewHierarchyArea(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. Mirpur or Dhanmondi"
                  />
                </div>
              </div>

              {/* Optional Quick Link to Existing Distributor or Customer */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>Attach Distribution & Customer to this Hierarchy (Optional)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Link Distributor Now
                    </label>
                    <select
                      value={hierarchyAssignDistributorId}
                      onChange={(e) => setHierarchyAssignDistributorId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    >
                      <option value="">-- No Distributor (Assign Later) --</option>
                      {distributors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Link Customer Now
                    </label>
                    <select
                      value={hierarchyAssignCustomerId}
                      onChange={(e) => setHierarchyAssignCustomerId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    >
                      <option value="">-- No Customer (Assign Later) --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code || c.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddHierarchyModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Market Hierarchy</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: ONBOARD NEW DISTRIBUTOR (WITH MARKET HIERARCHY OPTION) */}
      {/* ============================================================= */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Onboard New Distributor
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Register authorized regional dealer partner with Market Hierarchy beat & commercial credit line
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                      Distributor Code *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCode(`DIS-0${distributors.length + 1}`)}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-mono"
                    >
                      Auto
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white uppercase"
                    placeholder="e.g. DIS-01"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Account Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Active">Active (Authorized)</option>
                    <option value="Review">Review (Pending Compliance)</option>
                    <option value="Blocked">Blocked (Credit Hold)</option>
                  </select>
                </div>
              </div>

              {/* ENTERPRISE & PROPRIETOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Distributor Enterprise Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. M/S Green Power Electric Corp"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Proprietor / Owner Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. Haji Md. Abdur Rahman"
                  />
                </div>
              </div>

              {/* PHONE & EMAIL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Phone / Mobile *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. +880 1712-345678"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. greenpower.dist@gmail.com"
                  />
                </div>
              </div>

              {/* MARKET HIERARCHY SELECTOR WITH ADD OPTION */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 text-xs">
                      <Network className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Market Hierarchy Beat *</span>
                    </label>
                    <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                      {hierarchies.length} available
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAddHierarchy(region, district)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Hierarchy</span>
                  </button>
                </div>

                {/* Selected Hierarchy Badge or Helper Message */}
                {marketHierarchy ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-mono text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Tag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-bold truncate">{marketHierarchy}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMarketHierarchy('')}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 rounded transition-colors"
                      title="Clear selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-2 rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Please choose a market beat below or type any beat name to quick-create.</span>
                  </div>
                )}

                {/* Quick Pick Suggestions based on current District / Region */}
                {hierarchies.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Quick Pick:</span>
                    {hierarchies
                      .filter(
                        (h) =>
                          h.region.toLowerCase().includes((region || '').toLowerCase()) ||
                          h.area.toLowerCase().includes((district || '').toLowerCase()) ||
                          (district === 'Dhaka' && h.code.startsWith('DHK'))
                      )
                      .slice(0, 3)
                      .map((h) => (
                        <button
                          key={h.code}
                          type="button"
                          onClick={() => handleSelectHierarchy(h)}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-mono border transition-all cursor-pointer ${
                            marketHierarchy === h.fullName
                              ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
                          }`}
                        >
                          {h.code} ({h.name})
                        </button>
                      ))}
                  </div>
                )}

                {/* Search / Select Input */}
                <div className="relative">
                  <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search beat or type a new beat name (e.g. DHK-N01, Mirpur, Uttara)..."
                    value={hierarchySearchTerm}
                    onChange={(e) => {
                      setHierarchySearchTerm(e.target.value);
                      setShowHierarchyDropdown(true);
                    }}
                    onFocus={() => setShowHierarchyDropdown(true)}
                    className="w-full pl-8 pr-16 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    {hierarchySearchTerm && (
                      <button
                        type="button"
                        onClick={() => setHierarchySearchTerm('')}
                        className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowHierarchyDropdown(!showHierarchyDropdown)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      {showHierarchyDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Dropdown Options */}
                {showHierarchyDropdown && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 z-20 relative">
                    {/* Inline Quick Add button when typing custom beat */}
                    {hierarchySearchTerm.trim() && (
                      <div
                        onClick={() => handleQuickAddHierarchy(hierarchySearchTerm)}
                        className="p-2.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border-b border-blue-200 dark:border-blue-800 cursor-pointer flex items-center justify-between text-xs text-blue-900 dark:text-blue-200 font-semibold transition-colors"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Create & Tag &quot;{hierarchySearchTerm.trim()}&quot; as New Hierarchy</span>
                        </span>
                        <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-mono shrink-0">
                          Quick Add
                        </span>
                      </div>
                    )}

                    {(() => {
                      const filtered = hierarchies.filter(
                        (h) =>
                          !hierarchySearchTerm.trim() ||
                          h.fullName.toLowerCase().includes(hierarchySearchTerm.toLowerCase()) ||
                          h.region.toLowerCase().includes(hierarchySearchTerm.toLowerCase()) ||
                          h.code.toLowerCase().includes(hierarchySearchTerm.toLowerCase())
                      );

                      if (filtered.length === 0) {
                        return (
                          <div className="p-3 text-center text-xs space-y-2">
                            <p className="text-slate-500 dark:text-slate-400">
                              No market hierarchy beat found matching &quot;{hierarchySearchTerm}&quot;
                            </p>
                            <button
                              type="button"
                              onClick={() => handleQuickAddHierarchy(hierarchySearchTerm)}
                              className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 cursor-pointer text-xs flex items-center gap-1 mx-auto"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Create &quot;{hierarchySearchTerm}&quot; Now
                            </button>
                          </div>
                        );
                      }

                      return filtered.map((h) => {
                        const isSelected = marketHierarchy === h.fullName;
                        return (
                          <div
                            key={h.code}
                            onClick={() => handleSelectHierarchy(h)}
                            className={`p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                              isSelected ? 'bg-blue-50/80 dark:bg-blue-950/60 font-semibold' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                                {h.code}
                              </span>
                              <span className="text-slate-800 dark:text-slate-200">{h.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">{h.region}</span>
                              {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {/* Footer helper */}
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] gap-2 flex-wrap">
                      <span className="text-slate-500">Can&apos;t find your beat?</span>
                      <div className="flex items-center gap-2">
                        {onNavigate && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddModal(false);
                              onNavigate('basic-data-org-hierarchy');
                            }}
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                          >
                            + Manage in Org Hierarchy
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenAddHierarchy(region, district)}
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                        >
                          + Quick Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* DISTRICT & REGION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Operating District *
                  </label>
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    {BANGLADESH_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Administrative Region / Division
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. Dhaka Division"
                  />
                </div>
              </div>

              {/* TERRITORY & SHOP ADDRESS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Territory / DB Point
                  </label>
                  <input
                    type="text"
                    value={territory}
                    onChange={(e) => setTerritory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. Mirpur-10 Commercial Hub"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Trade Shop Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. Holding 45, Battery Market, Station Road"
                  />
                </div>
              </div>

              {/* COMMERCIAL CREDIT TERMS */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Commercial Credit Agreement & Limits</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Approved Credit Limit (BDT) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={50000}
                      value={creditLimitBDT}
                      onChange={(e) => setCreditLimitBDT(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      ৳{(creditLimitBDT / 100000).toFixed(1)} Lac
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Payment Terms (Days)
                    </label>
                    <select
                      value={paymentTermsDays}
                      onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      <option value={15}>15 Days</option>
                      <option value={30}>30 Days (Standard)</option>
                      <option value={45}>45 Days</option>
                      <option value={60}>60 Days</option>
                      <option value={90}>90 Days (Enterprise)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Opening Balance (BDT)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={openingBalanceBDT}
                      onChange={(e) => setOpeningBalanceBDT(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Initial Ledger Balance</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Onboarding...' : 'Onboard Distributor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: EDIT DISTRIBUTOR (WITH MARKET HIERARCHY SELECTOR)      */}
      {/* ============================================================= */}
      {editingDistributor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Edit Distributor Account
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Modify profile, Market Hierarchy assignment, or credit terms ({editingDistributor.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDistributor(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Distributor Enterprise Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Account Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Active">Active (Authorized)</option>
                    <option value="Review">Review (Pending Compliance)</option>
                    <option value="Blocked">Blocked (Credit Hold)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Proprietor / Owner Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editOwnerName}
                    onChange={(e) => setEditOwnerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* MARKET HIERARCHY SELECTOR IN EDIT MODAL */}
              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-blue-600" />
                    <span>Market Hierarchy Beat</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleOpenAddHierarchy(editRegion, editDistrict)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Hierarchy</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search or change market beat..."
                    value={editHierarchySearch}
                    onChange={(e) => {
                      setEditHierarchySearch(e.target.value);
                      setShowEditHierarchyDropdown(true);
                    }}
                    onFocus={() => setShowEditHierarchyDropdown(true)}
                    className="w-full pl-3 pr-10 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditHierarchyDropdown(!showEditHierarchyDropdown)}
                    className="absolute right-2.5 top-2 text-slate-400 cursor-pointer"
                  >
                    {showEditHierarchyDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {editMarketHierarchy && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-mono text-xs">
                    <span className="font-bold">{editMarketHierarchy}</span>
                    <button
                      type="button"
                      onClick={() => setEditMarketHierarchy('')}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {showEditHierarchyDropdown && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-xl max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 z-20 relative">
                    {hierarchies
                      .filter(
                        (h) =>
                          !editHierarchySearch.trim() ||
                          h.fullName.toLowerCase().includes(editHierarchySearch.toLowerCase())
                      )
                      .map((h) => (
                        <div
                          key={h.code}
                          onClick={() => {
                            setEditMarketHierarchy(h.fullName);
                            setShowEditHierarchyDropdown(false);
                          }}
                          className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold font-mono mr-2">{h.code}</span>
                            <span>{h.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{h.region}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* DISTRICT & REGION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    District
                  </label>
                  <select
                    value={editDistrict}
                    onChange={(e) => {
                      setEditDistrict(e.target.value);
                      if (DISTRICT_TO_REGION[e.target.value]) {
                        setEditRegion(DISTRICT_TO_REGION[e.target.value]);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    {BANGLADESH_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Region / Division
                  </label>
                  <input
                    type="text"
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* CREDIT TERMS */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Update Credit Terms</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Approved Credit Limit (BDT)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={50000}
                      value={editCreditLimitBDT}
                      onChange={(e) => setEditCreditLimitBDT(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      ৳{(editCreditLimitBDT / 100000).toFixed(1)} Lac
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Payment Terms (Days)
                    </label>
                    <select
                      value={editPaymentTermsDays}
                      onChange={(e) => setEditPaymentTermsDays(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      <option value={15}>15 Days</option>
                      <option value={30}>30 Days</option>
                      <option value={45}>45 Days</option>
                      <option value={60}>60 Days</option>
                      <option value={90}>90 Days</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDistributor(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Updating...' : 'Update Distributor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: ADD CUSTOMER UNDER DISTRIBUTOR & MARKET HIERARCHY      */}
      {/* ============================================================= */}
      {showAddCustomerModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setShowAddCustomerModal(false)}
        >
          <div
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Onboard Customer with Market Hierarchy
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Register a retail customer, dealer, or shop linked to an authorized distributor & market beat
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {customerModalError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{customerModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              {/* ASSIGNED DISTRIBUTOR SELECTION */}
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span>Assigned Authorized Distributor *</span>
                </label>
                <select
                  required
                  value={custAssignedDistId}
                  onChange={(e) => handleDistributorSelectForCustomer(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="">-- Select Distributor Partner --</option>
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code}) - {d.district} {d.marketHierarchy ? `• ${d.marketHierarchy}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* MARKET HIERARCHY SELECTOR WITH ADD OPTION */}
              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-blue-600" />
                    <span>Customer Market Hierarchy Beat *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleOpenAddHierarchy()}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Hierarchy</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search or pick market beat (e.g. MEL035, Mirpur, Uttara)..."
                    value={custHierarchySearch}
                    onChange={(e) => {
                      setCustHierarchySearch(e.target.value);
                      setShowCustHierarchyDropdown(true);
                    }}
                    onFocus={() => setShowCustHierarchyDropdown(true)}
                    className="w-full pl-3 pr-10 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustHierarchyDropdown(!showCustHierarchyDropdown)}
                    className="absolute right-2.5 top-2 text-slate-400 cursor-pointer"
                  >
                    {showCustHierarchyDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {custMarketHierarchy && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-mono text-xs">
                    <span className="font-bold">{custMarketHierarchy}</span>
                    <button
                      type="button"
                      onClick={() => setCustMarketHierarchy('')}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {showCustHierarchyDropdown && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-xl max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 z-20 relative">
                    {hierarchies
                      .filter(
                        (h) =>
                          !custHierarchySearch.trim() ||
                          h.fullName.toLowerCase().includes(custHierarchySearch.toLowerCase())
                      )
                      .map((h) => (
                        <div
                          key={h.code}
                          onClick={() => {
                            setCustMarketHierarchy(h.fullName);
                            setShowCustHierarchyDropdown(false);
                          }}
                          className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold font-mono mr-2">{h.code}</span>
                            <span>{h.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{h.region}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* CUSTOMER SHOP & PROPRIETOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Customer / Shop Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. Al-Madina Battery & Auto Electric"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Proprietor / Key Contact
                  </label>
                  <input
                    type="text"
                    value={custOwnerName}
                    onChange={(e) => setCustOwnerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. Md. Kamal Hossain"
                  />
                </div>
              </div>

              {/* PHONE & CUSTOMER TYPE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. +880 1819-234567"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Customer Channel Type
                  </label>
                  <select
                    value={custType}
                    onChange={(e) => setCustType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Retailer">Retailer (Battery Shop)</option>
                    <option value="Dealer">Sub-Dealer</option>
                    <option value="Workshop">Workshop / Garage</option>
                    <option value="Corporate Customer">Corporate / Commercial</option>
                    <option value="End Customer">End Customer</option>
                  </select>
                </div>
              </div>

              {/* DISTRICT & ADDRESS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    District
                  </label>
                  <select
                    value={custDistrict}
                    onChange={(e) => setCustDistrict(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {BANGLADESH_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Credit Limit (BDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={25000}
                    value={custCreditLimitBDT}
                    onChange={(e) => setCustCreditLimitBDT(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Shop Address / Location
                </label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. Shop 12, Haque Market, Main Road"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Onboard Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: EDIT CUSTOMER MARKET HIERARCHY / DISTRIBUTOR           */}
      {/* ============================================================= */}
      {editingCustomer && (
        <div
          className="fixed inset-0 z-[115] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setEditingCustomer(null)}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Edit Customer & Market Beat
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Re-assign distributor partner or Market Hierarchy beat
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCustomerSubmit} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Customer / Shop Name
                </label>
                <input
                  type="text"
                  required
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Assigned Distributor Partner
                </label>
                <select
                  value={editCustDistId}
                  onChange={(e) => setEditCustDistId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="">-- Direct Sales / No Distributor --</option>
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* MARKET HIERARCHY SELECTOR WITH ADD OPTION */}
              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-blue-600" />
                    <span>Market Hierarchy Beat</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleOpenAddHierarchy()}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Hierarchy</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search or pick market beat..."
                    value={editCustSearchHier}
                    onChange={(e) => {
                      setEditCustSearchHier(e.target.value);
                      setShowEditCustHierDropdown(true);
                    }}
                    onFocus={() => setShowEditCustHierDropdown(true)}
                    className="w-full pl-3 pr-10 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditCustHierDropdown(!showEditCustHierDropdown)}
                    className="absolute right-2.5 top-2 text-slate-400 cursor-pointer"
                  >
                    {showEditCustHierDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {editCustHierarchy && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-mono text-xs">
                    <span className="font-bold">{editCustHierarchy}</span>
                    <button
                      type="button"
                      onClick={() => setEditCustHierarchy('')}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {showEditCustHierDropdown && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-xl max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 z-20 relative">
                    {hierarchies
                      .filter(
                        (h) =>
                          !editCustSearchHier.trim() ||
                          h.fullName.toLowerCase().includes(editCustSearchHier.toLowerCase())
                      )
                      .map((h) => (
                        <div
                          key={h.code}
                          onClick={() => {
                            setEditCustHierarchy(h.fullName);
                            setShowEditCustHierDropdown(false);
                          }}
                          className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold font-mono mr-2">{h.code}</span>
                            <span>{h.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{h.region}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Customer Type
                  </label>
                  <select
                    value={editCustType}
                    onChange={(e) => setEditCustType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Retailer">Retailer</option>
                    <option value="Dealer">Dealer</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Corporate Customer">Corporate</option>
                    <option value="End Customer">End Customer</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Credit Limit (BDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={25000}
                    value={editCustCreditLimit}
                    onChange={(e) => setEditCustCreditLimit(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Update Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
