import { describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";
import { useTestDb } from "../helpers/db";
import { makeUser, makeOrder } from "../helpers/fixtures";

const sendMail = vi.fn(async () => true);
vi.mock("../../src/utils/mailer.js", () => ({
  sendMail: (...args: unknown[]) => sendMail(...args),
  sendMailAsync: vi.fn(),
}));

import { notifyOrderEmail, ratingUrlFor } from "../../src/emails/notify.js";
import { getOrCreateSettings } from "../../src/models/index.js";

useTestDb();

describe("notify emails", () => {
  it("sends CONFIRMED and DELIVERED (with PDF invoice) order emails", async () => {
    await getOrCreateSettings();
    const user = await makeUser("CUSTOMER", { email: "buyer@b.com" });
    const order = await makeOrder(user.id, { status: "DELIVERED" });

    notifyOrderEmail(order, "CONFIRMED");
    notifyOrderEmail(order, "DELIVERED");
    await vi.waitFor(() => expect(sendMail).toHaveBeenCalledTimes(2), { timeout: 4000, interval: 30 });

    // an order whose user no longer exists is skipped (job is null)
    const order2 = await makeOrder(new Types.ObjectId().toString());
    notifyOrderEmail(order2, "CONFIRMED");
    await new Promise((r) => setTimeout(r, 200));
    expect(sendMail).toHaveBeenCalledTimes(2);

    expect(ratingUrlFor(order)).toContain(order.orderNumber);
  });
});
