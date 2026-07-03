import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mockAuthenticatedSession, mockApi } from "../utils/mock-backend";

test.describe("Accessibility: contracts table and form", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockApi(page);
  });

  test("contracts table has no detectable axe violations", async ({ page }) => {
    await page.goto("/contracts");
    await expect(page.getByText("CNT-2024-001")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("contract form dialog has no detectable axe violations", async ({ page }) => {
    await page.goto("/contracts");
    await page.getByRole("button", { name: "+ Nuovo contratto" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("Nome cliente")).toBeVisible();

    const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(results.violations).toEqual([]);
  });

  test("delete confirmation dialog has no detectable axe violations", async ({ page }) => {
    await page.goto("/contracts");
    const rows = page.getByRole("row");
    await rows.nth(1).getByRole("button", { name: "Elimina" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(results.violations).toEqual([]);
  });
});
