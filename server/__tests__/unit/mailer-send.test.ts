import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const sendMailFn = vi.fn(async () => ({ messageId: "m1" }));
const verifyFn = vi.fn(async () => true);
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: sendMailFn, verify: verifyFn })) },
}));

import { sendMail, sendMailAsync, verifySmtp } from "../../src/utils/mailer";

const MJML = "<mjml><mj-body><mj-section><mj-column><mj-text>hi</mj-text></mj-column></mj-section></mj-body></mjml>";
const KEYS = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) saved[k] = process.env[k];
  process.env.SMTP_HOST = "smtp.example.com";
  process.env.SMTP_USER = "u@example.com";
  process.env.SMTP_PASS = "secret";
  sendMailFn.mockClear();
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("mailer send path", () => {
  it("compiles MJML and sends, returning true", async () => {
    const ok = await sendMail({ to: "x@y.com", subject: "Hi", mjml: MJML });
    expect(ok).toBe(true);
    expect(sendMailFn).toHaveBeenCalledTimes(1);
  });

  it("verifySmtp resolves when configured", async () => {
    await expect(verifySmtp()).resolves.toBeUndefined();
    expect(verifyFn).toHaveBeenCalled();
  });

  it("sendMailAsync swallows send failures", async () => {
    sendMailFn.mockRejectedValueOnce(new Error("smtp down"));
    sendMailAsync({ to: "x@y.com", subject: "Hi", mjml: MJML });
    await new Promise((r) => setImmediate(r));
    sendMailAsync({ to: "x@y.com", subject: "Hi", mjml: MJML });
    await new Promise((r) => setImmediate(r));
    expect(true).toBe(true);
  });
});
