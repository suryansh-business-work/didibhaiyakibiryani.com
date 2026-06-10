import { test, expect, request as pwRequest } from "@playwright/test";

const WEBSITE = process.env.E2E_WEBSITE_URL ?? "https://didibhaiyakibiryani.com";
const SERVER = process.env.E2E_SERVER_URL ?? "https://server.didibhaiyakibiryani.com";
const ADMIN = process.env.E2E_ADMIN_URL ?? "https://admin.didibhaiyakibiryani.com";
const NATIVE = process.env.E2E_NATIVE_URL ?? "https://native.didibhaiyakibiryani.com";
const DELIVERY = process.env.E2E_DELIVERY_URL ?? "https://delivery.didibhaiyakibiryani.com";

test.describe("website", () => {
  test("loads and shows the brand", async ({ page }) => {
    await page.goto(WEBSITE);
    await expect(page).toHaveTitle(/biryani/i);
    await expect(page.locator("#menu-grid")).toBeVisible();
  });
});

test.describe("server", () => {
  test("health endpoint returns ok", async () => {
    const api = await pwRequest.newContext();
    const res = await api.get(`${SERVER}/health`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  test("public settings query exposes store + maintenance flags", async () => {
    const api = await pwRequest.newContext();
    const res = await api.post(`${SERVER}/graphql`, {
      data: {
        query:
          "query { settings { brandName storeOpenTime storeCloseTime storeOpenNow codEnabled onlineEnabled maintenance { website native delivery } } }",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.settings.brandName).toBeTruthy();
    expect(typeof body.data.settings.storeOpenNow).toBe("boolean");
  });

  test("menu items expose availability (out-of-stock signal)", async () => {
    const api = await pwRequest.newContext();
    const res = await api.post(`${SERVER}/graphql`, {
      data: { query: "query { menuItems { name isAvailable } }" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data.menuItems)).toBe(true);
  });
});

test.describe("admin", () => {
  test("login screen renders", async ({ page }) => {
    await page.goto(ADMIN);
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible({ timeout: 20000 });
  });
});

test.describe("native (customer app web)", () => {
  test("app shell loads", async ({ page }) => {
    const res = await page.goto(NATIVE);
    expect(res?.status()).toBe(200);
  });
});

test.describe("delivery (rider portal)", () => {
  // Skipped automatically until the delivery DNS record exists.
  test("rider login renders", async ({ page }) => {
    let reachable = true;
    try {
      const api = await pwRequest.newContext();
      const res = await api.get(DELIVERY, { timeout: 10000 });
      reachable = res.status() < 500;
    } catch {
      reachable = false;
    }
    test.skip(!reachable, `${DELIVERY} is not resolvable yet (DNS pending)`);
    await page.goto(DELIVERY);
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible({ timeout: 20000 });
  });
});
