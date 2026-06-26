import { emailShell, cardSection, ctaButton, type EmailBrand } from "./layout.js";
import type { EmailContent } from "./auth.js";
import type { IOrder } from "../models/index.js";

const inr = (n: number): string => `₹${Math.round(n).toLocaleString("en-IN")}`;

function receiptTable(order: IOrder): string {
  const rows = order.items
    .map(
      (it) => `
      <tr>
        <td style="padding:7px 0;color:#cdbfb0;">${it.qty}× ${it.name}</td>
        <td style="padding:7px 0;color:#cdbfb0;text-align:right;">${inr(it.price * it.qty)}</td>
      </tr>`
    )
    .join("");
  const discountRow = order.discount > 0
    ? `<tr><td style="padding:5px 0;color:#5fb45f;">Discount${order.couponCode ? ` (${order.couponCode})` : ""}</td>
         <td style="padding:5px 0;color:#5fb45f;text-align:right;">− ${inr(order.discount)}</td></tr>`
    : "";
  const deliveryLabel = order.deliveryFee === 0 ? "Free" : inr(order.deliveryFee);
  return `
    <mj-table>
      ${rows}
      <tr><td colspan="2" style="border-top:1px solid #2c211a;padding:0;"></td></tr>
      <tr><td style="padding:7px 0;color:#8d8073;">Subtotal</td>
          <td style="padding:7px 0;color:#8d8073;text-align:right;">${inr(order.subtotal)}</td></tr>
      ${discountRow}
      <tr><td style="padding:5px 0;color:#8d8073;">Delivery</td>
          <td style="padding:5px 0;color:#8d8073;text-align:right;">${deliveryLabel}</td></tr>
      <tr><td style="padding:9px 0;color:#f5ece0;font-weight:800;font-size:16px;">Total</td>
          <td style="padding:9px 0;color:#f5ece0;font-weight:800;font-size:16px;text-align:right;">${inr(order.total)}</td></tr>
    </mj-table>`;
}

export function orderConfirmedEmail(
  brand: EmailBrand,
  name: string,
  order: IOrder,
  trackUrl: string
): EmailContent {
  const payLabel = order.paymentMethod === "COD" ? "Cash on delivery" : "Paid online";
  const a = order.address;
  const addr = a
    ? `${a.line1}${a.line2 ? `, ${a.line2}` : ""}, ${a.city} — ${a.pincode}`
    : "Takeaway / counter";
  const body = cardSection(`
    <mj-text color="#f5ece0" font-size="18px" font-weight="700">Order confirmed — ${order.orderNumber} 🍛</mj-text>
    <mj-text color="#cdbfb0">Thanks ${name}! Your biryani is headed for the dum. Here's your receipt:</mj-text>
    ${receiptTable(order)}
    <mj-text color="#8d8073" font-size="13px" padding-top="10px">
      <strong style="color:#cdbfb0">Payment:</strong> ${payLabel}<br/>
      <strong style="color:#cdbfb0">Deliver to:</strong> ${addr}
    </mj-text>
    ${ctaButton(brand, "Track your order", trackUrl)}
  `);
  return {
    subject: `Order ${order.orderNumber} confirmed — ${brand.brandName}`,
    mjml: emailShell(brand, body),
  };
}

export function orderDeliveredEmail(
  brand: EmailBrand,
  name: string,
  order: IOrder,
  orderUrl: string,
  rateUrl?: string
): EmailContent {
  const rateBlock = rateUrl
    ? `
    <mj-text color="#cdbfb0" padding-top="6px">How was the food and the delivery? It takes 10 seconds:</mj-text>
    ${ctaButton(brand, "Rate your order ★", rateUrl)}`
    : "";
  const body = cardSection(`
    <mj-text color="#f5ece0" font-size="18px" font-weight="700">Delivered! Enjoy your biryani 🎉</mj-text>
    <mj-text color="#cdbfb0">Hi ${name}, order <strong>${order.orderNumber}</strong> (${inr(order.total)}) has been delivered. ${brand.tagline}</mj-text>
    <mj-text color="#8d8073" font-size="13px">Your receipt is attached to this email as a PDF.</mj-text>
    ${rateBlock}
    <mj-text color="#8d8073" font-size="13px">Loved it? Order again anytime — your favourites are saved in the app.</mj-text>
    ${ctaButton(brand, "Order again", orderUrl)}
  `);
  return {
    subject: `Order ${order.orderNumber} delivered — enjoy!`,
    mjml: emailShell(brand, body),
  };
}
