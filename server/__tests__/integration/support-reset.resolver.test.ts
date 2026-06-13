import { describe, it, expect, vi } from "vitest";
import { Kind } from "graphql";
import { useTestDb, ctxFor } from "../helpers/db";
import { makeUser, makeOrder } from "../helpers/fixtures";

vi.mock("../../src/utils/mailer.js", () => ({
  sendMail: vi.fn(async () => true),
  sendMailAsync: vi.fn(),
}));

import { supportResolvers } from "../../src/graphql/resolvers/support";
import { adminAccessResolvers } from "../../src/graphql/resolvers/adminAccess";
import { passwordResetResolvers } from "../../src/graphql/resolvers/passwordReset";
import { DateTime } from "../../src/graphql/resolvers/scalars";
import { Otp, User } from "../../src/models/index.js";
import { hashOtp } from "../../src/utils/otp.js";
import { issueCaptcha } from "../../src/utils/captcha.js";
import { comparePassword } from "../../src/utils/auth.js";

useTestDb();

/** Solve the arithmetic captcha question (handles + and unicode minus). */
function solve(question: string): string {
  const m = /(\d+)\s*([+−-])\s*(\d+)/.exec(question);
  if (!m) return "0";
  const a = Number(m[1]);
  const b = Number(m[3]);
  return String(m[2] === "+" ? a + b : a - b);
}

describe("DateTime scalar", () => {
  it("serialize / parseValue / parseLiteral", () => {
    const d = new Date("2026-06-14T00:00:00.000Z");
    expect(DateTime.serialize(d)).toBe("2026-06-14T00:00:00.000Z");
    expect(DateTime.serialize("2026-06-14")).toContain("2026-06-14");
    expect(DateTime.serialize(0)).toBe("1970-01-01T00:00:00.000Z");
    expect(DateTime.serialize({} as unknown)).toBeNull();
    expect(DateTime.parseValue("2026-06-14") instanceof Date).toBe(true);
    expect(DateTime.parseValue(123) instanceof Date).toBe(true);
    expect(DateTime.parseValue(null as unknown)).toBeNull();
    expect(DateTime.parseLiteral({ kind: Kind.STRING, value: "2026-06-14" } as never, null) instanceof Date).toBe(true);
    expect(DateTime.parseLiteral({ kind: Kind.INT, value: "123" } as never, null) instanceof Date).toBe(true);
    expect(DateTime.parseLiteral({ kind: Kind.BOOLEAN, value: true } as never, null)).toBeNull();
  });
});

describe("support resolver", () => {
  it("create / reply / status / queries / field resolvers", async () => {
    const cust = await makeUser("CUSTOMER");
    const other = await makeUser("CUSTOMER");
    const order = await makeOrder(cust.id);
    const cctx = ctxFor(cust.id, "CUSTOMER");
    const actx = ctxFor("admin1", "ADMIN");

    await expect(supportResolvers.Mutation.createSupportTicket(null, { orderId: order.id, subject: "", body: "b" }, cctx)).rejects.toThrow(/subject/i);
    await expect(supportResolvers.Mutation.createSupportTicket(null, { orderId: order.id, subject: "s", body: "" }, cctx)).rejects.toThrow(/describe/i);
    await expect(supportResolvers.Mutation.createSupportTicket(null, { orderId: "651111111111111111111111", subject: "s", body: "b" }, cctx)).rejects.toThrow(/not found/i);
    await expect(supportResolvers.Mutation.createSupportTicket(null, { orderId: order.id, subject: "s", body: "b" }, ctxFor(other.id, "CUSTOMER"))).rejects.toThrow(/your own orders/i);

    const ticket = await supportResolvers.Mutation.createSupportTicket(null, { orderId: order.id, subject: "Late", body: "Where is it", imageUrl: "x" }, cctx);
    expect(ticket.status).toBe("OPEN");

    await expect(supportResolvers.Mutation.replySupportTicket(null, { ticketId: ticket.id, text: "" }, cctx)).rejects.toThrow(/required/i);
    await expect(supportResolvers.Mutation.replySupportTicket(null, { ticketId: ticket.id, text: "hi" }, ctxFor(other.id, "CUSTOMER"))).rejects.toThrow(/not allowed/i);
    const replied = await supportResolvers.Mutation.replySupportTicket(null, { ticketId: ticket.id, text: "On the way" }, actx);
    expect(replied.status).toBe("IN_PROGRESS");
    expect(replied.messages.at(-1)?.by).toBe("ADMIN");

    expect((await supportResolvers.Query.myTickets(null, null, cctx)).length).toBe(1);
    expect((await supportResolvers.Query.orderTickets(null, { orderId: order.id }, cctx)).length).toBe(1);
    expect((await supportResolvers.Query.orderTickets(null, { orderId: order.id }, actx)).length).toBe(1);
    expect((await supportResolvers.Query.supportTickets(null, { status: "IN_PROGRESS" }, actx)).length).toBe(1);

    const closed = await supportResolvers.Mutation.updateSupportTicketStatus(null, { ticketId: ticket.id, status: "CLOSED" }, actx);
    expect(closed.status).toBe("CLOSED");
    await expect(supportResolvers.Mutation.updateSupportTicketStatus(null, { ticketId: "651111111111111111111111", status: "CLOSED" }, actx)).rejects.toThrow(/not found/i);

    expect((await supportResolvers.SupportTicket.order({ order: order.id }))?.id).toBe(order.id);
    expect((await supportResolvers.SupportTicket.user({ user: cust.id }))?.id).toBe(cust.id);
    expect(await supportResolvers.SupportTicket.order({ order: undefined })).toBeNull();
    expect(await supportResolvers.SupportTicket.user({ user: undefined })).toBeNull();
  });
});

describe("adminAccess + passwordReset", () => {
  it("captcha query issues a challenge", async () => {
    const c = await adminAccessResolvers.Query.captcha();
    expect(c.id).toBeTruthy();
    expect(c.question).toMatch(/What is \d+ .+ \d+\?/);
  });

  it("emailAdminCredentials rotates the password behind a captcha", async () => {
    await expect(adminAccessResolvers.Mutation.emailAdminCredentials(null, { email: "a@b.com", captchaId: "x", captchaAnswer: "1" })).rejects.toThrow(/captcha/i);
    const admin = await makeUser("ADMIN", { email: "admin@ddb.com" });
    const before = admin.passwordHash;
    // non-admin email: silently returns true (no enumeration)
    const cap2 = await issueCaptcha();
    expect(await adminAccessResolvers.Mutation.emailAdminCredentials(null, { email: "ghost@x.com", captchaId: cap2.id, captchaAnswer: solve(cap2.question) })).toBe(true);
    const challenge = await issueCaptcha();
    expect(await adminAccessResolvers.Mutation.emailAdminCredentials(null, { email: "admin@ddb.com", captchaId: challenge.id, captchaAnswer: solve(challenge.question) })).toBe(true);
    const reloaded = await User.findById(admin.id);
    expect(reloaded?.passwordHash).not.toBe(before);
  });

  it("requestPasswordReset + resetPassword full cycle", async () => {
    expect(await passwordResetResolvers.Mutation.requestPasswordReset(null, { email: "missing@b.com" })).toBe(true);
    const user = await makeUser("CUSTOMER", { email: "reset@b.com" });
    expect(await passwordResetResolvers.Mutation.requestPasswordReset(null, { email: "reset@b.com" })).toBe(true);

    await expect(passwordResetResolvers.Mutation.resetPassword(null, { email: "reset@b.com", otp: "1", newPassword: "123" })).rejects.toThrow(/6 characters/i);
    await expect(passwordResetResolvers.Mutation.resetPassword(null, { email: "none@b.com", otp: "1", newPassword: "secret1" })).rejects.toThrow(/expired/i);

    const rec = await Otp.findOne({ identifier: "reset@b.com", purpose: "PASSWORD_RESET" });
    // wrong otp increments attempts
    await expect(passwordResetResolvers.Mutation.resetPassword(null, { email: "reset@b.com", otp: "000000", newPassword: "secret1" })).rejects.toThrow(/incorrect/i);

    // overwrite with a known code and reset for real
    const code = "246810";
    await Otp.findOneAndUpdate({ identifier: "reset@b.com", purpose: "PASSWORD_RESET" }, { codeHash: hashOtp(code, "reset@b.com"), attempts: 0 });
    expect(await passwordResetResolvers.Mutation.resetPassword(null, { email: "reset@b.com", otp: code, newPassword: "newpass1" })).toBe(true);
    const reloaded = await User.findById(user.id);
    expect(await comparePassword("newpass1", reloaded!.passwordHash)).toBe(true);

    // locked after max attempts
    await Otp.create({ identifier: "lock@b.com", purpose: "PASSWORD_RESET", codeHash: hashOtp("1", "lock@b.com"), attempts: 5, expiresAt: new Date(Date.now() + 60000) });
    await makeUser("CUSTOMER", { email: "lock@b.com" });
    await expect(passwordResetResolvers.Mutation.resetPassword(null, { email: "lock@b.com", otp: "000000", newPassword: "secret1" })).rejects.toThrow(/too many/i);
    expect(rec).not.toBeNull();
  });
});
