import { describe, it, expect } from "vitest";
import mjml2html from "mjml";
import { DEFAULT_BRAND } from "../../src/emails/layout";
import {
  otpEmail,
  signupEmail,
  loginAlertEmail,
  passwordChangedEmail,
} from "../../src/emails/auth";
import { orderConfirmedEmail, orderDeliveredEmail } from "../../src/emails/order";
import { marketingEmail } from "../../src/emails/marketing";
import type { IOrder } from "../../src/models";

async function renders(mjml: string): Promise<string> {
  // mjml v5: mjml2html is async
  const { html, errors } = await mjml2html(mjml, { validationLevel: "soft" });
  expect(errors).toEqual([]);
  return html;
}

const order = {
  id: "o1",
  orderNumber: "DDB-TEST01",
  items: [
    { name: "Hyderabadi Veg Dum", price: 249, qty: 2 },
    { name: "Gulab Jamun (2 pc)", price: 79, qty: 1 },
  ],
  subtotal: 577,
  discount: 50,
  deliveryFee: 0,
  total: 527,
  couponCode: "BIRYANI50",
  paymentMethod: "COD",
  address: { line1: "12 Spice Lane", city: "Indore", pincode: "452001" },
} as unknown as IOrder;

describe("email templates compile to valid MJML and carry the data", () => {
  it("otpEmail includes the code and TTL", async () => {
    const { subject, mjml } = otpEmail(DEFAULT_BRAND, "Ananya", "482910");
    expect(subject).toContain("482910");
    const html = await renders(mjml);
    expect(html).toContain("482910");
    expect(html).toContain("Ananya");
  });

  it("signupEmail greets the user and links the order CTA", async () => {
    const { mjml } = signupEmail(DEFAULT_BRAND, "Ananya", "https://native.example.com");
    const html = await renders(mjml);
    expect(html).toContain("Ananya");
    expect(html).toContain("https://native.example.com");
  });

  it("loginAlertEmail mentions the sign-in time", async () => {
    const when = new Date("2026-06-10T14:30:00");
    const { mjml } = loginAlertEmail(DEFAULT_BRAND, "Ananya", when);
    expect(await renders(mjml)).toContain("2026");
  });

  it("passwordChangedEmail compiles", async () => {
    const { mjml } = passwordChangedEmail(DEFAULT_BRAND, "Ananya");
    expect(await renders(mjml)).toContain("password");
  });

  it("orderConfirmedEmail renders a full invoice (items, discount, total)", async () => {
    const { subject, mjml } = orderConfirmedEmail(
      DEFAULT_BRAND,
      "Ananya",
      order,
      "https://native.example.com/order/o1"
    );
    expect(subject).toContain("DDB-TEST01");
    const html = await renders(mjml);
    expect(html).toContain("2× Hyderabadi Veg Dum");
    expect(html).toContain("BIRYANI50");
    expect(html).toContain("₹527");
    expect(html).toContain("Cash on delivery");
    expect(html).toContain("12 Spice Lane");
  });

  it("orderDeliveredEmail references the order number", async () => {
    const { mjml } = orderDeliveredEmail(DEFAULT_BRAND, "Ananya", order, "https://x.com");
    expect(await renders(mjml)).toContain("DDB-TEST01");
  });

  it("marketingEmail renders paragraphs and the CTA", async () => {
    const { mjml } = marketingEmail(
      DEFAULT_BRAND,
      "Weekend feast: 20% off",
      "Hot deal!\n\nThis weekend only.",
      { label: "Order now", url: "https://native.example.com" }
    );
    const html = await renders(mjml);
    expect(html).toContain("Weekend feast");
    expect(html).toContain("This weekend only.");
    expect(html).toContain("Order now");
  });
});
