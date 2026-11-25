import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility: cancellation calculator", () => {
  test("the empty page has no detectable axe violations", async ({ page }) => {
    await page.goto("/calcolo-disdetta");
    await expect(page.getByRole("heading", { level: 1, name: /ultimo giorno per disdire/ })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("a computed deadline is announced and has no detectable axe violations", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-11-25T10:00:00"));
    await page.goto("/calcolo-disdetta");
    await page.getByLabel("Scadenza del contratto").fill("2027-03-15");
    await page.getByLabel("Preavviso scritto nel contratto").fill("90");

    await expect(page.getByText("tra 20 giorni")).toBeVisible();
    await expect(page.getByText(/15 dicembre 2026/)).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
