import crypto from "node:crypto";

export const OTP_TTL_MINUTES = 15;
export const OTP_MAX_ATTEMPTS = 5;

/** 6-digit numeric OTP, cryptographically random, never starts with 0. */
export function generateOtp(): string {
  const n = crypto.randomInt(100000, 1000000);
  return String(n);
}

export function hashOtp(code: string, identifier: string): string {
  return crypto.createHash("sha256").update(`${identifier}:${code}`).digest("hex");
}

export function verifyOtpHash(code: string, identifier: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashOtp(code, identifier), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length || actual.length === 0) return false;
  return crypto.timingSafeEqual(actual, expected);
}

export function otpExpiry(now = new Date()): Date {
  return new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);
}

export function isExpired(expiresAt: Date, now = new Date()): boolean {
  return now > expiresAt;
}
