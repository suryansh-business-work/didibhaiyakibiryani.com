import { Router, urlencoded, type Request, type Response } from "express";
import { Order, getOrCreateSettings } from "../models/index.js";
import type { IOrder } from "../models/index.js";
import { saveOrderRating } from "../utils/rating.js";
import { logger } from "../utils/logger.js";
import {
  ratingShell,
  ratingFormHtml,
  ratingThanksHtml,
  ratingErrorHtml,
} from "./ratingPage.js";

/**
 * Public post-delivery rating survey ("external link" from the delivered
 * email). The order's secret ratingToken authorises the page — no login.
 */
export const ratingRouter = Router();

async function renderPage(res: Response, status: number, inner: string): Promise<void> {
  const s = await getOrCreateSettings();
  res.status(status).type("html").send(ratingShell(s.brandName, s.primaryColor, inner));
}

async function findOrder(req: Request): Promise<IOrder | null> {
  const { orderId, token } = req.params;
  if (!orderId?.match(/^[a-f0-9]{24}$/i) || !token) return null;
  const order = await Order.findById(orderId).exec();
  if (!order || order.ratingToken !== token) return null;
  return order;
}

ratingRouter.get("/rate/:orderId/:token", async (req, res) => {
  try {
    const order = await findOrder(req);
    if (!order) {
      await renderPage(res, 404, ratingErrorHtml("This rating link is invalid."));
      return;
    }
    if (order.rating) {
      await renderPage(res, 200, ratingThanksHtml());
      return;
    }
    if (order.status !== "DELIVERED") {
      await renderPage(res, 400, ratingErrorHtml("You can rate once the order is delivered."));
      return;
    }
    await renderPage(res, 200, ratingFormHtml(order.orderNumber));
  } catch (err: unknown) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "Rating page failed");
    res.status(500).type("html").send("Something went wrong.");
  }
});

ratingRouter.post(
  "/rate/:orderId/:token",
  urlencoded({ extended: false, limit: "10kb" }),
  async (req, res) => {
    try {
      const order = await findOrder(req);
      if (!order) {
        await renderPage(res, 404, ratingErrorHtml("This rating link is invalid."));
        return;
      }
      const food = Number.parseInt(String(req.body.food), 10);
      const delivery = Number.parseInt(String(req.body.delivery), 10);
      const comment = typeof req.body.comment === "string" ? req.body.comment : undefined;
      await saveOrderRating(order, food, delivery, comment);
      await renderPage(res, 200, ratingThanksHtml());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not save your rating.";
      await renderPage(res, 400, ratingErrorHtml(message));
    }
  }
);
