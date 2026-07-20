import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility: legal pages", () => {
  test("privacy page has no detectable axe violations", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: "Informativa sulla privacy" })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("AI transparency page has no detectable axe violations", async ({ page }) => {
    await page.goto("/trasparenza-ai");
    await expect(
      page.getByRole("heading", { name: "Trasparenza sull'uso dell'intelligenza artificiale" })
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
