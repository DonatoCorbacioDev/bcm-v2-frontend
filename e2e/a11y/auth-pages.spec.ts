import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility: unauthenticated auth pages", () => {
  test("register-org page has no detectable axe violations", async ({ page }) => {
    await page.goto("/register-org");
    await expect(page.getByRole("heading", { name: "Registra Organizzazione" })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("forgot-password page has no detectable axe violations", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Password dimenticata" })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("reset-password page without a token has no detectable axe violations", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: "Link non valido" })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("reset-password page with a token has no detectable axe violations", async ({ page }) => {
    await page.goto("/reset-password?token=fake-token");
    await expect(page.getByRole("heading", { name: "Reimposta password" })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("complete-invite page without a token has no detectable axe violations", async ({ page }) => {
    await page.goto("/complete-invite");
    await expect(page.getByRole("heading", { name: "Invito non valido" })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("complete-invite page with a token has no detectable axe violations", async ({ page }) => {
    await page.goto("/complete-invite?token=fake-token");
    await expect(page.getByRole("heading", { name: "Benvenuto in BCM" })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
