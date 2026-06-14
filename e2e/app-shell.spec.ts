import { expect, test } from "@playwright/test";

test.describe("public app shell", () => {
  test("renders the home page and public navigation without backend services", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("header")).toBeVisible();
    await expect(page.getByRole("link", { name: /AuHub/i }).first()).toHaveAttribute("href", "/");
    await expect(page.locator('a[href="/login"]').first()).toBeVisible();
    await expect(page.locator('a[href="/register"]').first()).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  test("navigates to login and register pages from the header", async ({ page }) => {
    await page.goto("/");

    await page.locator('a[href="/login"]').first().click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("#identifier")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    await page.goto("/");
    await page.locator('a[href="/register"]').first().click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#nickname")).toBeVisible();
    await expect(page.locator("#phoneNumber")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });
});
