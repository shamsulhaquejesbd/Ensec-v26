export type Role =
  | 'Super Admin'
  | 'Sales Head'
  | 'Regional Manager'
  | 'Area Sales Manager'
  | 'Field Force'
  | 'Warehouse Manager'
  | 'Factory Manager'
  | 'Accounts / Finance'
  | 'Auditor'
  | 'Territory Sales Officer'
  | string;

export type PageModuleId =
  | 'dashboard'
  | 'basic-data'
  | 'procurement'
  | 'manufacturing'
  | 'stock'
  | 'inventory-stock'
  | 'warehouse'
  | 'requisition'
  | 'payment'
  | 'field-tracker'
  | 'mobile-field'
  | 'sales-orders'
  | 'sales-orders-registry'
  | 'crm-agreements'
  | 'customers-crm'
  | 'offers'
  | 'tada'
  | 'warranty'
  | 'finance-cashbook'
  | 'payroll'
  | 'reports'
  | 'users-permissions'
  | string;

export interface PageModuleDef {
  id: PageModuleId;
  name: string;
  category: string;
  description: string;
}

export const ALL_PAGE_MODULES: PageModuleDef[] = [
  {
    id: 'dashboard',
    name: 'Executive Dashboard',
    category: 'Analytics',
    description: 'Real-time revenue, inventory KPIs, battery health, and sales analytics',
  },
  {
    id: 'basic-data',
    name: 'Master Data Hub',
    category: 'Configuration',
    description: 'Products, raw materials, customer directories, banks, UOM, and branch data',
  },
  {
    id: 'procurement',
    name: 'Import Consignments & SCM',
    category: 'Supply Chain',
    description: 'China cell imports, LC tracking, landed cost calculation, and supplier POs',
  },
  {
    id: 'manufacturing',
    name: 'Factory Assembly & BOM',
    category: 'Production',
    description: 'Kushtia manufacturing plant, assembly batches, Bill of Materials, and cell testing',
  },
  {
    id: 'stock',
    name: 'Central Inventory (CID)',
    category: 'Inventory',
    description: 'CID receipts, stock transfers, adjustments, primary returns, and ledger entries',
  },
  {
    id: 'inventory-stock',
    name: 'Inventory Stock',
    category: 'Inventory',
    description: 'Current finished product stock warehouse-wise with Carton (CTN) and Piece (PCS) breakdown',
  },
  {
    id: 'warehouse',
    name: 'Multi-Warehouse Hubs',
    category: 'Logistics',
    description: 'Regional distribution hubs in Dhaka, Kushtia, Chattogram, and Bogura',
  },
  {
    id: 'requisition',
    name: 'Requisitions & Indent',
    category: 'Operations',
    description: 'Multi-stage approval workflow for warehouse indents and stock demands',
  },
  {
    id: 'payment',
    name: 'Collections & Payments',
    category: 'Finance',
    description: 'Distributor receipts, cheque clearances, aging analysis, and bank vouchers',
  },
  {
    id: 'field-tracker',
    name: 'Field Force GPS Tracker',
    category: 'Field Force',
    description: 'Live field telemetry, battery levels, geolocation pins, and beat adherence',
  },
  {
    id: 'mobile-field',
    name: 'Mobile Rep Sales Portal',
    category: 'Field Force',
    description: 'Order booking, retailer check-ins, instant invoices, and route planning',
  },
  {
    id: 'sales-orders',
    name: 'Sales Orders & Invoicing',
    category: 'Commercial',
    description: 'Direct sales order booking, POS checkout, and quick invoice generation',
  },
  {
    id: 'sales-orders-registry',
    name: 'Sales Orders Registry',
    category: 'Commercial',
    description: 'Master registry of sales orders, filter by order number, date, status, customer, and product',
  },
  {
    id: 'crm-agreements',
    name: 'CRM & Trade Agreements',
    category: 'Commercial',
    description: 'Special channel discount contracts, corporate leads, and enterprise agreements',
  },
  {
    id: 'tada',
    name: 'TADA Expense Claims',
    category: 'HR & Field',
    description: 'Field officer travel allowances, lodging, transport bills, and approvals',
  },
  {
    id: 'warranty',
    name: 'Warranty & Battery Service',
    category: 'Customer Care',
    description: 'Lithium battery diagnostics, BMS servicing, replacement claims, and QC',
  },
  {
    id: 'finance-cashbook',
    name: 'Cash Book & Banking',
    category: 'Finance',
    description: 'Multi-bank registers, factory petty cash, optimum JV reconciliations',
  },
  {
    id: 'payroll',
    name: 'Automated Payroll & HR',
    category: 'Human Resources',
    description: 'Staff payroll generation, field sales incentives, and Eastern Bank salary files',
  },
  {
    id: 'reports',
    name: 'Management Reports',
    category: 'Executive',
    description: 'Consolidated profit/loss, inventory aging, customer credit, and audit logs',
  },
  {
    id: 'users-permissions',
    name: 'Security & Access Control',
    category: 'Administration',
    description: 'Role-based access matrix, feature clearance, and user credential management',
  },
];

export interface FeaturePermissions {
  canCreateSalesOrder: boolean;
  canApproveSalesOrder: boolean;
  canDispatchAndInvoice: boolean;
  canManageChannelPricing: boolean;
  canSetSpecialAgreementPrice: boolean;
  canCreateImportOrder: boolean;
  canUpdateLandedCost: boolean;
  canCreateProductionOrder: boolean;
  canUpdateBOM: boolean;
  canSettleOptimumJV: boolean;
  canCreateStockTransfer: boolean;
  canApproveStockTransfer: boolean;
  canAdjustStock: boolean;
  canViewGPSTracker: boolean;
  canLogFieldVisits: boolean;
  canManageOffers: boolean;
  canRecordCashPayments: boolean;
  canProcessPayroll: boolean;
  canExportReports: boolean;
  canManageUsersAndPermissions: boolean;
}

export interface UserPermissions {
  allowedModules: PageModuleId[];
  features: FeaturePermissions;
}

export interface User {
  id: string;
  userId?: string;
  password?: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  designation?: string;
  department?: string;
  region?: string;
  area?: string;
  territory?: string;
  status?: 'Active' | 'Inactive' | 'Blocked';
  avatar?: string;
  isSalesman?: boolean;
  salesmanCode?: string;
  salesTargetBDT?: number;
  monthlySalesTargetBDT?: number;
  permissions?: UserPermissions;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrgNode {
  id: string;
  code: string;
  name: string;
  type: 'National' | 'Division' | 'Region' | 'Area' | 'Territory' | 'DB Point' | 'Market Hierarchy' | 'Beat' | string;
  parentCode?: string;
  parentId?: string;
  assignedManager?: string;
  headPerson?: string;
  phone?: string;
  notes?: string;
  children?: OrgNode[];
  taggedDistributorIds?: string[];
  taggedCustomerIds?: string[];
  taggedFieldForceIds?: string[];
}

export interface Supplier {
  id: string;
  code?: string;
  name?: string;
  country?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  category?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
  status?: string;
  balanceBDT?: number;
  materialsSupplied?: string[];
  rating?: number;
  [key: string]: any;
}

export interface RawMaterial {
  id: string;
  code?: string;
  name?: string;
  category?: string;
  unit?: string;
  stockKushtia?: number;
  reorderLevel?: number;
  standardCostBDT?: number;
  lastPurchaseUnitCostBDT?: number;
  hsCode?: string;
  preferredSupplier?: string;
  [key: string]: any;
}

export interface RawMaterialCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  status?: 'Active' | 'Inactive';
  itemCount?: number;
  parentClassification?: string;
}

export interface RawMaterialClassification {
  id: string;
  code: string;
  name: string;
  description?: string;
  status?: 'Active' | 'Inactive';
  colorTag?: string;
  categoryCount?: number;
}

export interface BOMItem {
  materialCode?: string;
  materialName: string;
  unit?: string;
  quantityPerUnit?: number;
  unitCostBDT?: number;
  requiredQty?: number;
  materialId?: string;
  [key: string]: any;
}

export interface Product {
  id: string;
  code?: string;
  name?: string;
  category?: string;
  brand?: string;
  model?: string;
  nominalVoltage?: string | number;
  capacityAh?: string | number;
  energyKWh?: number;
  chemistry?: string;
  warrantyMonths?: number;
  distributorPriceBDT?: number;
  dealerPriceBDT?: number;
  corporatePriceBDT?: number;
  projectPriceBDT?: number;
  retailPriceBDT?: number;
  customerPriceBDT?: number;
  minimumSellingPriceBDT?: number;
  assemblyCostEstimateBDT?: number;
  batteryType?: string;
  voltageV?: number | string;
  unit?: string;
  stockCID?: number;
  stockKushtiaPlant?: number;
  stockDhakaHubs?: number;
  pcsPerCarton?: number;
  bom?: BOMItem[];
  status?: string;
  categoryPrices?: Record<string, number>;
  // Battery Technical Specifications
  normalVoltage?: string;
  ratedCapacity?: string;
  cycleLife?: string;
  typicalCapacityKWh?: string;
  maxChargeCurrent?: string;
  standardCharging?: string;
  maxDischargeCurrent?: string;
  weightKg?: string;
  dimensionCm?: string;
  operatingTemperature?: string;
  mileageKm?: string;
  [key: string]: any;
}

export interface ProductCategory {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  status?: 'Active' | 'Inactive' | string;
  productCount?: number;
  [key: string]: any;
}

export interface ProductBrand {
  id: string;
  code?: string;
  name?: string;
  origin?: string;
  tagline?: string;
  status?: 'Active' | 'Inactive' | string;
  productCount?: number;
  categories?: string[];
  categoryTags?: string[];
  [key: string]: any;
}

export interface CustomerCategory {
  id: string;
  code?: string;
  name?: string;
  channel?: string;
  discountPercent?: number;
  discountPercentage?: number;
  priceMarkupPercentage?: number;
  targetAudience?: 'Both' | 'Customer' | 'Distributor' | string;
  description?: string;
  status?: 'Active' | 'Inactive' | string;
  [key: string]: any;
}

export interface Department {
  id: string;
  code?: string;
  name?: string;
  fullName?: string;
  headOfDepartment?: string;
  contactEmail?: string;
  email?: string;
  phone?: string;
  division?: string;
  location?: string;
  description?: string;
  memberCount?: number;
  createdAt?: string;
  status?: 'Active' | 'Inactive' | string;
  [key: string]: any;
}

export interface Bank {
  id: string;
  code?: string;
  name?: string;
  nativeName?: string;
  accountNumber?: string;
  accountNo?: string;
  branchName?: string;
  branch?: string;
  routingNumber?: string;
  accountType?: string;
  currentBalanceBDT?: number;
  isActive?: boolean;
  createdAt?: string;
  status?: string;
  [key: string]: any;
}

export type UOMApplicableTo = 'Raw Material' | 'Finished Product' | 'Finish Product' | 'Both' | 'All' | string;

export interface UnitOfMeasurement {
  id: string;
  code?: string;
  name?: string;
  nativeName?: string;
  symbol?: string;
  category?: string;
  applicableTo?: UOMApplicableTo;
  isBaseUnit?: boolean;
  allowDecimals?: boolean;
  decimalPlaces?: number;
  standardPackagingRate?: number;
  description?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface ProductionOrder {
  id: string;
  orderNumber?: string;
  productId?: string;
  productName?: string;
  model?: string;
  batchNumber?: string;
  plannedQty?: number;
  completedQty?: number;
  status?: 'Planned' | 'In Assembly' | 'Testing & QC' | 'Completed' | 'Transferred' | 'In Production' | string;
  startDate?: string;
  targetDate?: string;
  manufacturingDate?: string;
  date?: string;
  shiftManager?: string;
  notes?: string;
  rawMaterialCostBDT?: number;
  conversionCostBDT?: number;
  totalProductionCostBDT?: number;
  costPerUnitBDT?: number;
  wastagePercent?: number;
  scrapKg?: number;
  [key: string]: any;
}

export interface ImportPurchaseOrder {
  id: string;
  poNumber?: string;
  supplierId?: string;
  supplierName?: string;
  lcNumber?: string;
  commercialInvoiceNo?: string;
  blNumber?: string;
  orderDate?: string;
  date?: string;
  containerNumber?: string;
  shippingLine?: string;
  etaChittagongPort?: string;
  status?:
    | 'LC Opened'
    | 'Shipped from Shanghai'
    | 'Customs Clearance'
    | 'Delivered to Kushtia'
    | 'Submitted'
    | 'Received Kushtia'
    | 'Port Clearance'
    | string;
  fobUSD?: number;
  exchangeRateBDT?: number;
  customDutyTaxBDT?: number;
  clearingFreightBDT?: number;
  totalLandedCostBDT?: number;
  ensecShareCostBDT?: number;
  ensecSharePercent?: number;
  ensecContributionBDT?: number;
  optimumShareCostBDT?: number;
  optimumSharePercent?: number;
  optimumContributionBDT?: number;
  items?: Array<{
    materialCode?: string;
    materialName?: string;
    quantity?: number;
    unit?: string;
    unitPriceUSD?: number;
    totalUSD?: number;
    materialId?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface OptimumStatementEntry {
  id: string;
  date?: string;
  transactionType?:
    | 'Import Landed Cost 50%'
    | 'Kushtia Overhead 50%'
    | 'Settlement Payment'
    | 'Sales Profit Share'
    | string;
  type?: string;
  reference?: string;
  debitEnsecBDT?: number;
  creditOptimumBDT?: number;
  runningBalanceBDT?: number;
  debitBDT?: number;
  creditBDT?: number;
  balanceBDT?: number;
  notes?: string;
  description?: string;
  status?: string;
  [key: string]: any;
}

export interface Warehouse {
  id: string;
  code?: string;
  name?: string;
  location?: string;
  district?: string;
  inchargeName?: string;
  inchargePhone?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  description?: string;
  isFactoryPlant?: boolean;
  status?: 'Active' | 'Inactive' | string;
  type?: string;
  capacityPacks?: number;
  currentStockPacks?: number;
  capacityUnits?: number;
  currentStockUnits?: number;
  [key: string]: any;
}

export interface StockTransfer {
  id: string;
  transferNumber?: string;
  sourceWarehouseId?: string;
  fromWarehouseId?: string;
  sourceWarehouseName?: string;
  fromWarehouseName?: string;
  destWarehouseId?: string;
  toWarehouseId?: string;
  destWarehouseName?: string;
  toWarehouseName?: string;
  challanNo?: string;
  truckNumber?: string;
  driverName?: string;
  driverPhone?: string;
  transferDate?: string;
  date?: string;
  receivedDate?: string;
  requestedBy?: string;
  approvedBy?: string;
  status?: 'Pending Dispatch' | 'In Transit' | 'Received & Verified' | 'Received' | string;
  productId?: string;
  productName?: string;
  batchNumber?: string;
  quantity?: number;
  items?: Array<{
    productId?: string;
    productName?: string;
    quantity?: number;
    unitCostBDT?: number;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface StockLedgerEntry {
  id: string;
  date?: string;
  warehouseName?: string;
  warehouseId?: string;
  referenceDoc?: string;
  referenceNo?: string;
  transactionType?: string;
  productId?: string;
  productName?: string;
  inQty?: number;
  qtyIn?: number;
  outQty?: number;
  qtyOut?: number;
  balanceQty?: number;
  unitCostBDT?: number;
  totalCostBDT?: number;
  batchNumber?: string;
  remarks?: string;
  [key: string]: any;
}

export interface CIDStockReceiptItem {
  id?: string;
  productId?: string;
  productName?: string;
  batchNumber?: string;
  quantity?: number;
  receivedQty?: number;
  unitCostBDT?: number;
  totalCostBDT?: number;
  sku?: string;
  category?: string;
  serialRange?: string;
  rackLocation?: string;
  packageCondition?: string;
  lineRemarks?: string;
  [key: string]: any;
}

export interface CIDStockReceipt {
  id: string;
  receiptNumber?: string;
  mrrNumber?: string;
  date?: string;
  receiptDate?: string;
  sourceType?: string;
  sourceLocation?: string;
  warehouseId?: string;
  warehouseName?: string;
  challanNumber?: string;
  gatePassNumber?: string;
  truckNumber?: string;
  carrierVehicleNo?: string;
  driverName?: string;
  receivedBy?: string;
  qcInspector?: string;
  qcStatus?: string;
  status?: 'Pending Verification' | 'Verified & Posted' | 'Rejected' | 'Received & Stocked' | string;
  items?: CIDStockReceiptItem[];
  totalQty?: number;
  totalQuantity?: number;
  totalAmountBDT?: number;
  totalValueBDT?: number;
  remarks?: string;
  generalRemarks?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface OpeningStockRecord {
  id: string;
  warehouseId?: string;
  warehouseName?: string;
  productId?: string;
  productName?: string;
  batchNumber?: string;
  quantity?: number;
  unitCostBDT?: number;
  totalCostBDT?: number;
  totalValueBDT?: number;
  entryDate?: string;
  date?: string;
  enteredBy?: string;
  recordedBy?: string;
  sku?: string;
  category?: string;
  rackLocation?: string;
  remarks?: string;
  notes?: string;
  [key: string]: any;
}

export interface StockIssueRecord {
  id: string;
  issueNumber?: string;
  issueDate?: string;
  date?: string;
  warehouseId?: string;
  sourceWarehouseId?: string;
  warehouseName?: string;
  sourceWarehouseName?: string;
  issuedTo?: string;
  recipientName?: string;
  issueType?: string;
  gatePassNumber?: string;
  driverVehicle?: string;
  referenceNo?: string;
  reason?: string;
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitCostBDT?: number;
    batchNumber?: string;
    unitPriceBDT?: number;
    totalBDT?: number;
    sku?: string;
    [key: string]: any;
  }>;
  totalQuantity?: number;
  totalQty?: number;
  totalValueBDT?: number;
  status?: string;
  issuedBy?: string;
  [key: string]: any;
}

export interface PrimaryReturnRecord {
  id: string;
  returnNumber: string;
  returnDate?: string;
  date?: string;
  distributorId?: string;
  distributorName?: string;
  distributorOrPlant?: string;
  warehouseId?: string;
  warehouseName?: string;
  reason?: string;
  qcStatus?: string;
  sku?: string;
  receivedBy?: string;
  productId?: string;
  productName?: string;
  batchNumber?: string;
  quantity?: number;
  unitPriceBDT?: number;
  notes?: string;
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitCostBDT?: number;
    [key: string]: any;
  }>;
  totalQuantity?: number;
  totalValueBDT?: number;
  status?: string;
  [key: string]: any;
}

export interface StockAdjustmentRecord {
  id: string;
  referenceNo: string;
  adjustmentDate?: string;
  date?: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  sku?: string;
  batchNumber?: string;
  category?: string;
  adjustmentType?: string;
  previousQty: number;
  adjustmentQty?: number;
  qtyDelta?: number;
  newQty: number;
  unitCostBDT: number;
  totalCostVarianceBDT: number;
  reason: string;
  notes?: string;
  adjustedBy: string;
}

export interface Distributor {
  id: string;
  code: string;
  name: string;
  ownerName: string;
  phone: string;
  email?: string;
  district: string;
  region: string;
  territory?: string;
  dbPoint?: string;
  marketHierarchy?: string;
  departments?: string[];
  creditLimitBDT: number;
  currentOutstandingBDT: number;
  paymentTermsDays: number;
  openingBalanceBDT?: number;
  assignedRepId?: string;
  assignedRepName?: string;
  assignedSalespersonId?: string;
  assignedSalespersonName?: string;
  customerCategoryId?: string;
  customerCategoryName?: string;
  status: 'Active' | 'Blocked' | 'Review';
  address?: string;
  discontinueDate?: string;
}

export type PricingTier =
  | 'Distributor'
  | 'Dealer / Retailer Channel'
  | 'Corporate Direct'
  | 'Project EPC'
  | 'Consumer Retail'
  | string;

export interface Customer {
  id: string;
  code?: string;
  name?: string;
  phone?: string;
  email?: string;
  channel?: string;
  customerType?: string;
  pricingTier?: PricingTier | string;
  assignedDistributorId?: string;
  assignedDistributorName?: string;
  assignedRepId?: string;
  assignedRepName?: string;
  assignedSalespersonId?: string;
  assignedSalespersonName?: string;
  customerCategoryId?: string;
  customerCategoryName?: string;
  district?: string;
  territory?: string;
  address?: string;
  customProductPrices?: Record<string, number>;
  outstandingBalanceBDT?: number;
  creditLimitBDT?: number;
  status?: 'Active' | 'Inactive' | string;
  createdAt?: string;
  notes?: any[];
  communicationNotes?: any[];
  ownerName?: string;
  area?: string;
  market?: string;
  marketHierarchy?: string;
  [key: string]: any;
}

export interface CRMLeadAgreement {
  id: string;
  customerName?: string;
  clientName?: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  channel?: string;
  dealValueBDT?: number;
  estimatedValueBDT?: number;
  expectedVolumeUnits?: number;
  stage?:
    | 'Lead Identified'
    | 'Proposal & Sample'
    | 'Negotiation & Credit Check'
    | 'Agreement Executed'
    | 'Closed Lost'
    | string;
  assignedRepName?: string;
  salespersonName?: string;
  salespersonId?: string;
  expectedClosingDate?: string;
  lastContactDate?: string;
  contractTermMonths?: number;
  notes?: any[];
  communicationNotes?: any[];
  agreedSpecialDiscountPercent?: number;
  [key: string]: any;
}

export interface FieldForceRep {
  id: string;
  code?: string;
  pin?: string;
  nativeName?: string;
  employeeId?: string;
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  designation?: string;
  department?: string;
  region?: string;
  area?: string;
  territory?: string;
  marketHierarchy?: string;
  departments?: string[];
  assignedDistributorId?: string;
  assignedDistributorName?: string;
  distributorId?: string;
  distributorName?: string;
  distributors?: any[];
  parentCode?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  lastKnownAddress?: string;
  currentLocation?: any;
  batteryLevel?: number;
  isOnline?: boolean;
  isActive?: boolean;
  monthlyTargetBDT?: number;
  mtdAchievementBDT?: number;
  monthlyAchievedBDT?: number;
  todayVisitsCount?: number;
  productiveVisitsCount?: number;
  basicSalaryBDT?: number;
  conveyanceBDT?: number;
  taDaBDT?: number;
  mobileAllowanceBDT?: number;
  tadaApproverId?: string;
  tadaApproverName?: string;
  status?: 'Active' | 'On Leave' | 'Inactive' | string;
  joiningDate?: string;
  discontinueDate?: string;
  fieldForceType?: string;
  actionType?: string;
  invoiceWithinDays?: number;
  appPermissions?: string[];
  fieldForceTags?: string[];
  customerTags?: string[];
  [key: string]: any;
}

export interface VisitLog {
  id: string;
  repId: string;
  repName: string;
  customerId: string;
  customerName: string;
  timestamp?: string;
  date?: string;
  time?: string;
  latitude?: number;
  longitude?: number;
  visitType?: string;
  purpose?: string;
  isProductive?: boolean;
  checkInLocation?: string;
  notes?: string;
  feedback?: string;
  orderBookedAmountBDT?: number;
  orderPlacedBDT?: number;
}

export interface OfferPromotion {
  id: string;
  title?: string;
  code?: string;
  discountTitle?: string;
  discountNativeTitle?: string;
  discountFor?: string;
  department?: string;
  discountOn?: string;
  priority?: number;
  limitTimes?: number;
  discountLimitation?: string;
  excludeDiscountedItems?: boolean;
  includedProducts?: string[];
  excludedProducts?: string[];
  includeMarketHierarchy?: string[];
  excludeMarketHierarchy?: string[];
  eligibleFor?: string;
  when?: string;
  greaterThanOrEqualTo?: number;
  value?: number;
  provide?: string;
  provideBenefitType?: string;
  discount?: number;
  flatDiscountBDT?: number;
  discountPercentage?: number;
  allowDiscountFor?: string;
  applyInMultiples?: boolean;
  bannerImage?: string;
  freeProductQty?: number;
  freeProductId?: string;
  freeProductName?: string;
  discountType?: 'Percentage' | 'Fixed Amount' | 'Free Good (FOC)' | 'Tiered Slab' | string;
  discountValue?: number;
  minOrderValueBDT?: number;
  minQuantity?: number;
  applicableChannel?: string;
  startDate?: string;
  endDate?: string;
  validFrom?: string;
  validTo?: string;
  status?: 'Active' | 'Scheduled' | 'Expired' | string;
  isActive?: boolean;
  description?: string;
  applicableProducts?: string[];
  departments?: string[];
  marketHierarchies?: string[];
  createdAt?: string;
  [key: string]: any;
}

export interface SalesOrderItem {
  productId: string;
  productName: string;
  batchNumber?: string;
  quantity: number;
  unitPriceBDT: number;
  discountBDT?: number;
  lineTotalBDT?: number;
  serialNumbers?: string[];
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  date: string;
  channel: string;
  distributorId?: string;
  distributorName?: string;
  customerId: string;
  customerName: string;
  salespersonId: string;
  salespersonName: string;
  warehouseId: string;
  warehouseName: string;
  status:
    | 'Booked'
    | 'Submitted'
    | 'Approved'
    | 'Dispatched & Invoiced'
    | 'Dispatched'
    | 'Invoiced'
    | 'Delivered'
    | 'Cancelled'
    | string;
  subTotalBDT: number;
  discountBDT?: number;
  taxVatBDT: number;
  vatRatePercent?: number;
  netAmountBDT: number;
  paidAmountBDT: number;
  dueAmountBDT?: number;
  paymentStatus?: 'Unpaid' | 'Partially Paid' | 'Paid' | string;
  paymentMethod?: string;
  invoiceNumber?: string;
  invoiceNo?: string;
  doNumber?: string;
  poNumber?: string;
  challanNumber?: string;
  billNumber?: string;
  contactPerson?: string;
  deliveryAddressName?: string;
  deliveryAddress?: string;
  deliveryMobile?: string;
  buyerBin?: string;
  salespersonDesignation?: string;
  salespersonContact?: string;
  salespersonEmail?: string;
  receivedByCustomer?: boolean;
  customerReceivedAt?: string;
  customerReceiverName?: string;
  customerReceiverPhone?: string;
  customerReceiverNotes?: string;
  customerReceiptSignature?: string;
  deliveryStatus?: 'Pending Dispatch' | 'In Transit' | 'Received by Customer';
  deliveryHandoverBy?: string;
  appliedOfferCode?: string;
  offerSavingsBDT?: number;
  agingColor?: string;
  notes?: string;
  items: SalesOrderItem[];
}

export interface RequisitionItem {
  productId: string;
  productName?: string;
  requiredQty?: number;
  unitCostBDT?: number;
  approvedQty?: number;
  itemCode?: string;
  itemName?: string;
  unit?: string;
  price?: number;
  grossTotal?: number;
  requestedCtn?: number;
  requestedPcs?: number;
  approvedCtn?: number;
  approvedPcs?: number;
  vat?: number;
  netTotal?: number;
  currentStock?: number;
  suggestionQty?: number;
  targetQty?: number;
  freeQty?: number;
  discount?: number;
}

export type RequisitionStatus =
  | 'Pending Approval'
  | 'Approved by Factory'
  | 'Issued by Accounts'
  | 'Received at Warehouse'
  | 'Rejected'
  | 'Approved'
  | 'Requested'
  | string;

export interface Requisition {
  id: string;
  requisitionNo?: string;
  date?: string;
  requisitionDate?: string;
  requestedBy?: string;
  sourceWarehouseId?: string;
  sourceWarehouseName?: string;
  targetWarehouseId?: string;
  targetWarehouseName?: string;
  distributorId?: string;
  distributorName?: string;
  customerName?: string;
  fieldForceCode?: string;
  fieldForceName?: string;
  departmentId?: string;
  departmentName?: string;
  targetType?: string;
  items?: RequisitionItem[];
  totalQty?: number;
  status?: RequisitionStatus;
  notes?: string;
  depositNotes?: string;
  challanNo?: string;
  factoryNotes?: string;
  factoryReviewedBy?: string;
  accountsNotes?: string;
  receivedNotes?: string;
  vat?: number;
  lineDiscount?: number;
  subtotalDiscount?: number;
  discountTotal?: number;
  netTotal?: number;
  createdAt?: string;
  [key: string]: any;
}

export type PaymentStatus =
  | 'Draft'
  | 'Submitted'
  | 'Approved'
  | 'Rejected'
  | 'Created'
  | string;

export interface Payment {
  id: string;
  tranNo: string;
  tranDate?: string;
  salesOrderId?: string;
  distributorId?: string;
  distributorName?: string;
  customerId?: string;
  customerName?: string;
  requestedBy?: string;
  requestedById?: string;
  paymentMethod?: 'Cash' | 'Cheque' | 'Bank Transfer' | 'MFS (bKash/Nagad)' | string;
  paymentMode?: string;
  bankId?: string;
  bankName?: string;
  departmentId?: string;
  departmentName?: string;
  department?: string;
  outAccountName?: string;
  amountBDT?: number;
  paymentAmount?: number;
  approvedAmount?: number;
  instrumentNumber?: string;
  chequeNoReceiptNo?: string;
  invoiceNo?: string;
  paymentDate?: string;
  status: PaymentStatus;
  approvedBy?: string;
  approvedDate?: string;
  remarks?: string;
  description?: string;
  documentImage?: string;
  creationDate?: string;
  createdAt?: string;
}

export type TADAStatus =
  | 'Pending ASM Approval'
  | 'Approved by ASM'
  | 'Settled & Disbursed'
  | 'Rejected'
  | 'Pending_HOS_Approval'
  | string;

export interface TADAEntry {
  id: string;
  repId?: string;
  ffId?: string;
  repName?: string;
  ffCode?: string;
  ffName?: string;
  employeeId?: string;
  date?: string;
  tranDate?: string;
  fromLocation?: string;
  toLocation?: string;
  fromAddress?: string;
  toAddress?: string;
  distributorName?: string;
  routeName?: string;
  transportMode?: string;
  mode?: string;
  distance?: number;
  travelCostBDT?: number;
  dailyAllowanceBDT?: number;
  hotelCostBDT?: number;
  otherCostBDT?: number;
  amount?: number;
  totalAmountBDT?: number;
  status: TADAStatus;
  approverName?: string;
  approverId?: string;
  approvedAt?: string;
  rejectionReason?: string;
  remarks?: string;
  notes?: string;
  createdAt?: string;
  lastModified?: string;
}

export interface CashBookEntry {
  id: string;
  date: string;
  voucherNo: string;
  accountType: 'Eastern Bank PLC' | 'City Bank PLC' | 'Factory Cash' | 'Dhaka HQ Cash' | string;
  transactionCategory:
    | 'Customer Payment'
    | 'Raw Material Import LC'
    | 'Kushtia Factory Expense'
    | 'Payroll'
    | 'TADA'
    | 'Optimum JV Settlement'
    | string;
  description: string;
  reference: string;
  cashInBDT: number;
  cashOutBDT: number;
  runningBalanceBDT?: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department?: string;
  monthYear: string;
  basicSalaryBDT: number;
  houseRentBDT: number;
  medicalAllowanceBDT: number;
  salesCommissionBDT?: number;
  salesIncentiveBDT?: number;
  tadaReimbursementBDT?: number;
  taDaBDT?: number;
  conveyanceAllowanceBDT?: number;
  mobileAllowanceBDT?: number;
  deductionsBDT?: number;
  taxDeductionBDT?: number;
  providentFundBDT?: number;
  targetBDT?: number;
  achievementPercent?: number;
  achievementBDT?: number;
  netPayableBDT: number;
  status?: string;
  paymentStatus?: 'Pending Review' | 'Authorized' | 'Disbursed via Eastern Bank' | string;
  paymentDate?: string;
  disbursedDate?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
}

// Re-export WarrantyTicket for convenience
export type { WarrantyTicket } from './warranty.ts';

// Helper functions
export function getCustomerProductPricing(
  customer?: Partial<Customer> | null,
  product?: Partial<Product> | null
): {
  unitPrice: number;
  tierName: string;
  isCustomOverride: boolean;
  isSpecialNegotiated?: boolean;
  regularPrice: number;
  baseRetailPrice?: number;
  savingsBDT: number;
} {
  const defaultPrice = product?.retailPriceBDT || product?.customerPriceBDT || 100000;
  if (!product) {
    return {
      unitPrice: defaultPrice,
      tierName: 'Consumer Retail',
      isCustomOverride: false,
      isSpecialNegotiated: false,
      regularPrice: defaultPrice,
      baseRetailPrice: defaultPrice,
      savingsBDT: 0,
    };
  }

  // 1. Direct custom customer override
  if (customer?.customProductPrices && product.id && customer.customProductPrices[product.id]) {
    const overridePrice = customer.customProductPrices[product.id];
    return {
      unitPrice: overridePrice,
      tierName: 'Special Agreement Override',
      isCustomOverride: true,
      isSpecialNegotiated: true,
      regularPrice: defaultPrice,
      baseRetailPrice: defaultPrice,
      savingsBDT: Math.max(0, defaultPrice - overridePrice),
    };
  }

  // 2. Channel pricing tier
  const channel = customer?.pricingTier || customer?.channel || 'Distributor';
  let unitPrice = defaultPrice;
  let tierName = 'Consumer Retail';

  if (channel.toLowerCase().includes('distributor')) {
    unitPrice = product.distributorPriceBDT || defaultPrice * 0.85;
    tierName = 'Distributor Channel';
  } else if (
    channel.toLowerCase().includes('dealer') ||
    channel.toLowerCase().includes('retailer')
  ) {
    unitPrice =
      product.dealerPriceBDT ||
      (product.distributorPriceBDT ? product.distributorPriceBDT * 1.05 : defaultPrice * 0.9);
    tierName = 'Dealer / Retailer Channel';
  } else if (channel.toLowerCase().includes('corporate')) {
    unitPrice = product.corporatePriceBDT || defaultPrice * 0.92;
    tierName = 'Corporate Direct';
  } else if (channel.toLowerCase().includes('project') || channel.toLowerCase().includes('epc')) {
    unitPrice = product.projectPriceBDT || defaultPrice * 0.88;
    tierName = 'Project EPC';
  } else {
    unitPrice = product.retailPriceBDT || product.customerPriceBDT || defaultPrice;
    tierName = 'Consumer Retail';
  }

  return {
    unitPrice: Math.round(unitPrice),
    tierName,
    isCustomOverride: false,
    isSpecialNegotiated: false,
    regularPrice: defaultPrice,
    baseRetailPrice: defaultPrice,
    savingsBDT: Math.max(0, Math.round(defaultPrice - unitPrice)),
  };
}

export function getDefaultPermissionsForRole(role: Role): UserPermissions {
  if (role === 'Super Admin') {
    return {
      allowedModules: [
        'dashboard',
        'basic-data',
        'procurement',
        'manufacturing',
        'stock',
        'warehouse',
        'requisition',
        'payment',
        'field-tracker',
        'mobile-field',
        'sales-orders',
        'sales-orders-registry',
        'crm-agreements',
        'tada',
        'warranty',
        'finance-cashbook',
        'payroll',
        'reports',
        'users-permissions',
      ],
      features: {
        canCreateSalesOrder: true,
        canApproveSalesOrder: true,
        canDispatchAndInvoice: true,
        canManageChannelPricing: true,
        canSetSpecialAgreementPrice: true,
        canCreateImportOrder: true,
        canUpdateLandedCost: true,
        canCreateProductionOrder: true,
        canUpdateBOM: true,
        canSettleOptimumJV: true,
        canCreateStockTransfer: true,
        canApproveStockTransfer: true,
        canAdjustStock: true,
        canViewGPSTracker: true,
        canLogFieldVisits: true,
        canManageOffers: true,
        canRecordCashPayments: true,
        canProcessPayroll: true,
        canExportReports: true,
        canManageUsersAndPermissions: true,
      },
    };
  }

  if (
    role === 'Sales Head' ||
    role === 'Regional Manager' ||
    role === 'Area Sales Manager'
  ) {
    return {
      allowedModules: [
        'dashboard',
        'basic-data',
        'stock',
        'warehouse',
        'requisition',
        'payment',
        'field-tracker',
        'mobile-field',
        'sales-orders',
        'sales-orders-registry',
        'crm-agreements',
        'tada',
        'reports',
      ],
      features: {
        canCreateSalesOrder: true,
        canApproveSalesOrder: true,
        canDispatchAndInvoice: false,
        canManageChannelPricing: true,
        canSetSpecialAgreementPrice: true,
        canCreateImportOrder: false,
        canUpdateLandedCost: false,
        canCreateProductionOrder: false,
        canUpdateBOM: false,
        canSettleOptimumJV: false,
        canCreateStockTransfer: true,
        canApproveStockTransfer: false,
        canAdjustStock: false,
        canViewGPSTracker: true,
        canLogFieldVisits: true,
        canManageOffers: true,
        canRecordCashPayments: false,
        canProcessPayroll: false,
        canExportReports: true,
        canManageUsersAndPermissions: false,
      },
    };
  }

  if (role === 'Field Force' || role === 'Territory Sales Officer') {
    return {
      allowedModules: [
        'dashboard',
        'mobile-field',
        'sales-orders',
        'sales-orders-registry',
        'crm-agreements',
        'tada',
        'payment',
      ],
      features: {
        canCreateSalesOrder: true,
        canApproveSalesOrder: false,
        canDispatchAndInvoice: false,
        canManageChannelPricing: false,
        canSetSpecialAgreementPrice: false,
        canCreateImportOrder: false,
        canUpdateLandedCost: false,
        canCreateProductionOrder: false,
        canUpdateBOM: false,
        canSettleOptimumJV: false,
        canCreateStockTransfer: false,
        canApproveStockTransfer: false,
        canAdjustStock: false,
        canViewGPSTracker: false,
        canLogFieldVisits: true,
        canManageOffers: false,
        canRecordCashPayments: false,
        canProcessPayroll: false,
        canExportReports: false,
        canManageUsersAndPermissions: false,
      },
    };
  }

  if (role === 'Warehouse Manager') {
    return {
      allowedModules: [
        'dashboard',
        'stock',
        'warehouse',
        'requisition',
        'sales-orders',
        'sales-orders-registry',
        'reports',
      ],
      features: {
        canCreateSalesOrder: false,
        canApproveSalesOrder: false,
        canDispatchAndInvoice: true,
        canManageChannelPricing: false,
        canSetSpecialAgreementPrice: false,
        canCreateImportOrder: false,
        canUpdateLandedCost: false,
        canCreateProductionOrder: false,
        canUpdateBOM: false,
        canSettleOptimumJV: false,
        canCreateStockTransfer: true,
        canApproveStockTransfer: true,
        canAdjustStock: true,
        canViewGPSTracker: false,
        canLogFieldVisits: false,
        canManageOffers: false,
        canRecordCashPayments: false,
        canProcessPayroll: false,
        canExportReports: true,
        canManageUsersAndPermissions: false,
      },
    };
  }

  if (role === 'Factory Manager') {
    return {
      allowedModules: [
        'dashboard',
        'procurement',
        'manufacturing',
        'stock',
        'warehouse',
        'reports',
      ],
      features: {
        canCreateSalesOrder: false,
        canApproveSalesOrder: false,
        canDispatchAndInvoice: false,
        canManageChannelPricing: false,
        canSetSpecialAgreementPrice: false,
        canCreateImportOrder: true,
        canUpdateLandedCost: false,
        canCreateProductionOrder: true,
        canUpdateBOM: true,
        canSettleOptimumJV: false,
        canCreateStockTransfer: true,
        canApproveStockTransfer: true,
        canAdjustStock: true,
        canViewGPSTracker: false,
        canLogFieldVisits: false,
        canManageOffers: false,
        canRecordCashPayments: false,
        canProcessPayroll: false,
        canExportReports: true,
        canManageUsersAndPermissions: false,
      },
    };
  }

  // Accounts / Finance / Default
  return {
    allowedModules: [
      'dashboard',
      'payment',
      'requisition',
      'sales-orders',
        'sales-orders-registry',
      'finance-cashbook',
      'payroll',
      'tada',
      'reports',
    ],
    features: {
      canCreateSalesOrder: false,
      canApproveSalesOrder: false,
      canDispatchAndInvoice: false,
      canManageChannelPricing: false,
      canSetSpecialAgreementPrice: false,
      canCreateImportOrder: false,
      canUpdateLandedCost: true,
      canCreateProductionOrder: false,
      canUpdateBOM: false,
      canSettleOptimumJV: true,
      canCreateStockTransfer: false,
      canApproveStockTransfer: false,
      canAdjustStock: false,
      canViewGPSTracker: false,
      canLogFieldVisits: false,
      canManageOffers: false,
      canRecordCashPayments: true,
      canProcessPayroll: true,
      canExportReports: true,
      canManageUsersAndPermissions: false,
    },
  };
}

export function resolveUserPermissions(user?: Partial<User> | null, roleFallback?: Role): UserPermissions {
  const role = user?.role || roleFallback || 'Field Force';
  const fallback = getDefaultPermissionsForRole(role);
  if (!user || !user.permissions || typeof user.permissions !== 'object') {
    return fallback;
  }
  const rawPerms = user.permissions as Partial<UserPermissions>;
  const allowedModules = Array.isArray(rawPerms.allowedModules)
    ? rawPerms.allowedModules
    : fallback.allowedModules;
  const features =
    rawPerms.features && typeof rawPerms.features === 'object'
      ? { ...fallback.features, ...rawPerms.features }
      : fallback.features;
  return { allowedModules, features };
}

export function hasModulePermission(user: User, moduleId: PageModuleId): boolean {
  if (user.role === 'Super Admin') return true;
  const perms = resolveUserPermissions(user);
  return (perms.allowedModules || []).includes(moduleId);
}

export function hasFeaturePermission(
  user: User,
  featureKey: keyof FeaturePermissions
): boolean {
  if (user.role === 'Super Admin') return true;
  const perms = resolveUserPermissions(user);
  return Boolean(perms.features && perms.features[featureKey]);
}

