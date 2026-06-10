import { describe, it, expect } from "vitest";
import {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  otpExpiry,
  isExpired,
  OTP_TTL_MINUTES,
} from "../../src/utils/otp";

describe("generateOtp", () => {
  it("produces 6-digit numeric codes", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateOtp()).toMatch(/^[1-9]\d{5}$/);
    }
  });
});

describe("hashOtp / verifyOtpHash", () => {
  const email = "user@example.com";

  it("verifies the correct code for the same identifier", () => {
    const code = generateOtp();
    expect(verifyOtpHash(code, email, hashOtp(code, email))).toBe(true);
  });

  it("rejects a wrong code", () => {
    expect(verifyOtpHash("000000", email, hashOtp("123456", email))).toBe(false);
  });

  it("binds the hash to the identifier (no cross-account reuse)", () => {
    const code = "654321";
    const hash = hashOtp(code, email);
    expect(verifyOtpHash(code, "attacker@example.com", hash)).toBe(false);
  });
});

describe("otpExpiry / isExpired", () => {
  it("expires exactly after the TTL", () => {
    const now = new Date("2026-06-10T12:00:00Z");
    const expiry = otpExpiry(now);
    expect(expiry.getTime() - now.getTime()).toBe(OTP_TTL_MINUTES * 60 * 1000);
    expect(isExpired(expiry, new Date(expiry.getTime() - 1000))).toBe(false);
    expect(isExpired(expiry, new Date(expiry.getTime() + 1000))).toBe(true);
  });
});
