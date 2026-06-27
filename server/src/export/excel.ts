import * as XLSX from "xlsx";
import type { Report } from "./types.js";

/** Build a multi-sheet .xlsx workbook (one sheet per report table). */
export function buildWorkbook(report: Report): Buffer {
  const wb = XLSX.utils.book_new();
  for (const t of report.tables) {
    const ws = XLSX.utils.aoa_to_sheet([t.columns.map((c) => c.header), ...t.rows]);
    // Sheet names are capped at 31 chars by the format.
    XLSX.utils.book_append_sheet(wb, ws, t.name.slice(0, 31));
  }
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
