import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3000);
const apiPort = Number(process.env.E2E_API_PORT ?? 59999);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const fallbackApiURL = `http://127.0.0.1:${apiPort}`;
const isFullStack = process.env.E2E_FULL_STACK === "true";
const apiURL = process.env.E2E_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? fallbackApiURL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: isFullStack ? [
    {
      command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_API_URL: apiURL,
        INTERNAL_API_URL: process.env.INTERNAL_API_URL ?? apiURL,
      },
    },
  ] : [
    {
      command: `node e2e/mock-api.mjs --port ${apiPort}`,
      url: `${fallbackApiURL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_API_URL: apiURL,
        INTERNAL_API_URL: process.env.INTERNAL_API_URL ?? apiURL,
      },
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
