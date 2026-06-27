import PDFDocument from "pdfkit";
import type { ISettings } from "../models/index.js";
import type { Report, ReportColumn, ReportTable } from "./types.js";

const GOLD = "#b9852f";
const DARK = "#2a1a06";
const MUTED = "#777777";
const TEXT = "#333333";
const MARGIN = 40;

const money = (n: number): string => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;
const cellText = (v: string | number, c: ReportColumn): string =>
  c.money && typeof v === "number" ? money(v) : String(v ?? "");
const alignOf = (c: ReportColumn): "left" | "right" => (c.money ? "right" : "left");

function brandHeader(doc: PDFKit.PDFDocument, settings: ISettings, title: string): void {
  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(18).text(settings.brandName || "Report", MARGIN, MARGIN);
  if (settings.tagline) {
    doc.fillColor(GOLD).font("Helvetica").fontSize(10).text(settings.tagline, MARGIN);
  }
  doc.moveDown(0.4);
  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(14).text(title);
  const generated = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(`Generated ${generated}`);
  doc.moveDown(0.4);
  doc.strokeColor(GOLD).lineWidth(1.2).moveTo(MARGIN, doc.y).lineTo(doc.page.width - MARGIN, doc.y).stroke();
  doc.moveDown(0.6);
}

function drawTable(doc: PDFKit.PDFDocument, t: ReportTable): void {
  const left = MARGIN;
  const totalW = doc.page.width - MARGIN * 2;
  const sumW = t.columns.reduce((a, c) => a + c.width, 0);
  const widths = t.columns.map((c) => (c.width / sumW) * totalW);
  const xs: number[] = [];
  let acc = left;
  for (const w of widths) {
    xs.push(acc);
    acc += w;
  }

  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(12).text(t.name, left);
  doc.moveDown(0.2);

  const headerRow = () => {
    const y = doc.y;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK);
    t.columns.forEach((c, i) => doc.text(c.header, xs[i], y, { width: widths[i] - 6, align: alignOf(c) }));
    doc.moveDown(0.2);
    doc.strokeColor(GOLD).lineWidth(0.8).moveTo(left, doc.y).lineTo(left + totalW, doc.y).stroke();
    doc.moveDown(0.2);
  };
  headerRow();

  if (t.rows.length === 0) {
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text("No records.", left);
    doc.moveDown(0.6);
    return;
  }

  doc.font("Helvetica").fontSize(9).fillColor(TEXT);
  for (const row of t.rows) {
    const texts = row.map((v, i) => cellText(v, t.columns[i]));
    const rowH = Math.max(...texts.map((s, i) => doc.heightOfString(s, { width: widths[i] - 6 })));
    if (doc.y + rowH > doc.page.height - MARGIN) {
      doc.addPage();
      headerRow();
      doc.font("Helvetica").fontSize(9).fillColor(TEXT);
    }
    const y = doc.y;
    texts.forEach((s, i) => doc.text(s, xs[i], y, { width: widths[i] - 6, align: alignOf(t.columns[i]) }));
    doc.y = y + rowH + 4;
  }
  doc.moveDown(0.6);
}

/** Render a report as a landscape A4 PDF buffer (brand header + one block per table). */
export function buildReportPdf(report: Report, settings: ISettings): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: MARGIN });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    brandHeader(doc, settings, report.title);
    report.tables.forEach((t) => drawTable(doc, t));

    doc.end();
  });
}
