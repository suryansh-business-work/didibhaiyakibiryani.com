import { describe, it, expect } from "vitest";
import { DEFAULT_BRAND, emailShell, cardSection, ctaButton } from "../../src/emails/layout";
import { marketingEmail } from "../../src/emails/marketing";
import { ratingUrlFor } from "../../src/emails/notify";
import { orderConfirmedEmail, orderDeliveredEmail } from "../../src/emails/order";
import {
  otpEmail,
  verifyEmailOtp,
  signupEmail,
  loginAlertEmail,
  adminCredentialsEmail,
  passwordChangedEmail,
} from "../../src/emails/auth";
import type { IOrder } from "../../src/models/index.js";

const order = {
  id: "order1",
  orderNumber: "DDB-1001",
  paymentMethod: "COD",
  address: { line1: "12 MG Road", line2: "Apt 4", city: "Bengaluru", pincode: "560001" },
  items: [{ name: "Veg Dum Biryani", qty: 2, price: 199 }],
  subtotal: 398,
  discount: 0,
  deliveryFee: 39,
  total: 437,
  ratingToken: "tok123",
} as unknown as IOrder;

function assertEmail(c: { subject: string; mjml: string }) {
  expect(c.subject.length).toBeGreaterThan(0);
  expect(c.mjml).toContain("<mjml>");
}

describe("layout helpers", () => {
  it("emailShell wraps content in an mjml document", () => {
    const html = emailShell(DEFAULT_BRAND, cardSection("<mj-text>hi</mj-text>"));
    expect(html).toContain("<mjml>");
    expect(html).toContain(DEFAULT_BRAND.brandName);
  });
  it("ctaButton renders the label and href", () => {
    const btn = ctaButton(DEFAULT_BRAND, "Order now", "https://x.test");
    expect(btn).toContain("Order now");
    expect(btn).toContain("https://x.test");
  });
});

describe("auth emails", () => {
  it("otpEmail includes the code", () => {
    const c = otpEmail(DEFAULT_BRAND, "Asha", "123456");
    assertEmail(c);
    expect(c.subject).toContain("123456");
  });
  it("verifyEmailOtp includes the code", () => {
    const c = verifyEmailOtp(DEFAULT_BRAND, "654321");
    assertEmail(c);
    expect(c.subject).toContain("654321");
  });
  it("signupEmail welcomes the user", () => {
    const c = signupEmail(DEFAULT_BRAND, "Asha", "https://order.test");
    assertEmail(c);
    expect(c.mjml).toContain("https://order.test");
  });
  it("loginAlertEmail mentions a sign-in", () => {
    assertEmail(loginAlertEmail(DEFAULT_BRAND, "Asha", new Date("2026-06-14T10:00:00Z")));
  });
  it("adminCredentialsEmail shows email + password", () => {
    const c = adminCredentialsEmail(DEFAULT_BRAND, "Admin", "a@b.com", "Pw0rd", "https://admin.test");
    assertEmail(c);
    expect(c.mjml).toContain("a@b.com");
    expect(c.mjml).toContain("Pw0rd");
  });
  it("passwordChangedEmail renders", () => {
    assertEmail(passwordChangedEmail(DEFAULT_BRAND, "Asha"));
  });
});

describe("marketing + order emails", () => {
  it("marketingEmail with and without a CTA", () => {
    assertEmail(marketingEmail(DEFAULT_BRAND, "Big offer", "Body text", { label: "Go", url: "https://x.test" }));
    assertEmail(marketingEmail(DEFAULT_BRAND, "No CTA", "Body text"));
  });
  it("ratingUrlFor builds a survey link keyed by order number", () => {
    expect(ratingUrlFor(order)).toContain("DDB-1001");
  });
  it("orderConfirmedEmail handles a takeaway order with no address", () => {
    const takeaway = { ...order, address: undefined } as unknown as IOrder;
    const c = orderConfirmedEmail(DEFAULT_BRAND, "Asha", takeaway, "https://track.test");
    expect(c.mjml).toContain("Takeaway / counter");
  });

  it("orderConfirmedEmail includes the order number", () => {
    const c = orderConfirmedEmail(DEFAULT_BRAND, "Asha", order, "https://track.test");
    assertEmail(c);
    expect(c.subject).toContain("DDB-1001");
  });
  it("orderDeliveredEmail renders with and without a rate URL", () => {
    assertEmail(orderDeliveredEmail(DEFAULT_BRAND, "Asha", order, "https://order.test", "https://rate.test"));
    assertEmail(orderDeliveredEmail(DEFAULT_BRAND, "Asha", order, "https://order.test"));
  });
});
