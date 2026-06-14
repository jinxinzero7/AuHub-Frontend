import { expect, request, test, type APIRequestContext, type APIResponse } from "@playwright/test";
import { randomUUID } from "node:crypto";

const isFullStack = process.env.E2E_FULL_STACK === "true";
const gatewayURL = process.env.E2E_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5000";
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? process.env.ADMIN_BOOTSTRAP_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_BOOTSTRAP_PASSWORD;

type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
};

async function readJson(response: APIResponse, label: string) {
  const body = await response.text();
  expect(response.ok(), `${label} failed: ${response.status()} ${body}`).toBeTruthy();
  return body ? JSON.parse(body) : {};
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function registerUser(api: APIRequestContext, prefix: string): Promise<AuthResult> {
  const unique = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const response = await api.post("/api/auth/register", {
    data: {
      email: `${prefix}.${unique}@e2e.auhub.test`,
      phoneNumber: `+79${unique.slice(-9).padStart(9, "0")}`,
      nickname: `${prefix}_${unique}`.slice(0, 32),
      name: `${prefix} E2E`,
      password: "E2ePassword!123",
    },
  });

  return await readJson(response, `register ${prefix}`) as AuthResult;
}

async function login(api: APIRequestContext, identifier: string, password: string): Promise<AuthResult> {
  const response = await api.post("/api/auth/login", {
    data: { identifier, password },
  });

  return await readJson(response, `login ${identifier}`) as AuthResult;
}

test.describe("full-stack marketplace smoke", () => {
  test.skip(!isFullStack, "Set E2E_FULL_STACK=true to run against real Gateway/backend services.");

  test("seller can submit a lot, admin can approve it, and buyer can bid through UI", async ({ page }) => {
    test.skip(!adminEmail || !adminPassword, "Set E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD or ADMIN_BOOTSTRAP_*.");

    const api = await request.newContext({ baseURL: gatewayURL });

    try {
      await readJson(await api.get("/health"), "gateway health");

      const seller = await registerUser(api, "seller");
      const buyer = await registerUser(api, "buyer");
      const admin = await login(api, adminEmail!, adminPassword!);

      const title = `E2E marketplace lot ${randomUUID()}`;
      const createLot = await api.post("/api/lots", {
        headers: authHeaders(seller.accessToken),
        data: {
          title,
          description: "Full-stack Playwright smoke lot",
          startingPrice: 1000,
          durationHours: 24,
          supportedDeliveryProviders: ["Cdek"],
        },
      });
      const createdLot = await readJson(createLot, "create lot") as { lotId: string };
      const lotId = createdLot.lotId;

      await readJson(await api.post(`/api/lots/${lotId}/submit-for-moderation`, {
        headers: authHeaders(seller.accessToken),
      }), "submit lot for moderation");

      await readJson(await api.post(`/api/lots/${lotId}/approve`, {
        headers: authHeaders(admin.accessToken),
      }), "approve lot");

      await readJson(await api.post("/api/payment/topup", {
        headers: authHeaders(buyer.accessToken),
        data: { amount: 2500 },
      }), "top up buyer wallet");

      await page.addInitScript(({ accessToken, refreshToken }) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
      }, { accessToken: buyer.accessToken, refreshToken: buyer.refreshToken });

      await page.goto(`/lots/${lotId}`);
      await expect(page.getByText(title)).toBeVisible();

      await page.locator('input[type="number"]').fill("1200");
      await page.locator('input[type="number"]').press("Enter");

      const lotAfterBid = await readJson(await api.get(`/api/lots/${lotId}`), "get lot after bid") as {
        currentPrice: number;
        status: string;
      };

      expect(lotAfterBid.status).toBe("Active");
      expect(lotAfterBid.currentPrice).toBe(1200);
      await expect(page.locator("body")).toContainText(/1\s*200/);
    } finally {
      await api.dispose();
    }
  });
});
