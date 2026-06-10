import { describe, it, expect } from "vitest";
import {
  parseTimeToMinutes,
  minutesNowInZone,
  isStoreOpen,
} from "../../src/utils/storeHours";

// 2026-06-10T12:00:00Z == 17:30 IST
const NOON_UTC = new Date("2026-06-10T12:00:00Z");
// 2026-06-10T22:00:00Z == 03:30 IST (next day)
const LATE_UTC = new Date("2026-06-10T22:00:00Z");

describe("parseTimeToMinutes", () => {
  it("parses valid 24h times", () => {
    expect(parseTimeToMinutes("00:00")).toBe(0);
    expect(parseTimeToMinutes("11:30")).toBe(690);
    expect(parseTimeToMinutes("23:59")).toBe(1439);
    expect(parseTimeToMinutes(" 9:05 ")).toBe(545);
  });

  it("rejects malformed times", () => {
    expect(parseTimeToMinutes("24:00")).toBeNull();
    expect(parseTimeToMinutes("11:60")).toBeNull();
    expect(parseTimeToMinutes("lunch")).toBeNull();
    expect(parseTimeToMinutes("")).toBeNull();
  });
});

describe("minutesNowInZone", () => {
  it("converts a UTC instant into zone-local minutes", () => {
    expect(minutesNowInZone("Asia/Kolkata", NOON_UTC)).toBe(17 * 60 + 30);
    expect(minutesNowInZone("UTC", NOON_UTC)).toBe(12 * 60);
  });
});

describe("isStoreOpen", () => {
  it("is open inside a same-day window", () => {
    expect(isStoreOpen("11:00", "23:00", "Asia/Kolkata", NOON_UTC)).toBe(true);
  });

  it("is closed outside the window", () => {
    expect(isStoreOpen("18:00", "23:00", "UTC", NOON_UTC)).toBe(false);
    // 03:30 IST is outside 11:00–23:00
    expect(isStoreOpen("11:00", "23:00", "Asia/Kolkata", LATE_UTC)).toBe(false);
  });

  it("supports overnight windows that span midnight", () => {
    // 03:30 IST is inside 18:00 → 04:00
    expect(isStoreOpen("18:00", "04:00", "Asia/Kolkata", LATE_UTC)).toBe(true);
    // 17:30 IST is outside 18:00 → 04:00
    expect(isStoreOpen("18:00", "04:00", "Asia/Kolkata", NOON_UTC)).toBe(false);
  });

  it("treats identical or malformed times as always open (config safety)", () => {
    expect(isStoreOpen("11:00", "11:00", "Asia/Kolkata", NOON_UTC)).toBe(true);
    expect(isStoreOpen("bad", "23:00", "Asia/Kolkata", NOON_UTC)).toBe(true);
  });

  it("closes exactly at the close minute and opens at the open minute", () => {
    // 12:00 UTC: open window 12:00–13:00 includes the open edge…
    expect(isStoreOpen("12:00", "13:00", "UTC", NOON_UTC)).toBe(true);
    // …but a window closing at 12:00 has just ended.
    expect(isStoreOpen("09:00", "12:00", "UTC", NOON_UTC)).toBe(false);
  });
});
