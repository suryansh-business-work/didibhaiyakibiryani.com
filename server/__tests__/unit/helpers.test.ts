import { describe, it, expect } from "vitest";
import { slugify, genOrderNumber } from "../../src/utils/helpers";

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Paneer Tikka Biryani")).toBe("paneer-tikka-biryani");
  });

  it("strips punctuation and collapses whitespace", () => {
    expect(slugify("  Kathal (Jackfruit)!  Biryani ")).toBe("kathal-jackfruit-biryani");
  });

  it("collapses repeated separators", () => {
    expect(slugify("Sweet  --  Lassi")).toBe("sweet-lassi");
  });
});

describe("genOrderNumber", () => {
  it("matches the DDB-XXXXXX format using the unambiguous charset", () => {
    expect(genOrderNumber()).toMatch(/^DDB-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it("is overwhelmingly unique across many calls", () => {
    const generated = new Set(Array.from({ length: 500 }, () => genOrderNumber()));
    expect(generated.size).toBeGreaterThan(490);
  });
});
