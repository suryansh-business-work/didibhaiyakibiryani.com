import { Router } from "express";
import { Order, getOrCreateSettings } from "../models/index.js";
import { generateReceiptPdf } from "../utils/receipt.js";
import { logger } from "../utils/logger.js";

/**
 * Public receipt download, gated by the order's secret ratingToken (the same
 * token used by the feedback survey). Lets customers grab their themed PDF
 * receipt from the survey / tracking page without logging in.
 */
export const receiptRouter = Router();

receiptRouter.get("/receipt/:orderId/:token", async (req, res) => {
  try {
    const { orderId, token } = req.params;
    if (!/^[a-f0-9]{24}$/i.test(orderId)) {
      res.status(404).send("Receipt not found.");
      return;
    }
    const order = await Order.findById(orderId).exec();
    if (!order || order.ratingToken !== token) {
      res.status(404).send("Receipt not found.");
      return;
    }
    const settings = await getOrCreateSettings();
    const pdf = await generateReceiptPdf(order, settings);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="receipt-${order.orderNumber}.pdf"`);
    res.send(pdf);
  } catch (err: unknown) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "Public receipt failed");
    res.status(500).send("Something went wrong.");
  }
});
