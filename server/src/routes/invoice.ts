import { Router } from "express";
import { Order, getOrCreateSettings } from "../models/index.js";
import { generateInvoicePdf } from "../utils/invoice.js";
import { logger } from "../utils/logger.js";

/**
 * Public invoice download, gated by the order's secret ratingToken (the same
 * token used by the feedback survey). Lets customers grab their themed PDF
 * invoice from the survey page without logging in.
 */
export const invoiceRouter = Router();

invoiceRouter.get("/invoice/:orderId/:token", async (req, res) => {
  try {
    const { orderId, token } = req.params;
    if (!/^[a-f0-9]{24}$/i.test(orderId)) {
      res.status(404).send("Invoice not found.");
      return;
    }
    const order = await Order.findById(orderId).exec();
    if (!order || order.ratingToken !== token) {
      res.status(404).send("Invoice not found.");
      return;
    }
    const settings = await getOrCreateSettings();
    const pdf = await generateInvoicePdf(order, settings);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="invoice-${order.orderNumber}.pdf"`);
    res.send(pdf);
  } catch (err: unknown) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "Public invoice failed");
    res.status(500).send("Something went wrong.");
  }
});
