export interface WarrantyTicket {
  id: string;
  ticketNumber: string;
  ticketSeq?: string;
  customerName?: string;
  customerPhone?: string;
  ownershipType?: string;
  batteryBrand?: string;
  serialNumber?: string;
  modelName?: string;
  batteryModel?: string;
  customerEmail?: string;
  distributorName?: string;
  reportedFault?: string;
  urgency?: string;
  mobileNumber?: string;
  collectionPoint?: string;
  customerType?: string;
  address?: string;
  district?: string;
  dealerOrDistributorName?: string;
  batteryType?: string;
  capacityAh?: number;
  nominalVoltage?: number;
  complaintDate?: string;
  complaintReceivedBy?: string;
  complaintChannel?: string;
  reportedProblem?: string;
  problemCategory?: string;
  detailedDescription?: string;
  isBatteryCurrentlyWorking?: string;
  priorRepairsCount?: number;
  purchaseDate?: string;
  warrantyStatus?: string;
  issueDescription?: string;
  status: string;
  isReceivedAtFactory?: boolean;
  receivingId?: string;
  receivedDate?: string;
  receivingReceiptNumber?: string;
  inspectionId?: string;
  inspectedBy?: string;
  inspectionDate?: string;
  isSafetyHold?: boolean;
  safetyHoldReason?: string;
  jobCardId?: string;
  jobCardNumber?: string;
  warrantyDecision?: string;
  estimatedCostBDT?: number;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceTotalBDT?: number;
  amountPaidBDT?: number;
  paymentStatus?: string;
  qcStatus?: string;
  dispatchId?: string;
  dispatchDate?: string;
  deliveredBy?: string;
  deliveryDispatchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatteryReceivingRecord {
  id: string;
  ticketId?: string;
  ticketNumber?: string;
  receivingDate: string;
  receivingReceiptNumber: string;
  batteryBrand: string;
  serialNumber: string;
  customerName?: string;
  deliveryMethod?: string;
  courierTracking?: string;
  receivedBy?: string;
  physicalCondition?: string;
  notes?: string;
  batteryModel?: string;
  initialVoltage?: number;
}

export interface TechnicalInspection {
  id: string;
  ticketId?: string;
  ticketNumber?: string;
  serialNumber?: string;
  technicianName: string;
  inspectionDate: string;
  isSafetyHold: boolean;
  safetyHoldReason?: string;
  voltageReading?: number;
  testedVoltage?: number;
  internalResistance?: number;
  testedInternalResistance?: number;
  cellCondition?: string;
  bmsCondition?: string;
  bmsDiagnosticResult?: string;
  rootCauseDescription?: string;
  recommendedAction?: string;
  findings?: string;
}

export interface ServiceJobCard {
  id: string;
  ticketId?: string;
  ticketNumber?: string;
  customerName?: string;
  jobCardNumber: string;
  creationDate: string;
  assignedTechnician: string;
  repairPriority: string;
  warrantyDecision: string;
  status: string;
  estimatedCompletionDate?: string;
  expectedCompletionDate?: string;
  workDetails?: string;
}

export interface SparePartReplacement {
  id: string;
  jobCardNumber?: string;
  partCode: string;
  partName: string;
  replacementQty: number;
  unit: string;
  warrantyCoverageStatus?: string;
  componentCategory?: string;
  unitCostBDT: number;
  totalCostBDT: number;
}

export interface RepairEstimation {
  id: string;
  ticketId?: string;
  estimationNumber: string;
  customerName: string;
  totalEstimatedAmountBDT: number;
  customerApprovalStatus?: string;
  lineItems?: any[];
  notes?: string;
}

export interface ServiceInvoice {
  id: string;
  ticketId?: string;
  ticketNumber?: string;
  invoiceNumber: string;
  customerName: string;
  totalInvoiceAmountBDT: number;
  warrantyCoveredCostBDT: number;
  amountPaidBDT: number;
  outstandingAmountBDT: number;
  paymentStatus: string;
  invoiceDate?: string;
}

export interface ServicePayment {
  id: string;
  invoiceId?: string;
  invoiceNumber: string;
  ticketNumber?: string;
  receiptNumber: string;
  customerName: string;
  paymentDate: string;
  amountBDT: number;
  paymentMethod: string;
}

export interface QualityControlRecord {
  id: string;
  qcNumber: string;
  ticketNumber?: string;
  jobCardId?: string;
  qcInspector: string;
  result: 'QC Passed' | 'QC Failed' | string;
  inspectionDate?: string;
  testVoltage?: number;
  openCircuitVoltage?: number;
  testCapacityAh?: number;
  internalResistanceMilliOhm?: number;
  insulationResistanceMegaOhm?: number;
  thermalImagingStatus?: string;
  bmsCommunicationStatus?: string;
  notes?: string;
  remarks?: string;
}

export interface BatteryDeliveryDispatch {
  id: string;
  ticketId?: string;
  jobCardId?: string;
  ticketNumber?: string;
  customerName?: string;
  batteryBrand?: string;
  serialNumber?: string;
  deliveryDate?: string;
  deliveredBy?: string;
  deliveryMethod?: string;
  courierName?: string;
  consignmentTrackingNumber?: string;
  gatePassNumber?: string;
  dispatchDate?: string;
  dispatchChallanNumber?: string;
  courierOrVehicle?: string;
  recipientName?: string;
  recipientPhone?: string;
  destinationAddress?: string;
  status?: string;
}

export interface WarrantyPolicy {
  id: string;
  policyName: string;
  batteryType: string;
  batteryCategory?: string;
  durationMonths?: number;
  warrantyMonths: number;
  replacementTerms: string;
  termsAndConditions?: string;
  coveragePercentage: number;
  freeServiceMonths?: number;
  freeReplacementMonths?: number;
  status?: string;
}

export interface ServiceSettings {
  autoAssignJobCards: boolean;
  allowUnapprovedRepair: boolean;
  vatPercentage: number;
  defaultWarrantyMonths: number;
  factoryInchargeEmail: string;
  supportHotline: string;
  defaultTechnicians?: string[];
  qcInspectors?: string[];
}
