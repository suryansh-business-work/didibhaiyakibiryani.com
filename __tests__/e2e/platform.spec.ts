import { test, expect, request as pwRequest } from "@playwright/test";

const WEBSITE = process.env.E2E_WEBSITE_URL ?? "https://didibhaiyakibiryani.com";
const SERVER = process.env.E2E_SERVER_URL ?? "https://server.didibhaiyakibiryani.com";
const ADMIN = process.env.E2E_ADMIN_URL ?? "https://admin.didibhaiyakibiryani.com";
const SIGNOZ = process.env.E2E_SIGNOZ_URL ?? "https://signoz.didibhaiyakibiryani.com";

test.describe("status page", () => {
  test("renders category-wise health with dialogs", async ({ page }) => {
    await page.goto(`${WEBSITE}/status`);
    await expect(page.locator(".status-pill")).toBeVisible({ timeout: 30000 });
    await expect(page.locator(".status-cat", { hasText: "Applications" })).toBeVisible();
    await expect(page.locator(".status-cat", { hasText: "Database" })).toBeVisible();
    await expect(page.locator(".status-cat", { hasText: "Email" })).toBeVisible();

    // Click the first service → detail dialog opens
    await page.locator(".status-item").first().click();
    await expect(page.locator(".hdialog")).toBeVisible();
    await expect(page.locator("#hdialog-body .hrow").first()).toBeVisible();
    await page.locator("#hdialog-close").click();
    await expect(page.locator("#hdialog")).toBeHidden();
  });
});

test.describe("server platform APIs", () => {
  test("/health/full aggregates every category", async () => {
    const api = await pwRequest.newContext();
    const res = await api.get(`${SERVER}/health/full`, { timeout: 30000 });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const categories = new Set(body.services.map((s: { category: string }) => s.category));
    expect(categories.has("Applications")).toBe(true);
    expect(categories.has("Database")).toBe(true);
    expect(categories.has("Email")).toBe(true);
    expect(body.services.find((s: { key: string }) => s.key === "mongodb").ok).toBe(true);
  });

  test("captcha query issues an arithmetic challenge", async () => {
    const api = await pwRequest.newContext();
    const res = await api.post(`${SERVER}/graphql`, {
      data: { query: "query { captcha { id question } }" },
    });
    const body = await res.json();
    expect(body.data.captcha.id).toMatch(/^[a-f0-9]{24}$/);
    expect(body.data.captcha.question).toMatch(/What is \d+/);
  });

  test("emailAdminCredentials rejects a wrong captcha", async () => {
    const api = await pwRequest.newContext();
    const res = await api.post(`${SERVER}/graphql`, {
      data: {
        query: `mutation { emailAdminCredentials(email: "x@y.z", captchaId: "deadbeefdeadbeefdeadbeef", captchaAnswer: "1") }`,
      },
    });
    const body = await res.json();
    expect(body.errors?.[0]?.message).toMatch(/captcha/i);
  });

  test("support subjects are public via settings", async () => {
    const api = await pwRequest.newContext();
    const res = await api.post(`${SERVER}/graphql`, {
      data: { query: "query { settings { supportSubjects } }" },
    });
    const body = await res.json();
    expect(Array.isArray(body.data.settings.supportSubjects)).toBe(true);
    expect(body.data.settings.supportSubjects.length).toBeGreaterThan(0);
  });

  test("rating survey link with a bad token shows the invalid page", async () => {
    const api = await pwRequest.newContext();
    const res = await api.get(`${SERVER}/rate/000000000000000000000000/badtoken`);
    expect(res.status()).toBe(404);
    expect(await res.text()).toContain("invalid");
  });

  test("support mutations require login", async () => {
    const api = await pwRequest.newContext();
    const res = await api.post(`${SERVER}/graphql`, {
      data: {
        query: `mutation { createSupportTicket(orderId: "000000000000000000000000", subject: "x", body: "y") { id } }`,
      },
    });
    const body = await res.json();
    expect(body.errors?.[0]?.extensions?.code).toBe("UNAUTHENTICATED");
  });
});

test.describe("admin auth UX", () => {
  test("wrong credentials show an error, never a password hint", async ({ page }) => {
    await page.goto(ADMIN);
    await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible({ timeout: 20000 });
    const content = await page.content();
    expect(content).not.toContain("Admin@123");
    await page.getByPlaceholder("you@didibhaiyakibiryani.com").fill("nobody@didibhaiyakibiryani.com");
    await page.getByPlaceholder("••••••••").fill("wrong-password");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page.locator(".error-text")).toBeVisible({ timeout: 15000 });
  });

  test("recover-access flow shows a captcha", async ({ page }) => {
    await page.goto(ADMIN);
    await page.getByRole("button", { name: /email admin credentials/i }).click();
    await expect(page.getByText(/captcha: what is/i)).toBeVisible({ timeout: 15000 });
  });
});

test.describe("signoz", () => {
  test("observability UI responds", async () => {
    const api = await pwRequest.newContext();
    const res = await api.get(SIGNOZ, { timeout: 20000 });
    expect(res.status()).toBe(200);
  });
});
