import { describe, it, expect, vi } from "vitest";
import { NATIVE_APP_ORIGINS, parseOrigins, makeCorsOrigin } from "../../src/utils/cors";

describe("parseOrigins", () => {
  it("splits, trims and drops empties", () => {
    expect(parseOrigins("a, b ,, c ")).toEqual(["a", "b", "c"]);
  });
  it("returns [] for undefined/empty", () => {
    expect(parseOrigins(undefined)).toEqual([]);
    expect(parseOrigins("")).toEqual([]);
  });
});

describe("NATIVE_APP_ORIGINS", () => {
  it("includes the Capacitor/Ionic webview origins", () => {
    for (const o of ["capacitor://localhost", "ionic://localhost", "https://localhost", "http://localhost"]) {
      expect(NATIVE_APP_ORIGINS.has(o)).toBe(true);
    }
  });
});

describe("makeCorsOrigin", () => {
  const allowed = ["https://admin.didibhaiyakibiryani.com"];

  it("allows origin-less requests (curl / same-origin)", () => {
    const cb = vi.fn();
    makeCorsOrigin(allowed)(undefined, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("allows everything when no origins are configured", () => {
    const cb = vi.fn();
    makeCorsOrigin([])("https://evil.example", cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("allows a configured web origin", () => {
    const cb = vi.fn();
    makeCorsOrigin(allowed)("https://admin.didibhaiyakibiryani.com", cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("allows native app webview origins regardless of config", () => {
    const cb = vi.fn();
    makeCorsOrigin(allowed)("capacitor://localhost", cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("rejects an unknown origin", () => {
    const cb = vi.fn();
    makeCorsOrigin(allowed)("https://evil.example", cb);
    const err = cb.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
  });
});
