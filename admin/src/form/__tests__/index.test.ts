import { describe, it, expect } from "vitest";
import * as formModule from "../index";

describe("form barrel (index.ts)", () => {
  it("re-exports the RHF field components", () => {
    expect(typeof formModule.RHFField).toBe("function");
    expect(typeof formModule.RHFSelect).toBe("function");
    expect(typeof formModule.RHFCheckbox).toBe("function");
  });

  it("re-exports the Zod schemas via `export *`", () => {
    expect(formModule.adminLoginSchema).toBeDefined();
    expect(formModule.menuItemSchema).toBeDefined();
    expect(formModule.manualOrderSchema).toBeDefined();
    // A schema is usable straight off the barrel.
    expect(formModule.adminLoginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });
});
