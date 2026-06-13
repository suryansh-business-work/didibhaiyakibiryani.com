import { test, expect, request as pwRequest } from "@playwright/test";

const WEBSITE = process.env.E2E_WEBSITE_URL ?? "https://didibhaiyakibiryani.com";
const SERVER = process.env.E2E_SERVER_URL ?? "https://server.didibhaiyakibiryani.com";

test.describe("legal pages (Play Store requirements)", () => {
  test("privacy policy renders", async ({ page }) => {
    await page.goto(`${WEBSITE}/privacy`);
    await expect(page.getByRole("heading", { name: /privacy policy/i, level: 1 })).toBeVisible();
  });
  test("terms of service renders", async ({ page }) => {
    await page.goto(`${WEBSITE}/terms`);
    await expect(page.getByRole("heading", { name: /terms of service/i, level: 1 })).toBeVisible();
  });
  test("account deletion page renders", async ({ page }) => {
    await page.goto(`${WEBSITE}/delete-account`);
    await expect(page.getByRole("heading", { name: /account .* deletion/i, level: 1 })).toBeVisible();
  });
});

test.describe("SEO / GEO assets", () => {
  test("robots.txt references the sitemap", async () => {
    const api = await pwRequest.newContext();
    const res = await api.get(`${WEBSITE}/robots.txt`);
    expect(res.status()).toBe(200);
    expect(await res.text()).toMatch(/Sitemap:.*sitemap\.xml/i);
  });
  test("sitemap.xml lists the legal pages", async () => {
    const api = await pwRequest.newContext();
    const res = await api.get(`${WEBSITE}/sitemap.xml`);
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain("/privacy");
  });
  test("llms.txt is served for AI engines", async () => {
    const api = await pwRequest.newContext();
    const res = await api.get(`${WEBSITE}/llms.txt`);
    expect(res.status()).toBe(200);
    expect(await res.text()).toMatch(/didi bhaiya ki biryani/i);
  });
  test("homepage has JSON-LD, canonical and OG image", async ({ page }) => {
    await page.goto(WEBSITE);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  });
});

test.describe("email-only signup OTP", () => {
  test("requestSignupOtp rejects an invalid email", async () => {
    const api = await pwRequest.newContext();
    const res = await api.post(`${SERVER}/graphql`, {
      data: {
        query: 'mutation { requestSignupOtp(email: "not-an-email", name: "Test") }',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.errors?.length).toBeGreaterThan(0);
  });
});
