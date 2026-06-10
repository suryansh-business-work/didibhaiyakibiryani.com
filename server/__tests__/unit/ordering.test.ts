import { describe, it, expect } from "vitest";
import { assertOrderingAvailable, type OrderingSettings } from "../../src/utils/ordering";

// 12:00 UTC = 17:30 IST, inside default 11:00–23:00 hours.
const OPEN_NOW = new Date("2026-06-10T12:00:00Z");

function settings(overrides: Partial<OrderingSettings> = {}): OrderingSettings {
  return {
    maintenance: { website: false, server: false, admin: false, native: false, delivery: false },
    storeOpenTime: "11:00",
    storeCloseTime: "23:00",
    storeTimezone: "Asia/Kolkata",
    codEnabled: true,
    onlineEnabled: true,
    ...overrides,
  } as OrderingSettings;
}

describe("assertOrderingAvailable", () => {
  it("allows ordering when open and the method is enabled", () => {
    expect(() => assertOrderingAvailable(settings(), "COD", OPEN_NOW)).not.toThrow();
    expect(() => assertOrderingAvailable(settings(), "ONLINE", OPEN_NOW)).not.toThrow();
  });

  it("blocks ordering during server maintenance", () => {
    const s = settings({
      maintenance: { website: false, server: true, admin: false, native: false, delivery: false },
    });
    expect(() => assertOrderingAvailable(s, "COD", OPEN_NOW)).toThrow(/maintenance/i);
  });

  it("blocks ordering when the store is closed and names the hours", () => {
    const s = settings({ storeOpenTime: "18:00", storeCloseTime: "23:00", storeTimezone: "UTC" });
    expect(() => assertOrderingAvailable(s, "COD", OPEN_NOW)).toThrow(/18:00–23:00/);
  });

  it("blocks a disabled payment method but allows the other", () => {
    const noCod = settings({ codEnabled: false });
    expect(() => assertOrderingAvailable(noCod, "COD", OPEN_NOW)).toThrow(/cash on delivery/i);
    expect(() => assertOrderingAvailable(noCod, "ONLINE", OPEN_NOW)).not.toThrow();

    const noOnline = settings({ onlineEnabled: false });
    expect(() => assertOrderingAvailable(noOnline, "ONLINE", OPEN_NOW)).toThrow(/online payment/i);
    expect(() => assertOrderingAvailable(noOnline, "COD", OPEN_NOW)).not.toThrow();
  });
});
