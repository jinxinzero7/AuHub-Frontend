import { expect, test } from "@playwright/test";

test.describe("auth forms", () => {
  test("keeps invalid login data on the client", async ({ page }) => {
    await page.goto("/login");

    await page.locator("#identifier").fill("not-an-email");
    await page.locator("#password").fill("");
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("form .text-danger")).toHaveCount(2);
    await expect(page.locator("#identifier")).toHaveValue("not-an-email");
  });

  test("keeps invalid registration data on the client", async ({ page }) => {
    await page.goto("/register");

    await page.locator("#name").fill("A");
    await page.locator("#nickname").fill("x");
    await page.locator("#phoneNumber").fill("123");
    await page.locator("#email").fill("invalid-email");
    await page.locator("#password").fill("short");
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/register$/);
    await expect(page.locator("form .text-danger")).toHaveCount(5);
    await expect(page.locator("#name")).toHaveValue("A");
    await expect(page.locator("#nickname")).toHaveValue("x");
  });
});
