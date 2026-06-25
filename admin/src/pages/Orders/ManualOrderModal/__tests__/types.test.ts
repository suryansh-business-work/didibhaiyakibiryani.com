import { describe, it, expect } from "vitest";
import type { ManualOrderForm } from "../../../../form";
import type { Order } from "../../types";
import {
  computeTotals,
  couponItemDiscount,
  deliveryFeeFor,
  buildManualInput,
  orderToManualForm,
  type CouponOption,
  type DeliverySettings,
} from "../types";

/** Build a complete ManualOrderForm overriding only what a test cares about. */
function form(overrides: Partial<ManualOrderForm> = {}): ManualOrderForm {
  return {
    orderType: "TAKEAWAY",
    customerMode: "WALKIN",
    userId: "",
    customerName: "",
    customerPhone: "",
    items: [],
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    couponCode: "",
    discount: 0,
    deliveryFee: 0,
    paymentMethod: "COD",
    paymentStatus: "PAID",
    status: "PLACED",
    placedAt: "",
    surveyUrl: "",
    notes: "",
    ...overrides,
  };
}

function coupon(overrides: Partial<CouponOption> = {}): CouponOption {
  return {
    id: "c1",
    code: "SAVE",
    title: "Save",
    type: "PERCENT",
    value: 10,
    maxDiscount: null,
    minOrder: 0,
    isActive: true,
    ...overrides,
  };
}

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "o1",
    orderNumber: "DB-1",
    total: 0,
    subtotal: 0,
    discount: 0,
    deliveryFee: 0,
    status: "PLACED",
    paymentMethod: "COD",
    paymentStatus: "PAID",
    placedAt: "2026-06-25T10:00:00.000Z",
    items: [],
    statusHistory: [],
    ...overrides,
  };
}

describe("computeTotals", () => {
  it("sums items, clamps discount, adds delivery fee for DELIVERY", () => {
    const r = computeTotals(
      form({
        orderType: "DELIVERY",
        deliveryFee: 40,
        discount: 50,
        items: [
          { menuItemId: "", name: "Biryani", price: 200, qty: 2, spiceLevel: 1 },
          { menuItemId: "", name: "Roti", price: 30, qty: 3, spiceLevel: 0 },
        ],
      })
    );
    expect(r).toEqual({ subtotal: 490, discount: 50, deliveryFee: 40, total: 480 });
  });

  it("ignores delivery fee for non-delivery orders", () => {
    const r = computeTotals(
      form({
        orderType: "TAKEAWAY",
        deliveryFee: 40,
        items: [{ menuItemId: "", name: "X", price: 100, qty: 1, spiceLevel: 0 }],
      })
    );
    expect(r.deliveryFee).toBe(0);
    expect(r.total).toBe(100);
  });

  it("clamps discount to subtotal and never goes negative", () => {
    const r = computeTotals(
      form({
        discount: 500,
        items: [{ menuItemId: "", name: "X", price: 100, qty: 1, spiceLevel: 0 }],
      })
    );
    expect(r.discount).toBe(100);
    expect(r.total).toBe(0);
  });

  it("treats undefined items and non-numeric price/qty/discount/fee as zero", () => {
    const v = form({ orderType: "DELIVERY" });
    // Force the nullish/NaN branches.
    (v as { items?: unknown }).items = undefined;
    (v as { discount?: unknown }).discount = "abc";
    (v as { deliveryFee?: unknown }).deliveryFee = "xyz";
    const r = computeTotals(v);
    expect(r).toEqual({ subtotal: 0, discount: 0, deliveryFee: 0, total: 0 });
  });

  it("coerces non-numeric item price/qty to zero", () => {
    const v = form();
    (v as { items: unknown }).items = [{ name: "X", price: "nope", qty: "nope", spiceLevel: 0 }];
    const r = computeTotals(v);
    expect(r.subtotal).toBe(0);
  });
});

describe("couponItemDiscount", () => {
  it("returns 0 for an undefined coupon", () => {
    expect(couponItemDiscount(undefined, 1000)).toBe(0);
  });

  it("returns 0 when subtotal is zero or negative", () => {
    expect(couponItemDiscount(coupon(), 0)).toBe(0);
    expect(couponItemDiscount(coupon(), -10)).toBe(0);
  });

  it("returns 0 below the coupon minOrder", () => {
    expect(couponItemDiscount(coupon({ minOrder: 500 }), 400)).toBe(0);
  });

  it("treats a missing minOrder as zero", () => {
    const c = coupon();
    (c as { minOrder?: unknown }).minOrder = undefined;
    expect(couponItemDiscount(c, 1000)).toBe(100);
  });

  it("PERCENT without maxDiscount returns the rounded raw percentage", () => {
    expect(couponItemDiscount(coupon({ value: 15, maxDiscount: null }), 333)).toBe(50);
  });

  it("PERCENT with maxDiscount caps the discount", () => {
    expect(couponItemDiscount(coupon({ value: 50, maxDiscount: 80 }), 1000)).toBe(80);
  });

  it("PERCENT with maxDiscount but raw below cap returns the raw value", () => {
    expect(couponItemDiscount(coupon({ value: 10, maxDiscount: 500 }), 1000)).toBe(100);
  });

  it("FLAT returns value capped at subtotal", () => {
    expect(couponItemDiscount(coupon({ type: "FLAT", value: 60 }), 1000)).toBe(60);
    expect(couponItemDiscount(coupon({ type: "FLAT", value: 1000 }), 600)).toBe(600);
  });

  it("FLAT rounds the value", () => {
    expect(couponItemDiscount(coupon({ type: "FLAT", value: 60.7 }), 1000)).toBe(61);
  });

  it("returns 0 for FREE_DELIVERY and FREE_ITEM coupons", () => {
    expect(couponItemDiscount(coupon({ type: "FREE_DELIVERY" }), 1000)).toBe(0);
    expect(couponItemDiscount(coupon({ type: "FREE_ITEM" }), 1000)).toBe(0);
  });
});

describe("deliveryFeeFor", () => {
  const settings: DeliverySettings = { minDeliveryCost: 40, freeDeliveryAbove: 500 };

  it("returns 0 when delivery is free by coupon", () => {
    expect(deliveryFeeFor(settings, 100, true)).toBe(0);
  });

  it("returns 0 when subtotal meets the free-delivery threshold", () => {
    expect(deliveryFeeFor(settings, 500, false)).toBe(0);
    expect(deliveryFeeFor(settings, 600, false)).toBe(0);
  });

  it("returns the rounded base cost below the threshold", () => {
    expect(deliveryFeeFor({ minDeliveryCost: 39.6, freeDeliveryAbove: 500 }, 100, false)).toBe(40);
  });

  it("ignores the threshold when freeDeliveryAbove is zero", () => {
    expect(deliveryFeeFor({ minDeliveryCost: 40, freeDeliveryAbove: 0 }, 100000, false)).toBe(40);
  });

  it("never returns a negative fee", () => {
    expect(deliveryFeeFor({ minDeliveryCost: -10, freeDeliveryAbove: 0 }, 100, false)).toBe(0);
  });

  it("coerces a non-numeric base cost to zero", () => {
    const bad = { minDeliveryCost: Number.NaN, freeDeliveryAbove: 0 } as DeliverySettings;
    expect(deliveryFeeFor(bad, 100, false)).toBe(0);
  });
});

describe("buildManualInput", () => {
  it("maps a delivery order with an existing customer and a menu item", () => {
    const input = buildManualInput(
      form({
        orderType: "DELIVERY",
        customerMode: "EXISTING",
        userId: "u1",
        customerName: "Ignored",
        customerPhone: "999",
        deliveryFee: 40,
        discount: 20,
        placedAt: "2026-06-25T10:00:00.000Z",
        surveyUrl: " https://s ",
        notes: " note ",
        line1: " 12 Main ",
        line2: " Apt 4 ",
        city: " Pune ",
        state: " MH ",
        pincode: " 411001 ",
        phone: " 555 ",
        items: [{ menuItemId: "m1", name: "Biryani", price: 200, qty: 2, spiceLevel: 1 }],
      })
    );
    expect(input).toEqual({
      orderType: "DELIVERY",
      userId: "u1",
      customerName: null,
      customerPhone: null,
      items: [{ menuItemId: "m1", qty: 2, spiceLevel: 1, complimentary: false }],
      address: {
        line1: "12 Main",
        line2: "Apt 4",
        city: "Pune",
        state: "MH",
        pincode: "411001",
        phone: "555",
      },
      discount: 20,
      deliveryFee: 40,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      status: "PLACED",
      placedAt: "2026-06-25T10:00:00.000Z",
      surveyUrl: "https://s",
      notes: "note",
    });
  });

  it("maps a takeaway order with a walk-in customer and a custom line item", () => {
    const input = buildManualInput(
      form({
        orderType: "TAKEAWAY",
        customerMode: "WALKIN",
        userId: "u1",
        customerName: " Walk In ",
        customerPhone: " 123 ",
        deliveryFee: 99,
        items: [{ menuItemId: "", name: " Custom Dish ", price: 150, qty: 1, spiceLevel: 0 }],
      })
    );
    expect(input.userId).toBeNull();
    expect(input.customerName).toBe("Walk In");
    expect(input.customerPhone).toBe("123");
    expect(input.address).toBeNull();
    expect(input.deliveryFee).toBe(0);
    expect(input.items).toEqual([{ name: "Custom Dish", price: 150, qty: 1, spiceLevel: 0, complimentary: false }]);
  });

  it("excludes a complimentary line from the bill and forwards the flag", () => {
    const v = form({
      orderType: "TAKEAWAY",
      customerMode: "WALKIN",
      customerName: "Ravi",
      items: [
        { menuItemId: "m1", name: "Biryani", price: 200, qty: 1, spiceLevel: 0 },
        { menuItemId: "m2", name: "Dessert", price: 80, qty: 1, spiceLevel: 0, complimentary: true },
      ],
    });
    expect(computeTotals(v).subtotal).toBe(200);
    const input = buildManualInput(v);
    expect(input.items).toEqual([
      { menuItemId: "m1", qty: 1, spiceLevel: 0, complimentary: false },
      { menuItemId: "m2", qty: 1, spiceLevel: 0, complimentary: true },
    ]);
  });

  it("nulls optional address/customer/notes trims when blank and placedAt when empty", () => {
    const input = buildManualInput(
      form({
        orderType: "DELIVERY",
        customerMode: "CONTACT",
        customerName: " Lead ",
        customerPhone: "   ",
        line1: " Street ",
        line2: "   ",
        city: " City ",
        state: "   ",
        pincode: "   ",
        phone: "   ",
        placedAt: "",
        surveyUrl: "   ",
        notes: "   ",
        items: [{ menuItemId: "", name: "X", price: 10, qty: 1, spiceLevel: 0 }],
      })
    );
    expect(input.userId).toBeNull();
    expect(input.customerName).toBe("Lead");
    expect(input.customerPhone).toBeNull();
    expect(input.address).toEqual({
      line1: "Street",
      line2: null,
      city: "City",
      state: null,
      pincode: "",
      phone: null,
    });
    expect(input.placedAt).toBeNull();
    expect(input.surveyUrl).toBeNull();
    expect(input.notes).toBeNull();
  });

  it("coerces non-numeric discount and delivery fee to zero", () => {
    const v = form({ orderType: "DELIVERY" });
    (v as { discount?: unknown }).discount = "nope";
    (v as { deliveryFee?: unknown }).deliveryFee = "nope";
    v.items = [{ menuItemId: "m1", name: "X", price: 1, qty: 1, spiceLevel: 0 }];
    const input = buildManualInput(v);
    expect(input.discount).toBe(0);
    expect(input.deliveryFee).toBe(0);
  });
});

describe("orderToManualForm", () => {
  it("infers delivery from orderType, keeps an existing user, and dedups items by name", () => {
    const f = orderToManualForm(
      order({
        orderType: "DELIVERY",
        user: { id: "u1", name: "Asha", phone: "111", email: "a@b.com" },
        couponCode: "SAVE",
        discount: 30,
        deliveryFee: 40,
        paymentMethod: "ONLINE",
        paymentStatus: "PENDING",
        status: "CONFIRMED",
        placedAt: "2026-06-25T10:00:00.000Z",
        surveyUrl: "https://s",
        notes: "hi",
        address: {
          line1: "12 Main",
          line2: "Apt",
          city: "Pune",
          state: "MH",
          pincode: "411001",
          phone: "555",
        },
        items: [
          { name: "Biryani", price: 200, qty: 1, spiceLevel: 2 },
          { name: "Biryani", price: 200, qty: 2, spiceLevel: 2, complimentary: true },
          { name: "Roti", price: 30, qty: 1 },
        ],
      })
    );
    expect(f.orderType).toBe("DELIVERY");
    expect(f.customerMode).toBe("EXISTING");
    expect(f.userId).toBe("u1");
    expect(f.customerName).toBe("Asha");
    expect(f.customerPhone).toBe("111");
    // Merged Biryani keeps the complimentary flag from either line (OR-merge).
    expect(f.items).toEqual([
      { menuItemId: "", name: "Biryani", price: 200, qty: 3, spiceLevel: 2, complimentary: true },
      { menuItemId: "", name: "Roti", price: 30, qty: 1, spiceLevel: 0, complimentary: false },
    ]);
    expect(f.line1).toBe("12 Main");
    expect(f.phone).toBe("555");
    expect(f.couponCode).toBe("SAVE");
  });

  it("infers delivery from the presence of an address when orderType is absent", () => {
    const f = orderToManualForm(
      order({
        orderType: undefined,
        address: { line1: "A", city: "B", pincode: "C" },
      })
    );
    expect(f.orderType).toBe("DELIVERY");
  });

  it("falls back to walk-in and customerName/phone snapshot when there is no user", () => {
    const f = orderToManualForm(
      order({
        orderType: "TAKEAWAY",
        user: null,
        customerName: "Guest",
        customerPhone: "222",
        address: null,
      })
    );
    expect(f.orderType).toBe("TAKEAWAY");
    expect(f.customerMode).toBe("WALKIN");
    expect(f.userId).toBe("");
    expect(f.customerName).toBe("Guest");
    expect(f.customerPhone).toBe("222");
    expect(f.line1).toBe("");
    expect(f.couponCode).toBe("");
    expect(f.surveyUrl).toBe("");
    expect(f.notes).toBe("");
  });

  it("falls back to the user's name/phone when no customer snapshot is present", () => {
    const f = orderToManualForm(
      order({
        orderType: "TAKEAWAY",
        user: { id: "u9", name: "Ravi", phone: "333", email: "r@x.com" },
        customerName: undefined,
        customerPhone: undefined,
      })
    );
    expect(f.customerName).toBe("Ravi");
    expect(f.customerPhone).toBe("333");
  });

  it("defaults customerName/phone to empty strings when neither snapshot nor user exist", () => {
    const f = orderToManualForm(
      order({
        orderType: "TAKEAWAY",
        user: null,
        customerName: undefined,
        customerPhone: undefined,
      })
    );
    expect(f.customerName).toBe("");
    expect(f.customerPhone).toBe("");
  });

  it("defaults placedAt to an empty string when the order has no placedAt", () => {
    const o = order({ orderType: "TAKEAWAY" });
    (o as { placedAt?: unknown }).placedAt = null;
    const f = orderToManualForm(o);
    expect(f.placedAt).toBe("");
  });
});
