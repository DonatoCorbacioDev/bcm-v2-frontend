import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mockAuthenticatedSession, mockApi } from "../utils/mock-backend";

test.describe("Accessibility: contract detail page", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockApi(page);
  });

  test("documents tab has no detectable axe violations", async ({ page }) => {
    await page.goto("/contracts/1");
    await expect(page.getByText("msa.pdf")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("invoices tab has no detectable axe violations", async ({ page }) => {
    await page.goto("/contracts/1");
    await page.getByRole("button", { name: "Invoices" }).click();
    await expect(page.getByRole("cell", { name: "FT-2024-001", exact: true })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
