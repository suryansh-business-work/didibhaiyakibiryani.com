import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { whatsappConfigured, sendWhatsApp } from "../../src/utils/whatsapp";

const KEYS = ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) saved[k] = process.env[k];
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.restoreAllMocks();
});

describe("whatsappConfigured", () => {
  it("requires both token and phone number id", () => {
    delete process.env.WHATSAPP_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    expect(whatsappConfigured()).toBe(false);
    process.env.WHATSAPP_TOKEN = "t";
    expect(whatsappConfigured()).toBe(false);
    process.env.WHATSAPP_PHONE_NUMBER_ID = "p";
    expect(whatsappConfigured()).toBe(true);
  });
});

describe("sendWhatsApp", () => {
  it("returns false when not configured", async () => {
    delete process.env.WHATSAPP_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    expect(await sendWhatsApp("+91 90000 00000", "hi")).toBe(false);
  });

  it("posts to the Meta API and returns true on success", async () => {
    process.env.WHATSAPP_TOKEN = "t";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    expect(await sendWhatsApp("+91 90000-00000", "hi")).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/123/messages");
    expect(JSON.parse(String(init?.body)).to).toBe("919000000000");
  });

  it("returns false on a non-ok response", async () => {
    process.env.WHATSAPP_TOKEN = "t";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("bad", { status: 400 }));
    expect(await sendWhatsApp("919000000000", "hi")).toBe(false);
  });
});
