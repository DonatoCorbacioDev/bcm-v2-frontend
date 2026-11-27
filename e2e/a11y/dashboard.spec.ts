import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mockAuthenticatedSession, mockApi } from "../utils/mock-backend";

test.describe("Accessibility: home", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockApi(page);
  });

  test("has no detectable axe violations", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Ciao, admin" })).toBeVisible();
    // What to do now, each with its button; the invoices beside the costs.
    await expect(page.getByRole("region", { name: "Da fare adesso" }).getByRole("link")).toHaveCount(2);
    await expect(page.getByRole("region", { name: /Fatture da abbinare/ }).getByRole("link", { name: "Abbina" })).toHaveCount(1);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
