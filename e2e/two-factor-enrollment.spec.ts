import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mockApi } from "./utils/mock-backend";
import { uid } from "../__tests__/mocks/ids";

/**
 * An administrator without 2FA gets no session at login: the backend answers
 * with a setup token (TwoFactorPolicy), and the dashboard opens only after
 * the setup is confirmed and the recovery codes have been shown.
 */
test.describe("Required 2FA setup at login", () => {
  test("an admin sets 2FA up, sees the recovery codes, then reaches the dashboard", async ({ page }) => {
    await mockApi(page, {
      "**/api/v1/auth/login": (route) =>
        route.fulfill({
          json: { token: null, mfaRequired: false, mfaToken: null, mfaSetupRequired: true, setupToken: "setup-1" },
        }),
      "**/api/v1/auth/2fa/enroll/setup": (route) =>
        route.fulfill({ json: { secret: "JBSWY3DPEHPK3PXP", otpAuthUri: "otpauth://totp/BCM:boss?secret=JBSWY3DPEHPK3PXP&issuer=BCM" } }),
      "**/api/v1/auth/2fa/enroll/confirm": (route) =>
        route.fulfill({ json: { token: "fake-access-token", recoveryCodes: ["AAAA-BBBB", "CCCC-DDDD"] } }),
      "**/api/v1/auth/me": (route) =>
        route.fulfill({
          json: { id: uid(1), username: "boss", managerId: uid(1), role: "ADMIN", roleId: uid(1), verified: true, createdAt: "2024-01-01T00:00:00Z" },
        }),
    });

    await page.goto("/login");
    await page.getByLabel("Nome utente").fill("boss");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Accedi" }).click();

    await expect(page.getByText("JBSWY3DPEHPK3PXP")).toBeVisible();
    await expect(page.getByRole("img", { name: /codice qr/i })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);

    await page.getByLabel("Codice di verifica").fill("123456");
    await page.getByRole("button", { name: "Attiva e accedi" }).click();

    await expect(page.getByRole("list", { name: "Codici di recupero" })).toContainText("AAAA-BBBB");
    await expect(page).toHaveURL(/\/login/);

    await page.getByRole("button", { name: /ho salvato i codici/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
