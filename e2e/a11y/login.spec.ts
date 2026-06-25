import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility: login page", () => {
  test("has no detectable axe violations", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Accedi" })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("has a skip link as the first focusable element", async ({ page }) => {
    await page.goto("/login");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: /vai al contenuto principale/i })).toBeFocused();
  });
});
