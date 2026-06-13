import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resolveMailConfig, mailConfigured, sendMail } from "../../src/utils/mailer";

// Mongo is not connected in unit tests, so settingsOrNull() returns null and
// the mailer falls back to environment variables.
const KEYS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "MAIL_FROM_NAME"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) saved[k] = process.env[k];
  for (const k of KEYS) delete process.env[k];
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.restoreAllMocks();
});

describe("resolveMailConfig", () => {
  it("returns null when SMTP env is incomplete", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    expect(await resolveMailConfig()).toBeNull();
    expect(await mailConfigured()).toBe(false);
  });

  it("builds config from env with port + from defaults", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASS = "secret";
    const cfg = await resolveMailConfig();
    expect(cfg).toMatchObject({
      host: "smtp.example.com",
      port: 587,
      user: "user@example.com",
      fromAddr: "user@example.com",
      fromName: "Didi Bhaiya ki Biryani",
    });
    expect(await mailConfigured()).toBe(true);
  });

  it("honours explicit port and from overrides", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "u";
    process.env.SMTP_PASS = "p";
    process.env.SMTP_PORT = "465";
    process.env.MAIL_FROM = "no-reply@didibhaiyakibiryani.com";
    process.env.MAIL_FROM_NAME = "DDB";
    const cfg = await resolveMailConfig();
    expect(cfg?.port).toBe(465);
    expect(cfg?.fromAddr).toBe("no-reply@didibhaiyakibiryani.com");
    expect(cfg?.fromName).toBe("DDB");
  });
});

describe("sendMail", () => {
  it("returns false (skips) when SMTP is not configured", async () => {
    const ok = await sendMail({ to: "x@y.com", subject: "s", mjml: "<mjml><mj-body></mj-body></mjml>" });
    expect(ok).toBe(false);
  });
});
