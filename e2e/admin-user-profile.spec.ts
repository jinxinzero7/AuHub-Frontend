import { expect, test } from "@playwright/test";

function createMockJwt(role: "Admin" | "User") {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64");
  const payload = Buffer.from(JSON.stringify({ sub: `${role.toLowerCase()}-viewer`, email: `${role.toLowerCase()}@example.com`, name: role, role })).toString("base64");
  return `${header}.${payload}.`;
}

async function authenticate(page: import("@playwright/test").Page, role: "Admin" | "User" = "Admin") {
  const token = createMockJwt(role);
  await page.addInitScript((accessToken) => window.localStorage.setItem("accessToken", accessToken), token);
}

test.describe("admin user profile", () => {
  test("shows safe identity, activity and reputation data", async ({ page }) => {
    await authenticate(page);
    await page.goto("/admin/users/admin-user");

    await expect(page.getByRole("heading", { name: "Иван Модерируемый" })).toBeVisible();
    await expect(page.getByText("moderated@example.com")).toBeVisible();
    await expect(page.getByText("Фотоаппарат для путешествий").first()).toBeVisible();
    await expect(page.getByText("82/100")).toBeVisible();
    await expect(page.getByText("Успешная сделка")).toBeVisible();
    await expect(page.getByText("private/passport.jpg")).toHaveCount(0);
    await expect(page.getByText("private/selfie.jpg")).toHaveCount(0);
    await expect(page.getByText(/password|token|wallet|tracking/i)).toHaveCount(0);
  });

  test("ban action updates visible account state", async ({ page }) => {
    await authenticate(page);
    await page.goto("/admin/users/admin-user");
    await page.getByLabel("Причина блокировки").fill("Нарушение правил");
    await page.getByRole("button", { name: "Заблокировать" }).click();
    await expect(page.getByText("Пользователь заблокирован")).toBeVisible();
    await expect(page.getByRole("button", { name: "Разблокировать" })).toBeVisible();
  });

  test("keeps identity visible when activity fails", async ({ page }) => {
    await authenticate(page);
    await page.goto("/admin/users/activity-error-user");
    await expect(page.getByRole("heading", { name: "Иван Модерируемый" })).toBeVisible();
    await expect(page.getByText("Активность временно недоступна. Данные аккаунта загружены.")).toBeVisible();
  });

  test("handles missing user and blocks non-admin", async ({ page }) => {
    await authenticate(page);
    await page.goto("/admin/users/missing-admin-user");
    await expect(page.getByText("Пользователь не найден")).toBeVisible();

    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await authenticate(page, "User");
    await page.goto("/admin/users/admin-user");
    await expect(page.getByText("Недостаточно прав")).toBeVisible();
  });

  for (const entry of ["/admin/moderation", "/admin/documents", "/admin/disputes", "/admin/frozen", "/admin/banned"]) {
    test(`links to profile from ${entry}`, async ({ page }) => {
      await authenticate(page);
      await page.goto(entry);
      const profileLink = page.locator('a[href="/admin/users/admin-user"]').first();
      await expect(profileLink).toBeVisible();
      await profileLink.click();
      await expect(page).toHaveURL(/\/admin\/users\/admin-user$/);
    });
  }
});
