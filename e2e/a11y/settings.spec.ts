import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mockAuthenticatedSession, mockApi } from "../utils/mock-backend";

test.describe("Accessibility: short menu and settings page", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockApi(page);
  });

  test("settings page has no detectable axe violations and reaches the moved pages", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { level: 1, name: "Impostazioni" })).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Navigazione principale" }).first();
    await expect(nav.getByRole("link", { name: "Impostazioni" })).toHaveAttribute("aria-current", "page");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);

    await page.getByRole("link", { name: /Registro attività/ }).click();
    await expect(page).toHaveURL(/\/audit-logs$/);
    await expect(nav.getByRole("link", { name: "Impostazioni" })).toHaveAttribute("aria-current", "page");
  });
});
