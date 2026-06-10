import { defineConfig } from "@playwright/test";

/**
 * E2E smoke suite. By default it runs against production; point it at a local
 * stack with E2E_WEBSITE_URL / E2E_SERVER_URL / E2E_ADMIN_URL / E2E_NATIVE_URL
 * / E2E_DELIVERY_URL.
 */
export default defineConfig({
  testDir: "./__tests__/e2e",
  timeout: 45_000,
  retries: 1,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    trace: "retain-on-failure",
  },
});
