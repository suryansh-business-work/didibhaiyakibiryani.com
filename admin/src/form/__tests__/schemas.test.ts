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
  manualOrderSchema,
  expenseSourceSchema,
  rawItemSchema,
  expenseSchema,
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

  it("accepts a present, well-formed 6-digit pincode (refine regex passes)", () => {
    expect(ok(societySchema, { name: "Prestige", pincode: "560001", sortOrder: 0, isActive: true })).toBe(true);
  });

  it("rejects a present but malformed pincode (refine regex fails)", () => {
    expect(errs(societySchema, { name: "Prestige", pincode: "12", sortOrder: 0, isActive: true }).pincode).toBe(
      "Enter a 6-digit pincode"
    );
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
    name: "Veg Biryani", description: "", image: "", price: 199, makingCost: 50, categoryId: "c1",
    spiceSelectable: true, spiceLevel: 1, serves: "2", badge: "NONE", tags: "", isAvailable: true,
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

describe("expenseSourceSchema", () => {
  const person = { type: "PERSON", name: "Ramesh", phone: "9990001111", email: "", bankName: "", accountNumber: "", ifsc: "", note: "", isActive: true };
  const account = { type: "ACCOUNT", name: "Cash A/c", phone: "", email: "", bankName: "HDFC", accountNumber: "1234567890", ifsc: "", note: "", isActive: true };

  it("accepts a person with a phone and an account with bank + number", () => {
    expect(ok(expenseSourceSchema, person)).toBe(true);
    expect(ok(expenseSourceSchema, account)).toBe(true);
  });
  it("requires a phone for a person and bank + number for an account", () => {
    expect(errs(expenseSourceSchema, { ...person, phone: "" }).phone).toBe("Phone is required");
    const e = errs(expenseSourceSchema, { ...account, bankName: "", accountNumber: "" });
    expect(e.bankName).toBe("Bank name is required");
    expect(e.accountNumber).toBe("Account number is required");
  });
  it("flags an invalid email and a missing name", () => {
    expect(errs(expenseSourceSchema, { ...person, email: "nope" }).email).toBe("Enter a valid email");
    expect(errs(expenseSourceSchema, { ...person, name: "" }).name).toBe("Name is required");
  });
});

describe("rawItemSchema", () => {
  it("requires a name and coerces a non-negative market price", () => {
    const r = rawItemSchema.safeParse({ name: "Rice", marketPrice: "60", priceUnit: "KG" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.marketPrice).toBe(60);
    expect(errs(rawItemSchema, { name: "", marketPrice: -1 })).toEqual({
      name: "Name is required",
      marketPrice: "Must be 0 or more",
    });
  });
});

describe("expenseSchema", () => {
  it("requires a raw item and a positive (coerced) amount; source/unit optional", () => {
    const r = expenseSchema.safeParse({ productId: "p1", amount: "250" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.amount).toBe(250);
    expect(errs(expenseSchema, { productId: "", amount: 0 })).toEqual({
      productId: "Select a raw item",
      amount: "Enter an amount above 0",
    });
  });
});

describe("manualOrderSchema", () => {
  const base = {
    orderType: "TAKEAWAY",
    customerMode: "WALKIN",
    userId: "",
    customerName: "Ravi",
    customerPhone: "",
    items: [{ menuItemId: "m1", name: "", price: 0, qty: 1, spiceLevel: 0 }],
    line1: "",
    line2: "",
    city: "",
    pincode: "",
    phone: "",
    discount: 0,
    deliveryFee: 0,
    paymentMethod: "COD",
    paymentStatus: "PAID",
    status: "DELIVERED",
    placedAt: "",
    surveyUrl: "",
    notes: "",
  };

  it("accepts a takeaway walk-in with a menu line", () => {
    expect(ok(manualOrderSchema, base)).toBe(true);
  });

  it("accepts a delivery order for an existing customer with an address and a custom line", () => {
    expect(
      ok(manualOrderSchema, {
        ...base,
        orderType: "DELIVERY",
        customerMode: "EXISTING",
        userId: "u1",
        customerName: "",
        items: [{ menuItemId: "", name: "Special Platter", price: 450, qty: 2, spiceLevel: 1 }],
        line1: "5 Park Rd",
        city: "Bengaluru",
        deliveryFee: 30,
      })
    ).toBe(true);
  });

  it("requires at least one item", () => {
    expect(errs(manualOrderSchema, { ...base, items: [] }).items).toBe("Add at least one item");
  });

  it("flags a missing walk-in name and a missing existing-customer id", () => {
    expect(errs(manualOrderSchema, { ...base, customerName: "" }).customerName).toBe("Enter a customer name");
    expect(errs(manualOrderSchema, { ...base, customerMode: "EXISTING", customerName: "", userId: "" }).userId).toBe(
      "Pick a customer"
    );
  });

  it("requires a street line and city for delivery orders", () => {
    const e = errs(manualOrderSchema, { ...base, orderType: "DELIVERY" });
    expect(e.line1).toBe("Street line required");
    expect(e.city).toBe("City required");
  });

  it("requires a name and price on custom (off-menu) lines", () => {
    const e = errs(manualOrderSchema, {
      ...base,
      items: [{ menuItemId: "", name: "", price: 0, qty: 1, spiceLevel: 0 }],
    });
    expect(e["items.0.name"]).toBe("Name required");
    expect(e["items.0.price"]).toBe("Price above 0");
  });
});
