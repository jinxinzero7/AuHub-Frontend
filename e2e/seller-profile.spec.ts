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
    await expect(page.getByText("Проверен", { exact: true })).toBeVisible();
    await expect(page.getByText("70/100", { exact: true })).toBeVisible();
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
    await expect(page.getByText("82/100", { exact: true })).toBeVisible();
    await expect(page.getByText("Всё соответствует описанию, отправка без задержек.")).toBeVisible();
    await expect(page.getByText("Покупатель оставил оценку без комментария.")).toBeVisible();
    await expect(page.getByText("private@example.com")).toHaveCount(0);
    await expect(page.getByText("+79999999999")).toHaveCount(0);
    await expect(page.getByText("500000")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Активные лоты" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Фотоаппарат для путешествий" })).toBeVisible();
    await expect(page.getByText("1 из 2")).toBeVisible();

    await page.getByRole("button", { name: "Вперёд" }).click();
    await expect(page.getByRole("link", { name: "Объектив 50 мм" })).toBeVisible();
    await expect(page.getByText("2 из 2")).toBeVisible();

    await page.getByRole("link", { name: "Объектив 50 мм" }).click();
    await expect(page).toHaveURL(/\/lots\/profile-active-2$/);
    await expect(page.getByRole("heading", { name: "Объектив 50 мм" })).toBeVisible();

  });

  test("shows an empty lots state", async ({ page }) => {
    await page.goto("/sellers/empty-seller");

    await expect(page.getByRole("heading", { name: "@empty-seller" })).toBeVisible();
    await expect(page.getByText("Активных лотов пока нет")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Страницы лотов продавца" })).toHaveCount(0);
  });

  test("keeps profile available when lots request fails", async ({ page }) => {
    await page.goto("/sellers/lots-error-seller");

    await expect(page.getByRole("heading", { name: "@lots-error-seller" })).toBeVisible();
    await expect(page.getByText("Не удалось загрузить активные лоты. Остальные данные профиля доступны.")).toBeVisible();
    await expect(page.getByText("Рейтинг продавца")).toBeVisible();
  });

  test("shows not found state", async ({ page }) => {
    await page.goto("/sellers/missing-seller");
    await expect(page.getByText("Продавец не найден")).toBeVisible();
    await expect(page.getByRole("link", { name: "Вернуться к каталогу" })).toBeVisible();
  });
});
