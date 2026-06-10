import crypto from "node:crypto";
import { Otp } from "../models/index.js";
import { hashOtp, verifyOtpHash, isExpired } from "./otp.js";

export const CAPTCHA_TTL_MS = 10 * 60 * 1000;
export const CAPTCHA_MAX_ATTEMPTS = 5;

export interface CaptchaChallenge {
  id: string;
  question: string;
}

/** Pure generator (exported for tests): simple arithmetic challenge. */
export function buildCaptcha(
  a = crypto.randomInt(2, 10),
  b = crypto.randomInt(2, 10),
  plus = crypto.randomInt(0, 2) === 0
): { question: string; answer: string } {
  // Subtraction keeps the answer non-negative by ordering the operands.
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  if (plus) {
    return { question: `What is ${a} + ${b}?`, answer: String(a + b) };
  }
  return { question: `What is ${hi} − ${lo}?`, answer: String(hi - lo) };
}

/** Issue a server-verified captcha (answer stored hashed, auto-expiring). */
export async function issueCaptcha(): Promise<CaptchaChallenge> {
  const id = crypto.randomBytes(12).toString("hex");
  const { question, answer } = buildCaptcha();
  await Otp.create({
    identifier: `captcha:${id}`,
    purpose: "CAPTCHA",
    codeHash: hashOtp(answer, id),
    expiresAt: new Date(Date.now() + CAPTCHA_TTL_MS),
  });
  return { id, question };
}

/** One-shot verification: the challenge is consumed whether right or wrong. */
export async function verifyCaptcha(id: string, answer: string): Promise<boolean> {
  const doc = await Otp.findOneAndDelete({
    identifier: `captcha:${id}`,
    purpose: "CAPTCHA",
  }).exec();
  if (!doc || isExpired(doc.expiresAt)) return false;
  return verifyOtpHash(answer.trim(), id, doc.codeHash);
}

const PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

/** Strong random password for the email-credentials flow. */
export function generatePassword(length = 14): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += PASSWORD_ALPHABET[crypto.randomInt(0, PASSWORD_ALPHABET.length)];
  }
  return out;
}
