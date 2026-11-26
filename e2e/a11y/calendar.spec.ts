import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mockAuthenticatedSession, mockApi } from "../utils/mock-backend";

/** Dates in the current month, so the grid always has something on it. */
function dayThisMonth(day: number): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(day)}`;
}

const contracts = [
  { id: "c1", counterpartyId: "p1", counterparty: { name: "Gestio Software S.r.l." }, contractNumber: "NRT-123", projectName: "Licenza software gestionale",
    startDate: "2025-01-01", endDate: dayThisMonth(28), status: "ACTIVE", autoRenew: true, noticeDeadline: dayThisMonth(3) },
  { id: "c2", counterpartyId: "p2", counterparty: { name: "Vertice Legal S.r.l." }, contractNumber: "NRT-104", projectName: "Audit di Conformità",
    startDate: "2025-03-01", endDate: dayThisMonth(12), status: "ACTIVE" },
  { id: "c3", counterpartyId: "p3", counterparty: { name: "Aurora Servizi S.r.l." }, contractNumber: "NRT-124", projectName: "Pulizia uffici",
    startDate: "2025-03-01", endDate: dayThisMonth(12), status: "ACTIVE" },
];

test.describe("Accessibility: calendar", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockApi(page, {
      // Only the search answers: like production, where GET /contracts is admin-only.
      "**/api/v1/contracts": (route) => route.fulfill({ status: 403, json: {} }),
      "**/api/v1/contracts/search*": (route) => route.fulfill({ json: { content: contracts, totalElements: contracts.length, totalPages: 1, number: 0, size: 1000 } }),
    });
  });

  test("calendar month and subscribe buttons have no detectable axe violations", async ({ page }) => {
    await page.goto("/calendar");
    await expect(page.getByRole("heading", { name: "Calendario", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Google Calendar" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Ultimo giorno per disdire: NRT-123/ }).first()).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("calendar on a phone lists the month's days and has no detectable axe violations", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calendar");
    await expect(page.getByRole("link", { name: /Scadenza: NRT-104/ }).last()).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
