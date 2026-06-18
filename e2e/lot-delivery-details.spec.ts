import { expect, test } from "@playwright/test";

function createMockJwt(payload: Record<string, string>) {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `${header}.${body}.`;
}

test.describe("lot delivery details", () => {
  test("does not render an empty delivery details block for anonymous users", async ({ page }) => {
    await page.goto("/lots/mock-delivery-lot");

    await expect(page.getByRole("heading", { name: "Тестовый лот с доставкой" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Данные доставки" })).toHaveCount(0);
  });

  test("renders private delivery details after authenticated lot detail refetch", async ({ page }) => {
    const token = createMockJwt({
      sub: "seller-1",
      email: "seller@example.com",
      name: "Тестовый продавец",
      nickname: "seller",
      role: "User",
    });

    await page.addInitScript((accessToken) => {
      window.localStorage.setItem("accessToken", accessToken);
    }, token);

    await page.goto("/lots/mock-delivery-lot");

    const details = page.getByRole("region", { name: "Данные доставки" });

    await expect(details).toBeVisible();
    await expect(details.getByText("Яндекс Доставка")).toBeVisible();
    await expect(details.getByText("ПВЗ Москва, Тверская 1")).toBeVisible();
    await expect(details.getByText("Иван Покупатель")).toBeVisible();
    await expect(details.getByText("+79990001122")).toBeVisible();
    await expect(details.getByText("TRACK-12345")).toBeVisible();
  });

  test("hydrates winner actions and renders anonymous bid history without bidder identity", async ({ page }) => {
    const token = createMockJwt({
      sub: "buyer-1",
      email: "buyer@example.com",
      name: "Тестовый покупатель",
      nickname: "buyer",
      role: "User",
    });

    await page.addInitScript((accessToken) => {
      window.localStorage.setItem("accessToken", accessToken);
    }, token);

    await page.goto("/lots/mock-winner-lot");

    await expect(page.getByRole("heading", { name: "Запросить доставку" })).toBeVisible();
    await expect(page.getByText("18.06.2026, 12:00")).toBeVisible();
    const bidHistory = page.getByRole("heading", { name: "История ставок" }).locator("..");
    await expect(bidHistory.getByText("1 700 ₽")).toBeVisible();
    await expect(page.getByText("public-bid-1")).toHaveCount(0);
    await expect(page.getByText(/undefined|invalid date/i)).toHaveCount(0);
  });
});
