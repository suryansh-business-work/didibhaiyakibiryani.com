import { Router } from "express";
import { getOrCreateSettings } from "../models/index.js";
import { getUserFromAuthHeader } from "../utils/auth.js";
import { getReportBuilder } from "../export/data.js";
import { buildWorkbook } from "../export/excel.js";
import { buildReportPdf } from "../export/pdf.js";
import { logger } from "../utils/logger.js";

/**
 * Admin-only data exports. Mounted at /export, so a request looks like
 * GET /export/orders?format=xlsx&status=DELIVERED. Auth travels in the
 * Authorization header (the admin downloads via fetch + blob), and the route
 * builds the report from full data — no pagination cap.
 */
export const exportRouter = Router();

exportRouter.get("/:report", async (req, res) => {
  try {
    const user = getUserFromAuthHeader(req.headers.authorization);
    if (!user) {
      res.status(401).send("You must be logged in.");
      return;
    }
    if (user.role !== "ADMIN") {
      res.status(403).send("You do not have permission to do that.");
      return;
    }
    const builder = getReportBuilder(req.params.report);
    if (!builder) {
      res.status(404).send("Unknown report.");
      return;
    }
    const report = await builder(req.query, user);
    const base = `${req.params.report}-${new Date().toISOString().slice(0, 10)}`;

    if (req.query.format === "xlsx") {
      const buf = buildWorkbook(report);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${base}.xlsx"`);
      res.send(buf);
      return;
    }

    const settings = await getOrCreateSettings();
    const pdf = await buildReportPdf(report, settings);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${base}.pdf"`);
    res.send(pdf);
  } catch (err: unknown) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "Export failed");
    res.status(500).send("Could not generate the export.");
  }
});
