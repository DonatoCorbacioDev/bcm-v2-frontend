import type { Page } from "@playwright/test";

/**
 * E2E accessibility tests run against `next dev` with no real backend, ML
 * service, or database — axe only cares about the rendered DOM, so every
 * API call the app makes is intercepted and fulfilled with fixture data
 * instead. Endpoint paths below must stay in sync with the `services/*`
 * files; there's no contract test tying the two together.
 */

const mockUser = {
  id: 1,
  username: "admin",
  managerId: 1,
  role: "ADMIN",
  roleId: 1,
  verified: true,
  createdAt: "2024-01-01T00:00:00Z",
};

/** Seeds localStorage with an authenticated session before any script runs. */
export async function mockAuthenticatedSession(page: Page) {
  await page.addInitScript((user) => {
    window.localStorage.setItem(
      "auth-storage",
      JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 })
    );
  }, mockUser);
}

const businessAreas = [{ id: 1, name: "Engineering", description: "Eng" }];
const managers = [
  { id: 1, firstName: "John", lastName: "Doe", email: "john@example.com", phoneNumber: "+39 333 1234567", department: "IT" },
];

const sampleContract = {
  id: 1,
  customerName: "Acme Corp",
  contractNumber: "CNT-2024-001",
  wbsCode: "WBS-001",
  projectName: "Digital Transformation",
  areaId: 1,
  managerId: 1,
  managerName: "John Doe",
  startDate: "2024-01-01",
  endDate: "2099-12-31",
  status: "ACTIVE",
  createdAt: "2024-01-01T00:00:00Z",
  daysUntilExpiry: 20,
};

const expiringContract = { ...sampleContract, id: 2, contractNumber: "CNT-2024-002", daysUntilExpiry: 5 };

/**
 * Mocks every endpoint the authenticated dashboard layout, dashboard page,
 * and contracts page can call, with `overrides` layered on top for
 * test-specific routes (e.g. an empty state).
 */
export async function mockApi(
  page: Page,
  overrides: Record<string, (route: import("@playwright/test").Route) => Promise<void> | void> = {}
) {
  const routes: Record<string, unknown> = {
    "**/api/v1/auth/refresh": { token: "fake-access-token" },
    "**/api/v1/contracts/stats": { total: 12, active: 9, expiring: 2, expired: 1 },
    "**/api/v1/contracts/expiring*": [expiringContract],
    "**/api/v1/contracts/stats/by-area": [{ areaName: "Engineering", count: 7 }, { areaName: "Sales", count: 5 }],
    "**/api/v1/contracts/stats/timeline": [{ month: "2024-01", count: 3 }, { month: "2024-02", count: 5 }],
    "**/api/v1/contracts/stats/top-managers": [{ managerId: 1, managerName: "John Doe", contractsCount: 6 }],
    "**/api/v1/financial-values": [],
    "**/api/v1/forecast*": { historical: [{ month: "2024-01", amount: 15000 }], forecast: [] },
    "**/api/v1/risk-scores*": [
      { contractId: 1, customerName: "Acme Corp", riskScore: 0.82, level: "HIGH", anomalies: ["EXPIRING_SOON"] },
    ],
    "**/api/v1/business-areas": businessAreas,
    "**/api/v1/managers": managers,
    "**/api/v1/contracts/search*": {
      content: [sampleContract, expiringContract],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 10,
    },
    "**/api/v1/contracts/1": sampleContract,
    "**/api/v1/contracts/1/documents": [
      {
        id: 1,
        contractId: 1,
        fileName: "msa.pdf",
        fileSize: 204800,
        contentType: "application/pdf",
        uploadedAt: "2024-03-01T00:00:00Z",
        downloadUrl: "/contracts/1/documents/1/download",
      },
    ],
    "**/api/v1/contracts/1/invoices": [
      {
        id: 1,
        contractId: 1,
        fileName: "ft-2024-001.xml",
        fileSize: 10240,
        uploadedAt: "2024-03-01T00:00:00Z",
        downloadUrl: "/contracts/1/invoices/1/download",
        supplierName: "Acme Corp",
        supplierVatNumber: "IT12345678901",
        documentType: "TD01",
        invoiceNumber: "FT-2024-001",
        invoiceDate: "2024-03-01",
        totalAmount: 5000,
        currency: "EUR",
        lineItems: [],
      },
    ],
    "**/api/v1/financial-values/by-contract/1": [],
    "**/api/v1/contract-history/contract/1": [],
  };

  for (const [pattern, body] of Object.entries(routes)) {
    if (overrides[pattern]) continue;
    await page.route(pattern, (route) => route.fulfill({ json: body }));
  }

  for (const [pattern, handler] of Object.entries(overrides)) {
    await page.route(pattern, handler);
  }
}
