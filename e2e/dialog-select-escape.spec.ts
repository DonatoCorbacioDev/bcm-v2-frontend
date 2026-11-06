import { test, expect } from "@playwright/test";
import { mockAuthenticatedSession, mockApi } from "./utils/mock-backend";

/**
 * Regression: pressing Escape on a Select opened inside a Dialog used to close
 * the Dialog too and leave <body> with `pointer-events: none`, so the whole page
 * stopped responding to clicks until a reload. Cause: Select and Dialog shipped
 * different copies of @radix-ui/react-dismissable-layer, i.e. two layer stacks
 * that didn't know about each other (fixed with npm `overrides`).
 */
test.describe("Select inside a Dialog", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockApi(page);
  });

  test("Escape closes only the dropdown and the page stays clickable", async ({ page }) => {
    await page.goto("/contracts");
    await page.getByRole("button", { name: "+ Nuovo contratto" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox", { name: "Controparte" }).click();
    await expect(page.getByRole("listbox")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Annulla" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator("body")).not.toHaveCSS("pointer-events", "none");

    await page.getByRole("button", { name: "+ Nuovo contratto" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
