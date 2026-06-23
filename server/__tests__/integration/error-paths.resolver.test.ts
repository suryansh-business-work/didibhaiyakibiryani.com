import { describe, it, expect, vi } from "vitest";
import { useTestDb, ctxFor } from "../helpers/db";
import { makeUser, makeOrder } from "../helpers/fixtures";

vi.mock("../../src/utils/mailer.js", () => ({
  sendMail: vi.fn(async () => false),
  sendMailAsync: vi.fn(),
  resolveMailConfig: vi.fn(async () => null),
}));
vi.mock("../../src/utils/imagekit.js", () => ({
  imagekitConfigured: vi.fn(async () => true),
  uploadToImageKit: vi.fn().mockRejectedValue(new Error("ImageKit down")),
}));

import { authResolvers } from "../../src/graphql/resolvers/auth";
import { uploadResolvers } from "../../src/graphql/resolvers/upload";
import { orderResolvers } from "../../src/graphql/resolvers/order";
import { Review } from "../../src/models/index.js";

useTestDb();
const admin = ctxFor("admin1", "ADMIN");

describe("error paths", () => {
  it("requestSignupOtp throws when the verification email can't be sent", async () => {
    await expect(
      authResolvers.Mutation.requestSignupOtp(null, { email: "newcomer@b.com", name: "New" })
    ).rejects.toThrow(/could not send/i);
  });

  it("uploadImage surfaces ImageKit failures", async () => {
    await expect(
      uploadResolvers.Mutation.uploadImage(null, { file: "data:image/png;base64,AAAA", fileName: "x.png" }, admin)
    ).rejects.toThrow(/imagekit down/i);
  });

  it("rateOrder still resolves when mirroring the review fails", async () => {
    const cust = await makeUser();
    const order = await makeOrder(cust.id, { status: "DELIVERED" });
    vi.spyOn(Review, "create").mockRejectedValueOnce(new Error("review fail") as never);
    const rated = await orderResolvers.Mutation.rateOrder(
      null,
      { orderId: order.id, food: 5, delivery: 4, comment: "Great" },
      ctxFor(cust.id, "CUSTOMER")
    );
    expect(rated.id).toBe(order.id);
  });
});
