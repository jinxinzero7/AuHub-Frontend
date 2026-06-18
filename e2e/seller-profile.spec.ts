import { expect, test } from "@playwright/test";

test.describe("public seller profile", () => {
  test("opens from a catalog lot card", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "@seller" }).click();

    await expect(page).toHaveURL(/\/sellers\/seller-1$/);
    await expect(page.getByRole("heading", { name: "@seller" })).toBeVisible();
  });

  test("opens from lot detail and shows only public seller data", async ({ page }) => {
    await page.goto("/lots/mock-delivery-lot");
    await page.getByRole("link", { name: "@seller" }).click();

    await expect(page).toHaveURL(/\/sellers\/seller-1$/);
    await expect(page.getByRole("heading", { name: "@seller" })).toBeVisible();
    await expect(page.getByText("Тестовый продавец")).toBeVisible();
    await expect(page.getByText("Проверен")).toBeVisible();
    await expect(page.getByText("70/100")).toBeVisible();
    await expect(page.getByText("Отзывов пока нет")).toBeVisible();

    await expect(page.getByText("private@example.com")).toHaveCount(0);
    await expect(page.getByText("+79999999999")).toHaveCount(0);
    await expect(page.getByText("private/passport.jpg")).toHaveCount(0);
    await expect(page.getByText("private", { exact: true })).toHaveCount(0);
  });

  test("renders rating, reviews and trust summary", async ({ page }) => {
    await page.goto("/sellers/profile-seller");

    await expect(page.getByRole("heading", { name: "@technik" })).toBeVisible();
    await expect(page.getByText("Иван Петров")).toBeVisible();
    await expect(page.getByText("4.5 из 5")).toBeVisible();
    await expect(page.getByText("82/100")).toBeVisible();
    await expect(page.getByText("Всё соответствует описанию, отправка без задержек.")).toBeVisible();
    await expect(page.getByText("Покупатель оставил оценку без комментария.")).toBeVisible();

    await expect(page.getByText("private@example.com")).toHaveCount(0);
    await expect(page.getByText("+79999999999")).toHaveCount(0);
    await expect(page.getByText("500000")).toHaveCount(0);
  });

  test("shows not found state", async ({ page }) => {
    await page.goto("/sellers/missing-seller");
    await expect(page.getByText("Продавец не найден")).toBeVisible();
    await expect(page.getByRole("link", { name: "Вернуться к каталогу" })).toBeVisible();
  });
});
