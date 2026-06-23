import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import type { IOrder, ISettings } from "../models/index.js";

const GOLD = "#b9852f";
const DARK = "#2a1a06";
const MUTED = "#777777";

const money = (n: number): string => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;

function header(doc: PDFKit.PDFDocument, s: ISettings): void {
  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(20).text(s.brandName);
  doc.fillColor(GOLD).font("Helvetica").fontSize(10).text(s.tagline);
  doc.moveDown(0.5);
  doc.fillColor(MUTED).fontSize(9);
  if (s.gstLegalName) doc.text(`Legal name: ${s.gstLegalName}`);
  else if (s.companyName) doc.text(s.companyName);
  if (s.companyAddress) doc.text(s.companyAddress);
  if (s.gstNumber) doc.text(`GSTIN: ${s.gstNumber}`);
  // if (s.fssaiLicense) doc.text(`FSSAI Lic. No.: ${s.fssaiLicense}`);
  if (s.supportEmail || s.supportPhone) {
    doc.text([s.supportEmail, s.supportPhone].filter(Boolean).join(" · "));
  }
  doc.moveDown(1);
  doc.strokeColor(GOLD).lineWidth(1.2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);
}

function partyBlock(doc: PDFKit.PDFDocument, order: IOrder): void {
  const a = order.address;
  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10);
  if (a) {
    doc.text("Billed & delivered to:");
    doc.font("Helvetica").fillColor(MUTED);
    if (order.customerName) doc.text(order.customerName);
    doc.text(`${a.line1}${a.line2 ? `, ${a.line2}` : ""}`);
    doc.text(`${a.city}${a.pincode ? ` — ${a.pincode}` : ""}${a.phone ? ` · ${a.phone}` : ""}`);
    return;
  }
  doc.text("Billed to:");
  doc.font("Helvetica").fillColor(MUTED);
  doc.text([order.customerName, order.customerPhone].filter(Boolean).join(" · ") || "Walk-in customer");
}

function meta(doc: PDFKit.PDFDocument, order: IOrder): void {
  const placed = new Date(order.placedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(14).text("TAX INVOICE");
  doc.font("Helvetica").fontSize(10).fillColor(MUTED);
  doc.text(`Invoice / Order no: ${order.orderNumber}`);
  doc.text(`Order date: ${placed}`);
  doc.text(`Fulfilment: ${order.orderType === "TAKEAWAY" ? "Takeaway / counter" : "Delivery"}`);
  const pay = order.paymentMethod === "COD" ? "Cash on delivery" : "Paid online";
  doc.text(`Payment: ${pay} (${order.paymentStatus})`);
  doc.moveDown(0.6);
  partyBlock(doc, order);
  doc.moveDown(1);
}

/** Effective survey link: per-order override, else the global Settings default. */
function effectiveSurveyUrl(order: IOrder, settings: ISettings): string {
  return order.surveyUrl?.trim() || settings.surveyUrl?.trim() || "";
}

function surveySection(doc: PDFKit.PDFDocument, url: string, qr: Buffer): void {
  doc.moveDown(1.2);
  const top = doc.y;
  doc.image(qr, 50, top, { width: 68 });
  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10).text("Share your feedback", 128, top + 8);
  doc.fillColor(MUTED).font("Helvetica").fontSize(9).text("Scan the code or visit:", 128, doc.y);
  doc.fillColor(GOLD).text(url, 128, doc.y, { link: url, underline: true, width: 400 });
}

function itemsTable(doc: PDFKit.PDFDocument, order: IOrder): void {
  const left = 50;
  const qtyX = 360;
  const rateX = 420;
  const amtX = 490;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK);
  doc.text("Item", left, doc.y, { continued: false });
  const headY = doc.y - 12;
  doc.text("Qty", qtyX, headY);
  doc.text("Rate", rateX, headY);
  doc.text("Amount", amtX, headY);
  doc.moveDown(0.3);
  doc.strokeColor("#dddddd").lineWidth(0.8).moveTo(left, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.4);

  doc.font("Helvetica").fillColor(DARK);
  for (const it of order.items) {
    const rowY = doc.y;
    doc.text(it.name, left, rowY, { width: 290 });
    doc.text(String(it.qty), qtyX, rowY);
    doc.text(money(it.price), rateX, rowY);
    doc.text(money(it.price * it.qty), amtX, rowY);
    doc.moveDown(0.3);
  }
  doc.moveDown(0.4);
  doc.strokeColor("#dddddd").moveTo(left, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);
}

function totals(doc: PDFKit.PDFDocument, order: IOrder): void {
  const labelX = 360;
  const valueX = 470;
  const row = (label: string, value: string, bold = false) => {
    const y = doc.y;
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10);
    doc.fillColor(bold ? DARK : MUTED).text(label, labelX, y);
    doc.text(value, valueX, y, { width: 75, align: "right" });
    doc.moveDown(0.25);
  };
  row("Subtotal", money(order.subtotal));
  if (order.discount > 0) {
    row(`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, `- ${money(order.discount)}`);
  }
  row("Delivery", order.deliveryFee === 0 ? "Free" : money(order.deliveryFee));
  doc.moveDown(0.2);
  row("Total", money(order.total), true);
  doc.moveDown(1.2);
  doc.font("Helvetica").fontSize(8.5).fillColor(MUTED);
  doc.text(
    "Prices are inclusive of all applicable taxes. Thank you for ordering with us!",
    50,
    doc.y,
    { width: 495, align: "center" }
  );
}

/** Render the order invoice as a single-page A4 PDF buffer. */
export async function generateInvoicePdf(order: IOrder, settings: ISettings): Promise<Buffer> {
  const surveyUrl = effectiveSurveyUrl(order, settings);
  const qr = surveyUrl
    ? await QRCode.toBuffer(surveyUrl, { width: 140, margin: 1, color: { dark: DARK, light: "#ffffff" } })
    : null;

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    header(doc, settings);
    meta(doc, order);
    itemsTable(doc, order);
    totals(doc, order);
    if (qr) surveySection(doc, surveyUrl, qr);

    doc.end();
  });
}
