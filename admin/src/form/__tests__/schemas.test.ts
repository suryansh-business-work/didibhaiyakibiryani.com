import { describe, it, expect } from "vitest";
import type { ZodTypeAny } from "zod";
import {
  adminLoginSchema,
  recoverSchema,
  categorySchema,
  societySchema,
  sliderSchema,
  customerSchema,
  riderSchema,
  riderEditSchema,
  couponSchema,
  menuItemSchema,
} from "../schemas";

function errs(schema: ZodTypeAny, value: unknown): Record<string, string> {
  const r = schema.safeParse(value);
  if (r.success) return {};
  return Object.fromEntries(r.error.issues.map((i) => [i.path.join("."), i.message]));
}
const ok = (schema: ZodTypeAny, value: unknown) => schema.safeParse(value).success;

describe("adminLoginSchema", () => {
  it("accepts credentials, flags empties inline", () => {
    expect(ok(adminLoginSchema, { email: "admin@b.com", password: "x" })).toBe(true);
    expect(errs(adminLoginSchema, { email: "", password: "" })).toEqual({
      email: "Enter your email or phone",
      password: "Enter your password",
    });
  });
});

describe("recoverSchema", () => {
  it("requires a valid email + a captcha answer", () => {
    expect(ok(recoverSchema, { email: "a@b.com", answer: "7" })).toBe(true);
    const e = errs(recoverSchema, { email: "nope", answer: "" });
    expect(e.email).toBe("Enter a valid email");
    expect(e.answer).toBe("Solve the captcha");
  });
});

describe("categorySchema", () => {
  it("requires a name and coerces sortOrder", () => {
    const r = categorySchema.safeParse({ name: "Biryani", description: "", sortOrder: "3", isActive: true });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.sortOrder).toBe(3);
    expect(errs(categorySchema, { name: "", sortOrder: -1, isActive: true }).name).toBe("Name is required");
    expect(errs(categorySchema, { name: "X", sortOrder: -1, isActive: true }).sortOrder).toBe("Must be 0 or more");
  });
});

describe("societySchema", () => {
  it("requires a name (area/pincode optional)", () => {
    expect(ok(societySchema, { name: "Prestige", area: "", pincode: "", sortOrder: 0, isActive: true })).toBe(true);
    expect(errs(societySchema, { name: "", sortOrder: 0, isActive: true }).name).toBe("Name is required");
  });
});

describe("sliderSchema", () => {
  it("requires an uploaded image", () => {
    expect(ok(sliderSchema, { imageUrl: "https://img/1.jpg", sortOrder: 0, isActive: true })).toBe(true);
    expect(errs(sliderSchema, { imageUrl: "", sortOrder: 0, isActive: true }).imageUrl).toBe(
      "Upload an image for the slide"
    );
  });
});

describe("customerSchema", () => {
  it("requires a name (phone optional)", () => {
    expect(ok(customerSchema, { name: "Asha", phone: "" })).toBe(true);
    expect(errs(customerSchema, { name: "", phone: "" }).name).toBe("Name is required");
  });
});

describe("riderSchema (create) + riderEditSchema (edit)", () => {
  it("create: requires name, valid email, password ≥ 6", () => {
    expect(ok(riderSchema, { name: "Rider", email: "r@b.com", phone: "", password: "secret1", isActive: true })).toBe(true);
    const e = errs(riderSchema, { name: "", email: "no", phone: "", password: "123", isActive: true });
    expect(e.name).toBe("Name is required");
    expect(e.email).toBe("Enter a valid email");
    expect(e.password).toBe("At least 6 characters");
  });
  it("edit: password optional but validated when present", () => {
    expect(ok(riderEditSchema, { name: "Rider", isActive: true })).toBe(true);
    expect(ok(riderEditSchema, { name: "Rider", password: "", isActive: true })).toBe(true);
    expect(errs(riderEditSchema, { name: "Rider", password: "123", isActive: true }).password).toBe(
      "At least 6 characters"
    );
  });
});

describe("couponSchema", () => {
  const base = {
    code: "SAVE50", title: "Flat 50", description: "", type: "FLAT", value: 50,
    maxDiscount: 0, minOrder: 0, usageLimit: 0, freeItemId: "", appOnly: false,
    firstOrderOnly: false, isActive: true,
  };
  it("accepts a valid flat coupon", () => {
    expect(ok(couponSchema, base)).toBe(true);
  });
  it("requires code + title", () => {
    const e = errs(couponSchema, { ...base, code: "", title: "" });
    expect(e.code).toBe("Code is required");
    expect(e.title).toBe("Title is required");
  });
  it("requires a free item for FREE_ITEM and a positive amount for FLAT/PERCENT", () => {
    expect(errs(couponSchema, { ...base, type: "FREE_ITEM", freeItemId: "" }).freeItemId).toBe("Pick the free item");
    expect(errs(couponSchema, { ...base, value: 0 }).value).toBe("Enter an amount above 0");
    expect(ok(couponSchema, { ...base, type: "FREE_DELIVERY", value: 0 })).toBe(true);
  });
});

describe("menuItemSchema", () => {
  const base = {
    name: "Veg Biryani", description: "", image: "", price: 199, categoryId: "c1",
    spiceLevel: 1, serves: "Serves 1", badge: "NONE", tags: "", isAvailable: true,
  };
  it("accepts a valid item", () => {
    expect(ok(menuItemSchema, base)).toBe(true);
  });
  it("requires name, a positive price and a category", () => {
    expect(errs(menuItemSchema, { ...base, name: "" }).name).toBe("Name is required");
    expect(errs(menuItemSchema, { ...base, price: 0 }).price).toBe("Enter a price above 0");
    expect(errs(menuItemSchema, { ...base, categoryId: "" }).categoryId).toBe("Pick a category");
  });
});
