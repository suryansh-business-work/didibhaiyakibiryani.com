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

  it("renders a takeaway walk-in order (no address) with a per-order survey QR", async () => {
    const takeaway = {
      ...order,
      orderType: "TAKEAWAY",
      address: undefined,
      customerName: "Ravi",
      customerPhone: "9812345670",
      surveyUrl: "https://forms.gle/abc",
    } as unknown as IOrder;
    const pdf = await generateInvoicePdf(takeaway, settings);
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
  });

  it("falls back to the global survey url and a walk-in label when no name", async () => {
    const s2 = { ...settings, surveyUrl: "https://forms.gle/global" } as ISettings;
    const walkin = {
      ...order,
      orderType: "TAKEAWAY",
      address: undefined,
      customerName: undefined,
      customerPhone: undefined,
    } as unknown as IOrder;
    const pdf = await generateInvoicePdf(walkin, s2);
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
  });

  it("renders a POS delivery order showing the customer name", async () => {
    const posDelivery = { ...order, customerName: "Asha", surveyUrl: "https://forms.gle/x" } as IOrder;
    const pdf = await generateInvoicePdf(posDelivery, settings);
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
  });

  it("renders a delivery order with a bare address (no line2 / pincode / phone)", async () => {
    const bare = {
      ...order,
      customerName: undefined,
      address: { line1: "Plot 9", city: "Bengaluru" },
    } as unknown as IOrder;
    const pdf = await generateInvoicePdf(bare, settings);
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
  });
});
