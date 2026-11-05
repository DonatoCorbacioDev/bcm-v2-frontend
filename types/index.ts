/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

// Core entity types matching backend DTOs
export interface User {
  id: number;
  username: string;
  managerId: number;
  role: string;
  roleId: number;
  verified: boolean;
  createdAt: string;
  canApproveContracts?: boolean;
  organizationName?: string | null;
  /** First name from the manager profile; sessions from before it was added lack it. */
  firstName?: string | null;
}

export interface Manager {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  department: string;
}

export interface Role {
  id: number;
  role: string;
}

export interface BusinessArea {
  id: number;
  name: string;
  description: string;
}

export type CounterpartyType = "CUSTOMER" | "SUPPLIER" | "BOTH";

export interface Counterparty {
  id: number;
  name: string;
  type: CounterpartyType;
  vatNumber?: string | null;
  taxCode?: string | null;
  /** Street and number; the rest of the address in the fields below. */
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  /** Province code, two letters ("MI"). */
  province?: string | null;
  /** ISO country code, two letters ("IT"). */
  country?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  /** Masked (e.g. "IT...3456") — never the full value. Null until learned/set. */
  verifiedIban?: string | null;
  verifiedBic?: string | null;
}

export interface CounterpartyInvoicingSummary {
  counterpartyId: number;
  counterpartyName: string;
  activeContracts: number;
  contractedValue: number;
  invoicedYtd: number;
  variancePercent: number;
  invoiceCount: number;
  lastInvoiceDate: string | null;
  /** Expected costs from January to this month (IVA esclusa). */
  expectedYtd: number;
  /** False for a customer: invoices issued to customers aren't in BCM, so there's nothing to compare. */
  comparable: boolean;
}

export interface OrganizationInvoicingSummary {
  year: number;
  expectedYtd: number;
  invoicedYtd: number;
  variance: number;
  variancePercent: number;
}

export type FinancialCategory = "REVENUE" | "COST";

export interface FinancialType {
  id: number;
  name: string;
  description: string;
  category: FinancialCategory;
}

export interface Budget {
  id: number;
  businessAreaId: number;
  areaName: string;
  category: FinancialCategory;
  year: number;
  targetAmount: number;
  actualAmount: number;
  percentUsed: number;
}

export type BillingFrequency = "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";

export interface Contract {
  id: number;
  counterpartyId: number;
  counterparty?: Counterparty;
  contractNumber: string;
  wbsCode: string;
  projectName: string;
  areaId: number;
  managerId: number;
  managerName: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "DRAFT";
  createdAt: string;
  manager?: Manager;
  area?: BusinessArea;
  daysUntilExpiry?: number;
  workflowStage?: "DRAFT" | "IN_REVIEW" | "APPROVED" | null;
  // Optional financial terms — when all three are set, the backend
  // auto-generates this contract's FinancialValue rows instead of requiring
  // them to be entered one at a time.
  financialTypeId?: number | null;
  annualValue?: number | null;
  billingFrequency?: BillingFrequency | null;
  // Tacit renewal terms, all optional (null = not stated). With a tacit
  // renewal the date that matters is noticeDeadline (endDate - noticeDays),
  // computed by the backend: miss it and the contract renews.
  autoRenew?: boolean | null;
  noticeDays?: number | null;
  renewalMonths?: number | null;
  noticeDeadline?: string | null;
  daysUntilNoticeDeadline?: number | null;
}

export interface ContractWorkflowEvent {
  id: number;
  fromStage: "DRAFT" | "IN_REVIEW" | "APPROVED" | null;
  toStage: "DRAFT" | "IN_REVIEW" | "APPROVED";
  action: "SUBMIT" | "APPROVE" | "REJECT";
  actorUsername: string;
  comment: string | null;
  createdAt: string;
}

export type FinancialValueSource = "MANUAL" | "GENERATED";

export interface FinancialValue {
  id: number;
  month: number;
  year: number;
  financialAmount: number;
  financialTypeId: number;
  businessAreaId: number;
  contractId: number;
  typeName?: string;
  areaName?: string;
  customerName?: string;
  category?: FinancialCategory;
  source?: FinancialValueSource;
}

export interface FinancialGenerationResult {
  created: number;
  regenerated: number;
  skippedManual: number;
  values: FinancialValue[];
}

export type InvoiceMatchStatus = "UNMATCHED" | "SUGGESTED" | "CONFIRMED" | "REJECTED" | "COUNTERPARTY_MISMATCH";

export interface InvoiceLineItem {
  lineNumber: number;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalPrice: number;
  vatRate: number;
}

export interface ElectronicInvoice {
  id: number;
  contractId: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  downloadUrl: string;
  supplierName: string;
  supplierVatNumber: string;
  documentType: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  currency: string;
  lineItems: InvoiceLineItem[];
  supplierIban: string | null;
  supplierBic: string | null;
  paymentDueDate: string | null;
  sepaBatchId: number | null;
  matchStatus: InvoiceMatchStatus;
  matchedFinancialValueId: number | null;
  matchConfidence: number | null;
  matchedAt: string | null;
  matchedByUsername: string | null;
  /** Imponibile (IVA esclusa): what contract amounts are compared with. Null for an invoice not re-read yet. */
  taxableAmount?: number | null;
  vatAmount?: number | null;
  /** The instalment the invoice is matched (or suggested) to. */
  expectedAmount?: number | null;
  /** taxableAmount - expectedAmount, to be checked by a person; null for a credit note or without a match. */
  amountDifference?: number | null;
  /** The invoice asks to be paid on an IBAN other than the supplier's verified one: SEPA is blocked. */
  ibanChanged?: boolean;
  /** FatturaPA ModalitaPagamento (MP05 bonifico, MP12 RiBa...); null or "" when not stated. See lib/paymentMethod. */
  paymentMethod?: string | null;
}

export interface ContractHistory {
  id: number;
  contractId: number;
  modifiedById: number | null;
  modificationDate: string;
  previousStatus: string;
  newStatus: string;
  // Display name of who made the change; null = no author (the scheduler,
  // or a user since deleted), shown as "Sistema".
  modifiedByName?: string | null;
}

export interface ContractImportRowError {
  rowNumber: number;
  message: string;
}

export interface ContractImportResult {
  totalRows: number;
  importedCount: number;
  errorCount: number;
  errors: ContractImportRowError[];
}

// Notifications
export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: "INFO" | "WARNING" | "ERROR";
}

// Forecasting (FastAPI on port 8000)
export interface ForecastPoint {
  month: string;
  amount: number;
  lower?: number;
  upper?: number;
}

export interface ForecastResponse {
  historical: ForecastPoint[];
  forecast: ForecastPoint[];
  reliable?: boolean;
}

// Narrative report from bcm-v2-ml's LLM agent (risk + forecast synthesis).
// riskScores/forecast are also in the payload but unused here — the other
// dashboard widgets already render that raw data; this type only covers
// what AgentInsightsWidget actually displays.
export interface AgentInsights {
  report: string | null;
  error: string | null;
}

// A write action the agent suggests but never performs itself — the user
// must explicitly confirm it (POST /notifications) before anything is created.
export interface ProposedAction {
  type: "CREATE_REMINDER";
  contractId: number;
  customerName: string;
  message: string;
}

// Response from POST /agent/ask (free-text question answered via tool-calling).
export interface AgentAnswer {
  answer: string | null;
  error: string | null;
  proposedAction: ProposedAction | null;
}

export interface SemanticSearchResult {
  contractId: number;
  contractNumber: string;
  customerName: string;
  documentId: number;
  fileName: string;
  score: number;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RiskScore {
  contractId: number;
  customerName: string;
  riskScore: number;
  level: RiskLevel;
  anomalies: string[];
  mlScore?: number;
  mlLevel?: RiskLevel;
}

export interface RiskFeedback {
  id: number;
  contractId: number;
  riskScore: number;
  riskLevel: RiskLevel;
  mlScore: number | null;
  mlLevel: RiskLevel | null;
  agree: boolean;
  createdAt: string;
}

export interface RiskFeedbackRequest {
  riskScore: number;
  level: RiskLevel;
  mlScore?: number;
  mlLevel?: RiskLevel;
  agree: boolean;
}

export interface ContractDocument {
  id: number;
  contractId: number;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  downloadUrl: string;
  versionGroupId?: number;
  versionNumber?: number;
  versionCount?: number;
}

export type DiffTag = "EQUAL" | "INSERT" | "DELETE" | "CHANGE";

export interface DiffLine {
  tag: DiffTag;
  oldText: string | null;
  newText: string | null;
}

export interface DocumentDiff {
  fromDocumentId: number;
  fromFileName: string;
  toDocumentId: number;
  toFileName: string;
  lines: DiffLine[];
}

/** A contract term read from a document by fixed rules, with the sentence it comes from. */
export interface ContractTerm {
  field: "AUTO_RENEW" | "NOTICE_DAYS" | "RENEWAL_MONTHS" | "START_DATE" | "END_DATE";
  /** "true"/"false", a number of days or months, or an ISO date. */
  value: string;
  /** How the text says it, e.g. "3 mesi" for 90 days. */
  asWritten: string;
  sentence: string;
}

export interface ContractTerms {
  documentId: number;
  terms: ContractTerm[];
}

export interface DocumentAnalysis {
  documentId: number;
  rawText: string;
  detectedCustomerName: string | null;
  detectedContractNumber: string | null;
  detectedStartDate: string | null;
  detectedEndDate: string | null;
  detectedAmount: string | null;
}

export interface RiskyClause {
  category: string;
  excerpt: string;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  reasoning: string;
}

export interface ClauseRiskAnalysis {
  clauses: RiskyClause[];
  error: string | null;
}

// Contract Templates
export interface ContractTemplate {
  id: number;
  name: string;
  description: string | null;
  defaultStatus: "ACTIVE" | "EXPIRED" | "CANCELLED" | "DRAFT" | null;
  defaultDurationDays: number | null;
  businessAreaId: number | null;
  defaultManagerId: number | null;
  autoRenew: boolean;
  notificationDays: number | null;
  createdAt: string;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// Dashboard Statistics
export interface ContractsByArea {
  areaName: string;
  count: number;
}

export interface ContractsTimeline {
  month: string;
  count: number;
}

export interface TopManager {
  managerId: number;
  managerName: string;
  contractsCount: number;
}

/** Kind of thing to do on the home page (see backend HomeAttentionDTO.Type). */
export type HomeAttentionType =
  | "NOTICE_DEADLINE"
  | "EXPIRY"
  | "RENEWAL_TO_CHECK"
  | "INVOICE_TO_MATCH"
  | "IBAN_CHANGED";

export interface HomeAttentionItem {
  type: HomeAttentionType;
  contractId: number;
  contractNumber: string;
  counterpartyName: string | null;
  projectName: string | null;
  /** The date that matters: notice deadline, end date or invoice date (YYYY-MM-DD). */
  dueDate: string | null;
  daysLeft: number | null;
  managerName: string | null;
  renewalMonths: number | null;
  invoiceId: number | null;
  invoiceNumber: string | null;
  invoiceAmount: number | null;
}

/** GET /home/attention: the list, most urgent first, and counters computed from it. */
export interface HomeAttention {
  dueSoonCount: number;
  invoicesToMatchCount: number;
  ibanAlertsCount: number;
  windowDays: number;
  items: HomeAttentionItem[];
}
