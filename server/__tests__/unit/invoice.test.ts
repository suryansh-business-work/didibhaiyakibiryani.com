import { describe, it, expect } from "vitest";
import { generateInvoicePdf } from "../../src/utils/invoice";
import type { IOrder, ISettings } from "../../src/models";

const settings = {
  brandName: "Didi Bhaiya ki Biryani",
  tagline: "Har bite, yaad rahe!",
  companyName: "D&B Foods",
  companyAddress: "12 Biryani Lane, Bengaluru",
  gstLegalName: "D&B Foods Private Limited",
  gstNumber: "29ABCDE1234F1Z5",
  fssaiLicense: "11223344556677",
  supportEmail: "care@ddb.test",
  supportPhone: "+91 90000 00000",
} as ISettings;

const order = {
  orderNumber: "DDB-1042",
  placedAt: new Date("2026-06-01T13:30:00Z"),
  paymentMethod: "COD",
  paymentStatus: "PAID",
  items: [
    { name: "Paneer Tikka Biryani", price: 289, qty: 2 },
    { name: "Gulab Jamun (2 pc)", price: 99, qty: 1 },
  ],
  subtotal: 677,
  discount: 50,
  couponCode: "TASTY50",
  deliveryFee: 39,
  total: 666,
  address: {
    line1: "12, 4th Cross",
    line2: "Indiranagar",
    city: "Bengaluru",
    pincode: "560038",
    phone: "9876543210",
  },
} as IOrder;

describe("generateInvoicePdf", () => {
  it("produces a non-trivial PDF document", async () => {
    const pdf = await generateInvoicePdf(order, settings);
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1500);
  });

  it("works without optional compliance fields", async () => {
    const minimal = { ...settings, gstNumber: "", gstLegalName: "", fssaiLicense: "" } as ISettings;
    const noDiscount = { ...order, discount: 0, couponCode: undefined, deliveryFee: 0 } as IOrder;
    const pdf = await generateInvoicePdf(noDiscount, minimal);
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
  });
});
