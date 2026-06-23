import { GraphQLError } from "graphql";
import { Review, User } from "../models/index.js";
import type { IOrder } from "../models/index.js";
import { logger } from "./logger.js";

export function isValidStars(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

function bad(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}

/**
 * Persist the post-delivery survey (food + delivery stars) on the order and
 * mirror it as a Review so it feeds the public reviews list. Used by both the
 * in-app mutation and the public email-survey form.
 */
export async function saveOrderRating(
  order: IOrder,
  food: number,
  delivery: number,
  comment?: string
): Promise<IOrder> {
  if (order.status !== "DELIVERED") {
    throw bad("You can rate an order once it has been delivered.");
  }
  if (order.rating) {
    throw bad("This order has already been rated — thank you!");
  }
  if (!isValidStars(food) || !isValidStars(delivery)) {
    throw bad("Ratings must be between 1 and 5 stars.");
  }

  order.rating = {
    food,
    delivery,
    comment: comment?.trim() || undefined,
    ratedAt: new Date(),
  };
  await order.save();

  // Mirror into the public reviews feed (best effort — never blocks the rating).
  try {
    const customer = await User.findById(order.user).exec();
    await Review.create({
      user: order.user,
      order: order._id,
      rating: food,
      text: comment?.trim() || undefined,
      /* v8 ignore next -- author-name fallback for a deleted customer */
      authorName: customer?.name ?? "Verified customer",
      authorMeta: `Order ${order.orderNumber}`,
      isPublished: false,
    });
  } catch (err: unknown) {
    /* v8 ignore next 4 -- non-Error throw fallback in best-effort logging */
    logger.warn(
      { orderId: order.id, err: err instanceof Error ? err.message : String(err) },
      "Could not mirror rating into reviews"
    );
  }
  return order;
}
