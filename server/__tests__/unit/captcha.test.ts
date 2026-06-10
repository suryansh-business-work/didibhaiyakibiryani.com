import { describe, it, expect, vi, beforeEach } from "vitest";

const otpStore = new Map<string, { codeHash: string; expiresAt: Date }>();

vi.mock("../../src/models/index.js", () => ({
  Otp: {
    create: vi.fn(async (doc: { identifier: string; codeHash: string; expiresAt: Date }) => {
      otpStore.set(doc.identifier, { codeHash: doc.codeHash, expiresAt: doc.expiresAt });
      return doc;
    }),
    findOneAndDelete: vi.fn((q: { identifier: string }) => ({
      exec: async () => {
        const found = otpStore.get(q.identifier);
        otpStore.delete(q.identifier);
        return found ?? null;
      },
    })),
  },
}));

import {
  buildCaptcha,
  issueCaptcha,
  verifyCaptcha,
  generatePassword,
} from "../../src/utils/captcha";

beforeEach(() => {
  otpStore.clear();
  vi.clearAllMocks();
});

describe("buildCaptcha", () => {
  it("builds an addition challenge with the right answer", () => {
    expect(buildCaptcha(3, 4, true)).toEqual({ question: "What is 3 + 4?", answer: "7" });
  });

  it("builds a subtraction challenge that never goes negative", () => {
    expect(buildCaptcha(3, 9, false)).toEqual({ question: "What is 9 − 3?", answer: "6" });
    expect(buildCaptcha(9, 3, false)).toEqual({ question: "What is 9 − 3?", answer: "6" });
  });

  it("randomized output stays well-formed", () => {
    for (let i = 0; i < 20; i += 1) {
      const c = buildCaptcha();
      expect(c.question).toMatch(/^What is \d+ [+−] \d+\?$/);
      expect(Number.parseInt(c.answer, 10)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("issueCaptcha / verifyCaptcha", () => {
  it("verifies the correct answer exactly once", async () => {
    const challenge = await issueCaptcha();
    expect(challenge.id).toMatch(/^[a-f0-9]{24}$/);
    const m = /What is (\d+) ([+−]) (\d+)\?/.exec(challenge.question)!;
    const answer =
      m[2] === "+"
        ? Number.parseInt(m[1], 10) + Number.parseInt(m[3], 10)
        : Number.parseInt(m[1], 10) - Number.parseInt(m[3], 10);

    await expect(verifyCaptcha(challenge.id, String(answer))).resolves.toBe(true);
    // consumed — a replay fails
    await expect(verifyCaptcha(challenge.id, String(answer))).resolves.toBe(false);
  });

  it("rejects a wrong answer and consumes the challenge", async () => {
    const challenge = await issueCaptcha();
    await expect(verifyCaptcha(challenge.id, "99999")).resolves.toBe(false);
  });

  it("rejects unknown captcha ids", async () => {
    await expect(verifyCaptcha("deadbeefdeadbeefdeadbeef", "5")).resolves.toBe(false);
  });
});

describe("generatePassword", () => {
  it("generates strong unique passwords of the requested length", () => {
    const a = generatePassword();
    const b = generatePassword();
    expect(a).toHaveLength(14);
    expect(generatePassword(20)).toHaveLength(20);
    expect(a).not.toBe(b);
  });
});
