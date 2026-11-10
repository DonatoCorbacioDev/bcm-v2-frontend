import type { Page } from "@playwright/test";
import { uid } from "../../__tests__/mocks/ids";

/**
 * E2E accessibility tests run against `next dev` with no real backend, ML
 * service, or database — axe only cares about the rendered DOM, so every
 * API call the app makes is intercepted and fulfilled with fixture data
 * instead. Endpoint paths below must stay in sync with the `services/*`
 * files; there's no contract test tying the two together. Ids are UUIDs, as
 * the backend sends them (ADR-0009): uid(n) is a fixed, readable one.
 */

/** The contract the detail page tests open. */
export const CONTRACT_ID = uid(1);

const mockUser = {
  id: uid(1),
  username: "admin",
  managerId: uid(1),
  role: "ADMIN",
  roleId: uid(1),
  verified: true,
  createdAt: "2024-01-01T00:00:00Z",
};

/** Seeds localStorage with an authenticated session before any script runs. */
export async function mockAuthenticatedSession(page: Page) {
  await page.addInitScript((user) => {
    globalThis.localStorage.setItem(
      "auth-storage",
      JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 })
    );
  }, mockUser);
}

const businessAreas = [{ id: uid(1), name: "Engineering", description: "Eng" }];
const counterparties = [{ id: uid(1), name: "Acme Corp", type: "CUSTOMER" }];
const managers = [
  { id: uid(1), firstName: "John", lastName: "Doe", email: "john@example.com", phoneNumber: "+39 333 1234567", department: "IT" },
];
const financialTypes = [
  { id: uid(1), name: "Ricavi licenze", category: "REVENUE" },
  { id: uid(2), name: "Costi hosting", category: "COST" },
];
const budgets = [
  { id: uid(1), areaId: uid(1), areaName: "Engineering", financialTypeId: uid(1), financialTypeName: "Ricavi licenze", category: "REVENUE", year: 2024, targetAmount: 100000, actualAmount: 45000, percentUsed: 45 },
];
const financialValues = [
  {
    id: uid(1),
    month: 3,
    // The financial-values page defaults its year filter to the current
    // year, so a hardcoded year would silently filter this fixture out
    // and hide the table from axe instead of exercising it.
    year: new Date().getFullYear(),
    financialAmount: 15000,
    financialTypeId: uid(1),
    businessAreaId: uid(1),
    contractId: uid(1),
    typeName: "Ricavi licenze",
    areaName: "Engineering",
    customerName: "Acme Corp",
    category: "REVENUE",
  },
];
const contractTemplates = [
  { id: uid(1), name: "Manutenzione IT annuale", description: "Template standard", defaultDurationMonths: 12 },
];
const users = [
  { id: uid(1), username: "admin", role: "ADMIN", roleId: uid(1), verified: true, managerId: uid(1), managerName: "John Doe" },
];
const auditLogs = {
  content: [
    { id: uid(1), action: "CREATE", entityType: "Contract", entityId: uid(1), username: "admin", orgId: uid(1), timestamp: "2024-03-01T10:00:00Z", details: null },
  ],
  totalPages: 1,
  totalElements: 1,
  number: 0,
  size: 20,
};

const sampleContract = {
  id: uid(1),
  counterpartyId: uid(1),
  counterparty: counterparties[0],
  contractNumber: "CNT-2024-001",
  wbsCode: "WBS-001",
  projectName: "Digital Transformation",
  areaId: uid(1),
  managerId: uid(1),
  managerName: "John Doe",
  startDate: "2024-01-01",
  endDate: "2099-12-31",
  status: "ACTIVE",
  createdAt: "2024-01-01T00:00:00Z",
  daysUntilExpiry: 20,
};

const expiringContract = { ...sampleContract, id: uid(2), contractNumber: "CNT-2024-002", daysUntilExpiry: 5 };

/**
 * Mocks every endpoint the authenticated dashboard layout, dashboard page,
 * and contracts page can call, with `overrides` layered on top for
 * test-specific routes (e.g. an empty state).
 */
/** The home page's to-do list: one item of each kind, as the demo shows them. */
const homeAttention = {
  dueSoonCount: 3,
  invoicesToMatchCount: 1,
  ibanAlertsCount: 1,
  windowDays: 30,
  items: [
    { type: "IBAN_CHANGED", contractId: uid(8), contractNumber: "NRT-2025-008", counterpartyName: "Ferri & Associati S.r.l.",
      projectName: "Consulenza fiscale e societaria", dueDate: "2026-11-01", daysLeft: -3, managerName: "Marco Bellini",
      renewalMonths: null, invoiceId: uid(31), invoiceNumber: "FA-2026-11", invoiceAmount: 7930 },
    { type: "EXPIRY", contractId: uid(1), contractNumber: "NRT-2024-004", counterpartyName: "Vertice Legal S.r.l.",
      projectName: "Audit di Conformità", dueDate: "2026-11-16", daysLeft: 12, managerName: "Marco Bellini",
      renewalMonths: null, invoiceId: null, invoiceNumber: null, invoiceAmount: null },
    { type: "NOTICE_DEADLINE", contractId: uid(9), contractNumber: "NRT-2025-009", counterpartyName: "Rossi Impianti S.r.l.",
      projectName: "Manutenzione impianti", dueDate: "2026-11-24", daysLeft: 20, managerName: "Marco Bellini",
      renewalMonths: 12, invoiceId: null, invoiceNumber: null, invoiceAmount: null },
    { type: "RENEWAL_TO_CHECK", contractId: uid(4), contractNumber: "NRT-2025-002", counterpartyName: "Manifattura Orion S.p.A.",
      projectName: "Trasformazione Digitale", dueDate: "2026-11-29", daysLeft: 25, managerName: null,
      renewalMonths: null, invoiceId: null, invoiceNumber: null, invoiceAmount: null },
    { type: "INVOICE_TO_MATCH", contractId: uid(7), contractNumber: "NRT-2025-007", counterpartyName: "Nuvola Cloud Services S.r.l.",
      projectName: "Hosting e servizi cloud", dueDate: "2026-11-01", daysLeft: -3, managerName: "Marco Bellini",
      renewalMonths: null, invoiceId: uid(30), invoiceNumber: "2026/118", invoiceAmount: 5856 },
  ],
};

export async function mockApi(
  page: Page,
  overrides: Record<string, (route: import("@playwright/test").Route) => Promise<void> | void> = {}
) {
  const routes: Record<string, unknown> = {
    "**/api/v1/auth/refresh": { token: "fake-access-token" },
    "**/api/v1/contracts/stats": { total: 12, active: 9, expiring: 2, expired: 1 },
    "**/api/v1/home/attention": homeAttention,
    "**/api/v1/contracts/expiring*": [expiringContract],
    "**/api/v1/contracts/stats/by-area": [{ areaName: "Engineering", count: 7 }, { areaName: "Sales", count: 5 }],
    "**/api/v1/contracts/stats/timeline": [{ month: "2024-01", count: 3 }, { month: "2024-02", count: 5 }],
    "**/api/v1/contracts/stats/top-managers": [{ managerId: uid(1), managerName: "John Doe", contractsCount: 6 }],
    "**/api/v1/forecast*": { historical: [{ month: "2024-01", amount: 15000 }], forecast: [] },
    "**/api/v1/risk-scores*": [
      { contractId: uid(1), customerName: "Acme Corp", riskScore: 0.82, level: "HIGH", anomalies: ["EXPIRING_SOON"] },
    ],
    "**/api/v1/organizations/me": {
      id: uid(1),
      name: "Acme Corp",
      slug: "acme-corp",
      subscriptionTier: "FREE",
      iban: null,
      bic: null,
      createdAt: "2024-01-01T00:00:00Z",
    },
    "**/api/v1/business-areas": businessAreas,
    "**/api/v1/managers": managers,
    "**/api/v1/counterparties": counterparties,
    "**/api/v1/contracts/search*": {
      content: [sampleContract, expiringContract],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 10,
    },
    [`**/api/v1/contracts/${CONTRACT_ID}`]: sampleContract,
    [`**/api/v1/contracts/${CONTRACT_ID}/documents`]: [
      {
        id: uid(1),
        contractId: uid(1),
        fileName: "msa.pdf",
        fileSize: 204800,
        contentType: "application/pdf",
        uploadedAt: "2024-03-01T00:00:00Z",
        downloadUrl: `/contracts/${CONTRACT_ID}/documents/${uid(1)}/download`,
      },
    ],
    [`**/api/v1/contracts/${CONTRACT_ID}/invoices`]: [
      {
        id: uid(1),
        contractId: uid(1),
        fileName: "ft-2024-001.xml",
        fileSize: 10240,
        uploadedAt: "2024-03-01T00:00:00Z",
        downloadUrl: `/contracts/${CONTRACT_ID}/invoices/${uid(1)}/download`,
        supplierName: "Acme Corp",
        supplierVatNumber: "IT12345678901",
        documentType: "TD01",
        invoiceNumber: "FT-2024-001",
        invoiceDate: "2024-03-01",
        totalAmount: 6100,
        taxableAmount: 5000,
        vatAmount: 1100,
        currency: "EUR",
        lineItems: [],
        supplierIban: null,
        supplierBic: null,
        paymentDueDate: null,
        sepaBatchId: null,
        matchStatus: "SUGGESTED",
        matchedFinancialValueId: uid(7),
        matchConfidence: 0.92,
        matchedAt: null,
        matchedByUsername: null,
        expectedAmount: 4850,
        amountDifference: 150,
      },
    ],
    [`**/api/v1/financial-values/by-contract/${CONTRACT_ID}`]: [],
    [`**/api/v1/contract-history/contract/${CONTRACT_ID}`]: [],
    "**/api/v1/financial-types": financialTypes,
    "**/api/v1/budgets": budgets,
    "**/api/v1/financial-values": financialValues,
    "**/api/v1/contract-templates": contractTemplates,
    "**/api/v1/users": users,
    "**/api/v1/audit-logs*": auditLogs,
    "**/api/v1/users/me/2fa/status": { enabled: false },
    "**/api/v1/users/me/calendar-feed": { url: "https://bcm.example.com/api/v1/calendar/abc123.ics" },
    "**/api/v1/auth/me": {
      id: uid(1),
      username: "admin",
      managerId: uid(1),
      role: "ADMIN",
      roleId: uid(1),
      verified: true,
      createdAt: "2024-01-01T00:00:00Z",
      canApproveContracts: true,
      organizationName: "Acme Corp",
    },
    "**/api/v1/roles": [{ id: uid(1), role: "ADMIN" }, { id: uid(2), role: "MANAGER" }],
  };

  for (const [pattern, body] of Object.entries(routes)) {
    if (overrides[pattern]) continue;
    await page.route(pattern, (route) => route.fulfill({ json: body }));
  }

  for (const [pattern, handler] of Object.entries(overrides)) {
    await page.route(pattern, handler);
  }
}
