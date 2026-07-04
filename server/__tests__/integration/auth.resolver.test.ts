import { describe, it, expect, vi } from "vitest";
import { useTestDb, ctxFor } from "../helpers/db";

vi.mock("../../src/utils/mailer.js", () => ({
  sendMail: vi.fn(async () => true),
  sendMailAsync: vi.fn(),
}));

import { authResolvers } from "../../src/graphql/resolvers/auth";
import { User, Otp, Lead } from "../../src/models/index.js";
import { hashOtp } from "../../src/utils/otp.js";
import { hashPassword } from "../../src/utils/auth.js";

useTestDb();
const M = authResolvers.Mutation;
const Q = authResolvers.Query;

async function makeCustomer(email = "a@b.com", password = "secret1") {
  return User.create({ name: "Asha", email, passwordHash: await hashPassword(password), role: "CUSTOMER" });
}

describe("auth resolver", () => {
  it("me returns null without a user and the doc with one", async () => {
    expect(await Q.me(null, null, { user: null })).toBeNull();
    const u = await makeCustomer();
    const me = await Q.me(null, null, ctxFor(u.id, "CUSTOMER"));
    expect(me?.email).toBe("a@b.com");
  });

  it("requestSignupOtp validates email, rejects existing, issues otp", async () => {
    await expect(M.requestSignupOtp(null, { email: "bad", name: "x" })).rejects.toThrow(/valid email/i);
    await makeCustomer("taken@b.com");
    await expect(M.requestSignupOtp(null, { email: "taken@b.com", name: "x" })).rejects.toThrow(/already exists/i);
    const ok = await M.requestSignupOtp(null, { email: "new@b.com", name: "New" });
    expect(ok).toBe(true);
    expect(await Otp.findOne({ identifier: "new@b.com", purpose: "EMAIL_VERIFY" })).not.toBeNull();
  });

  it("register requires a valid OTP and creates the account", async () => {
    const email = "reg@b.com";
    const code = "123456";
    await Otp.create({ identifier: email, purpose: "EMAIL_VERIFY", codeHash: hashOtp(code, email), expiresAt: new Date(Date.now() + 60000) });
    await Lead.create({ name: "Reg", phone: "999", email });
    const res = await M.register(null, { input: { name: "Reg", email, password: "secret1", otp: code } });
    expect(res.token).toBeTruthy();
    expect(res.user.email).toBe(email);
    expect(await Otp.findOne({ identifier: email })).toBeNull();
    // Signing up removes the matching non-signup contact.
    expect(await Lead.findOne({ email })).toBeNull();
  });

  it("register rejects short password, missing/expired/wrong otp, and duplicates", async () => {
    await expect(M.register(null, { input: { name: "x", email: "p@b.com", password: "123", otp: "123456" } })).rejects.toThrow(/6 characters/i);
    await expect(M.register(null, { input: { name: "x", email: "nootp@b.com", password: "secret1", otp: "123456" } })).rejects.toThrow(/expired/i);

    const email = "wrong@b.com";
    await Otp.create({ identifier: email, purpose: "EMAIL_VERIFY", codeHash: hashOtp("999999", email), expiresAt: new Date(Date.now() + 60000) });
    await expect(M.register(null, { input: { name: "x", email, password: "secret1", otp: "000000" } })).rejects.toThrow(/incorrect/i);

    await makeCustomer("dupe@b.com");
    await Otp.create({ identifier: "dupe@b.com", purpose: "EMAIL_VERIFY", codeHash: hashOtp("111111", "dupe@b.com"), expiresAt: new Date(Date.now() + 60000) });
    await expect(M.register(null, { input: { name: "x", email: "dupe@b.com", password: "secret1", otp: "111111" } })).rejects.toThrow(/already exists/i);
  });

  it("register locks after too many wrong attempts", async () => {
    const email = "lock@b.com";
    await Otp.create({ identifier: email, purpose: "EMAIL_VERIFY", codeHash: hashOtp("123456", email), attempts: 5, expiresAt: new Date(Date.now() + 60000) });
    await expect(M.register(null, { input: { name: "x", email, password: "secret1", otp: "000000" } })).rejects.toThrow(/too many/i);
  });

  it("login (no OTP) works by email or phone for customers and admins; rejects bad password and disabled accounts", async () => {
    await makeCustomer("login@b.com", "secret1");
    const res = await M.login(null, { emailOrPhone: "login@b.com", password: "secret1" });
    expect(res.token).toBeTruthy();
    await expect(M.login(null, { emailOrPhone: "login@b.com", password: "nope" })).rejects.toThrow(/incorrect/i);

    // Admins sign in through the same mutation (the admin portal) — by email or phone.
    await User.create({ name: "Admin", email: "admin@b.com", phone: "9000000001", passwordHash: await hashPassword("secret1"), role: "ADMIN" });
    expect((await M.login(null, { emailOrPhone: "admin@b.com", password: "secret1" })).token).toBeTruthy();
    expect((await M.login(null, { emailOrPhone: "9000000001", password: "secret1" })).token).toBeTruthy();

    await User.create({ name: "Off", email: "off@b.com", passwordHash: await hashPassword("secret1"), role: "CUSTOMER", isActive: false });
    await expect(M.login(null, { emailOrPhone: "off@b.com", password: "secret1" })).rejects.toThrow(/disabled/i);
  });

  it("updateProfile, addAddress (default handling) and removeAddress", async () => {
    const u = await makeCustomer("addr@b.com");
    const ctx = ctxFor(u.id, "CUSTOMER");
    await M.updateProfile(null, { name: "New Name", phone: "9000000000" }, ctx);
    const withAvatar = await M.updateProfile(null, { avatarUrl: "https://ik/me.jpg", dob: "1995-08-15", anniversary: "2020-02-14" }, ctx);
    expect(withAvatar.avatarUrl).toBe("https://ik/me.jpg");
    expect(withAvatar.dob).toBe("1995-08-15");
    expect(withAvatar.anniversary).toBe("2020-02-14");

    await M.addAddress(null, { input: { line1: "1 St", city: "BLR", pincode: "560001" } }, ctx);
    const withSecond = await M.addAddress(null, { input: { line1: "2 St", city: "BLR", pincode: "560002", isDefault: true } }, ctx);
    expect(withSecond.addresses).toHaveLength(2);
    expect(withSecond.addresses.find((a) => a.line1 === "2 St")?.isDefault).toBe(true);

    const addrId = String(withSecond.addresses[0]._id);
    const after = await M.removeAddress(null, { addressId: addrId }, ctx);
    expect(after.addresses).toHaveLength(1);
  });

  it("setDefaultAddress switches the active address and rejects an unknown id", async () => {
    const u = await makeCustomer("setdef@b.com");
    const ctx = ctxFor(u.id, "CUSTOMER");
    await M.addAddress(null, { input: { line1: "A", city: "BLR", pincode: "1" } }, ctx);
    const two = await M.addAddress(null, { input: { line1: "B", city: "BLR", pincode: "2", isDefault: true } }, ctx);
    const aId = String(two.addresses.find((a) => a.line1 === "A")?._id);

    const res = await M.setDefaultAddress(null, { addressId: aId }, ctx);
    expect(res.addresses.find((a) => a.line1 === "A")?.isDefault).toBe(true);
    expect(res.addresses.find((a) => a.line1 === "B")?.isDefault).toBe(false);

    await expect(
      M.setDefaultAddress(null, { addressId: "507f1f77bcf86cd799439011" }, ctx)
    ).rejects.toThrow(/not found/i);
  });
});
