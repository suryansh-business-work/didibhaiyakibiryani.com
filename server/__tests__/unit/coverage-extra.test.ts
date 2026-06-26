import { describe, it, expect } from "vitest";
import { evaluateCoupon } from "../../src/utils/pricing";
import { verifyOtpHash } from "../../src/utils/otp";
import { orderConfirmedEmail, orderDeliveredEmail } from "../../src/emails/order";
import { marketingEmail } from "../../src/emails/marketing";
import { generateReceiptPdf } from "../../src/utils/receipt";
import type { ICoupon, IOrder, ISettings } from "../../src/models/index.js";
import type { EmailBrand } from "../../src/emails/layout";

const FULL_BRAND: EmailBrand = {
  brandName: "DDB",
  tagline: "yum",
  logoUrl: "https://cdn.example/logo.png",
  primaryColor: "#e4b65c",
  companyName: "D&B Foods",
  companyAddress: "12 Biryani Lane, Bengaluru",
  supportEmail: "care@example.com",
  supportPhone: "9000000000",
};

function coupon(over: Partial<ICoupon>): ICoupon {
  return {
    code: "X", title: "X", type: "FLAT", value: 50, minOrder: 0,
    isActive: true, usedCount: 0, appOnly: false, firstOrderOnly: false, ...over,
  } as ICoupon;
}

describe("evaluateCoupon — rejection branches", () => {
  it("flags null / inactive / not-yet-active / expired / fully-claimed / below-min / first-order / app-only", () => {
    const future = new Date(Date.now() + 86_400_000);
    const past = new Date(Date.now() - 86_400_000);
    expect(evaluateCoupon(null, 500).valid).toBe(false);
    expect(evaluateCoupon(coupon({ isActive: false }), 500).valid).toBe(false);
    expect(evaluateCoupon(coupon({ validFrom: future }), 500).message).toMatch(/isn't active yet/i);
    expect(evaluateCoupon(coupon({ validTo: past }), 500).message).toMatch(/expired/i);
    expect(evaluateCoupon(coupon({ usageLimit: 1, usedCount: 1 }), 500).message).toMatch(/claimed/i);
    expect(evaluateCoupon(coupon({ minOrder: 1000 }), 100).message).toMatch(/more to use/i);
    expect(evaluateCoupon(coupon({ firstOrderOnly: true }), 500, { isFirstOrder: false }).message).toMatch(/first order/i);
    expect(evaluateCoupon(coupon({ appOnly: true }), 500, { fromApp: false }).message).toMatch(/app/i);
  });
});

describe("verifyOtpHash", () => {
  it("returns false for a wrong-length or empty expected hash", () => {
    expect(verifyOtpHash("123456", "a@b.com", "deadbeef")).toBe(false);
    expect(verifyOtpHash("123456", "a@b.com", "")).toBe(false);
  });
});

describe("order emails — discount + online payment + full brand", () => {
  const o = {
    id: "o9",
    orderNumber: "DDB-9",
    paymentMethod: "ONLINE",
    address: { line1: "1 St", city: "BLR", pincode: "560001" },
    items: [{ name: "Biryani", qty: 1, price: 200 }],
    subtotal: 200,
    discount: 30,
    couponCode: "SAVE30",
    deliveryFee: 0,
    total: 170,
    ratingToken: "t",
  } as unknown as IOrder;

  it("renders logo, company address and a discount row", () => {
    const c = orderConfirmedEmail(FULL_BRAND, "Asha", o, "https://track");
    expect(c.mjml).toContain("logo.png");
    expect(c.mjml).toContain("Biryani Lane");
    expect(c.mjml).toContain("SAVE30");
    const d = orderDeliveredEmail(FULL_BRAND, "Asha", o, "https://app", "https://rate");
    expect(d.subject.toLowerCase()).toContain("delivered");
  });
});

describe("marketingEmail", () => {
  it("renders multiple paragraphs with and without a CTA", () => {
    const brand = FULL_BRAND;
    const withCta = marketingEmail(brand, "Big news", "Line one.\n\nLine two.", { label: "Order", url: "https://x" });
    expect(withCta.mjml).toContain("Order");
    const noCta = marketingEmail(brand, "Plain", "Just one paragraph.");
    expect(noCta.subject).toBe("Plain");
  });
});

describe("order email — discount with no coupon code", () => {
  it("renders a discount row without a code", () => {
    const o = {
      orderNumber: "DDB-7", paymentMethod: "COD",
      address: { line1: "1 St", city: "B", pincode: "1" },
      items: [{ name: "X", qty: 1, price: 100 }],
      subtotal: 100, discount: 20, deliveryFee: 39, total: 119, ratingToken: "t", id: "o7",
    } as unknown as IOrder;
    expect(orderConfirmedEmail(FULL_BRAND, "A", o, "https://t").mjml).toContain("Discount");
  });
});

describe("receipt — no line2 / no phone / no discount / online / free delivery", () => {
  it("generates a non-empty PDF", async () => {
    const settings = {
      brandName: "DDB", companyName: "D&B", companyAddress: "",
      gstLegalName: "", gstNumber: "", fssaiLicense: "", supportEmail: "", supportPhone: "",
    } as ISettings;
    const order = {
      orderNumber: "DDB-2",
      placedAt: new Date("2026-06-01T13:30:00Z"),
      paymentMethod: "ONLINE",
      paymentStatus: "PAID",
      items: [{ name: "Veg Dum", price: 100, qty: 1 }],
      subtotal: 100,
      discount: 0,
      deliveryFee: 0,
      total: 100,
      address: { line1: "1 St", city: "BLR", pincode: "560001" },
    } as IOrder;
    const pdf = await generateReceiptPdf(order, settings);
    expect(pdf.length).toBeGreaterThan(100);
  });

  it("generates a PDF with a discount but no coupon code", async () => {
    const settings = { brandName: "DDB", companyName: "D&B", companyAddress: "", gstLegalName: "", gstNumber: "", fssaiLicense: "", supportEmail: "", supportPhone: "" } as ISettings;
    const order = {
      orderNumber: "DDB-3", placedAt: new Date("2026-06-01T13:30:00Z"), paymentMethod: "COD", paymentStatus: "PAID",
      items: [{ name: "X", price: 100, qty: 1 }], subtotal: 100, discount: 25, deliveryFee: 39, total: 114,
      address: { line1: "1 St", line2: "Near park", city: "BLR", pincode: "560001", phone: "9" },
    } as IOrder;
    expect((await generateReceiptPdf(order, settings)).length).toBeGreaterThan(100);
  });
});
