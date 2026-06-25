import { describe, it, expect } from "vitest";
import { INDIAN_STATES, STATE_OPTIONS } from "../india";

describe("INDIAN_STATES", () => {
  it("is a non-empty list of unique, trimmed, non-empty strings", () => {
    expect(Array.isArray(INDIAN_STATES)).toBe(true);
    expect(INDIAN_STATES.length).toBe(36);
    expect(new Set(INDIAN_STATES).size).toBe(INDIAN_STATES.length);
    for (const s of INDIAN_STATES) {
      expect(typeof s).toBe("string");
      expect(s.length).toBeGreaterThan(0);
      expect(s).toBe(s.trim());
    }
  });

  it("contains representative states and union territories", () => {
    expect(INDIAN_STATES).toContain("Andhra Pradesh");
    expect(INDIAN_STATES).toContain("Maharashtra");
    expect(INDIAN_STATES).toContain("West Bengal");
    expect(INDIAN_STATES).toContain("Delhi");
    expect(INDIAN_STATES).toContain("Ladakh");
    expect(INDIAN_STATES).toContain("Puducherry");
  });
});

describe("STATE_OPTIONS", () => {
  it("mirrors INDIAN_STATES as { value, label } pairs", () => {
    expect(STATE_OPTIONS.length).toBe(INDIAN_STATES.length);
    STATE_OPTIONS.forEach((opt, i) => {
      expect(opt).toEqual({ value: INDIAN_STATES[i], label: INDIAN_STATES[i] });
      expect(opt.value).toBe(opt.label);
    });
  });
});
