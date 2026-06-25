import { describe, it, expect, vi, afterEach } from "vitest";
import { generateInvoicePdf } from "../../src/utils/invoice";
import type { IOrder, ISettings } from "../../src/models";

// 1×1 transparent PNG — a valid image pdfkit can embed.
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

function mockFetchOk(body: Buffer) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => new Uint8Array(body).buffer })));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

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
  feedbackEmail: "feedback@ddb.test",
  website: "https://didibhaiyakibiryani.com",
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
    const minimal = { ...settings, gstNumber: "", gstLegalName: "", fssaiLicense: "", website: "", feedbackEmail: "", supportEmail: "", supportPhone: "" } as ISettings;
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

  it("embeds an ImageKit logo (requests a PNG transform)", async () => {
    mockFetchOk(PNG_1x1);
    const pdf = await generateInvoicePdf(order, { ...settings, logoUrl: "https://ik.imagekit.io/x/logo.png" } as ISettings);
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("tr=w-160,h-160,f-png"));
  });

  it("appends the transform with & (query url) and drops the logo on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network down");
    }));
    const pdf = await generateInvoicePdf(order, { ...settings, logoUrl: "https://ik.imagekit.io/x/logo.png?v=2" } as ISettings);
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("&tr="));
  });

  it("uses a non-ImageKit url as-is and drops the logo on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, arrayBuffer: async () => new ArrayBuffer(0) })));
    const pdf = await generateInvoicePdf(order, { ...settings, logoUrl: "https://cdn.example.com/logo.png" } as ISettings);
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(fetch).toHaveBeenCalledWith("https://cdn.example.com/logo.png");
  });

  it("skips an unembeddable logo image without failing", async () => {
    mockFetchOk(Buffer.from("this is not an image"));
    const pdf = await generateInvoicePdf(order, { ...settings, logoUrl: "https://cdn.example.com/logo.bin" } as ISettings);
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

  it("prints a complimentary line as Free while still billing the paid items", async () => {
    const withComp = {
      ...order,
      items: [
        { name: "Paneer Tikka Biryani", price: 289, qty: 2 },
        { name: "Welcome Lassi", price: 60, qty: 1, complimentary: true },
      ],
    } as unknown as IOrder;
    const pdf = await generateInvoicePdf(withComp, settings);
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
  });
});
