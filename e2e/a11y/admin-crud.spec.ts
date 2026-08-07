import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mockAuthenticatedSession, mockApi } from "../utils/mock-backend";

/**
 * Covers the admin-only CRUD list pages, which all share the same shape
 * (heading + Table + create/edit Dialog). One spec per page keeps failures
 * attributable; the shared beforeEach keeps the boilerplate down.
 */

test.describe("Accessibility: admin CRUD pages", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockApi(page);
  });

  test("budgets page has no detectable axe violations", async ({ page }) => {
    await page.goto("/budgets");
    await expect(page.getByRole("heading", { name: "Budget" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("business areas page has no detectable axe violations", async ({ page }) => {
    await page.goto("/business-areas");
    await expect(page.getByRole("heading", { name: "Aree di business" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("contract templates page has no detectable axe violations", async ({ page }) => {
    await page.goto("/contract-templates");
    await expect(page.getByRole("heading", { name: "Modelli di contratto" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("financial types page has no detectable axe violations", async ({ page }) => {
    await page.goto("/financial-types");
    await expect(page.getByRole("heading", { name: "Tipi finanziari" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("managers page has no detectable axe violations", async ({ page }) => {
    await page.goto("/managers");
    await expect(page.getByRole("heading", { name: "Responsabili" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("users page has no detectable axe violations", async ({ page }) => {
    await page.goto("/users");
    await expect(page.getByRole("heading", { name: "Utenti" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("financial values page has no detectable axe violations", async ({ page }) => {
    await page.goto("/financial-values");
    await expect(page.getByRole("heading", { name: "Valori finanziari" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("organization page has no detectable axe violations", async ({ page }) => {
    await page.goto("/organization");
    await expect(page.getByRole("heading", { name: "Organizzazione", exact: true })).toBeVisible();
    await expect(page.getByLabel("IBAN")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("audit logs page has no detectable axe violations", async ({ page }) => {
    await page.goto("/audit-logs");
    await expect(page.getByRole("heading", { name: "Registro attività" })).toBeVisible();
    await expect(page.getByText("Creazione", { exact: true })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("profile page has no detectable axe violations", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Il mio profilo" })).toBeVisible();
    await expect(page.getByText("Autenticazione a due fattori")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
