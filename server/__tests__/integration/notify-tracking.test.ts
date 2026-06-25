import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTestDb } from "../helpers/db";
import { makeUser, makeOrder } from "../helpers/fixtures";

const sendWhatsApp = vi.fn(async () => true);
const wa = { configured: true };
vi.mock("../../src/utils/whatsapp.js", () => ({
  whatsappConfigured: () => wa.configured,
  sendWhatsApp: (...args: unknown[]) => sendWhatsApp(...args),
}));

import {
  buildTrackingWhatsApp,
  notifyOrderTrackingWhatsApp,
  trackingUrlFor,
} from "../../src/emails/notify.js";

useTestDb();

beforeEach(() => {
  vi.clearAllMocks();
  wa.configured = true;
});

describe("order tracking WhatsApp", () => {
  it("returns null when WhatsApp is not configured", async () => {
    wa.configured = false;
    const user = await makeUser();
    const order = await makeOrder(user.id);
    expect(await buildTrackingWhatsApp(order)).toBeNull();
  });

  it("uses the order's customerPhone and embeds the tracking link", async () => {
    const user = await makeUser();
    const order = await makeOrder(user.id, { customerPhone: "9000000001" });
    const job = await buildTrackingWhatsApp(order);
    expect(job?.phone).toBe("9000000001");
    expect(job?.text).toContain(trackingUrlFor(order));
  });

  it("falls back to the customer's account phone", async () => {
    const user = await makeUser("CUSTOMER", { phone: "9111111111" });
    const order = await makeOrder(user.id);
    const job = await buildTrackingWhatsApp(order);
    expect(job?.phone).toBe("9111111111");
  });

  it("returns null when there is no phone anywhere", async () => {
    const user = await makeUser();
    const order = await makeOrder(user.id);
    expect(await buildTrackingWhatsApp(order)).toBeNull();
  });

  it("sends when configured and skips when not", async () => {
    const user = await makeUser("CUSTOMER", { phone: "9222222222" });
    const order = await makeOrder(user.id);

    notifyOrderTrackingWhatsApp(order);
    await vi.waitFor(() => expect(sendWhatsApp).toHaveBeenCalledTimes(1), { timeout: 3000, interval: 30 });

    wa.configured = false;
    notifyOrderTrackingWhatsApp(order);
    await new Promise((r) => setTimeout(r, 150));
    expect(sendWhatsApp).toHaveBeenCalledTimes(1);
  });
});
