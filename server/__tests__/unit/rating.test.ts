import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/models/index.js", () => ({
  Review: { create: vi.fn().mockResolvedValue({}) },
  User: { findById: vi.fn().mockReturnValue({ exec: () => Promise.resolve({ name: "Asha" }) }) },
}));

import { saveOrderRating, isValidStars } from "../../src/utils/rating";
import { Review } from "../../src/models/index.js";
import type { IOrder } from "../../src/models";

function order(overrides: Record<string, unknown> = {}): IOrder {
  return {
    id: "o1",
    _id: "o1",
    orderNumber: "DDB-1042",
    user: "u1",
    status: "DELIVERED",
    rating: undefined,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as IOrder;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isValidStars", () => {
  it("accepts integers 1–5 only", () => {
    expect(isValidStars(1)).toBe(true);
    expect(isValidStars(5)).toBe(true);
    expect(isValidStars(0)).toBe(false);
    expect(isValidStars(6)).toBe(false);
    expect(isValidStars(3.5)).toBe(false);
    expect(isValidStars(Number.NaN)).toBe(false);
  });
});

describe("saveOrderRating", () => {
  it("saves the rating and mirrors it as a review", async () => {
    const o = order();
    const saved = await saveOrderRating(o, 5, 4, "  Great!  ");
    expect(saved.rating).toMatchObject({ food: 5, delivery: 4, comment: "Great!" });
    expect(o.save).toHaveBeenCalled();
    expect(Review.create).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 5, authorName: "Asha", isPublished: false })
    );
  });

  it("rejects rating an undelivered order", async () => {
    await expect(saveOrderRating(order({ status: "PREPARING" }), 5, 5)).rejects.toThrow(
      /delivered/i
    );
  });

  it("rejects a second rating", async () => {
    const o = order({ rating: { food: 5, delivery: 5, ratedAt: new Date() } });
    await expect(saveOrderRating(o, 4, 4)).rejects.toThrow(/already/i);
  });

  it("rejects out-of-range stars", async () => {
    await expect(saveOrderRating(order(), 0, 5)).rejects.toThrow(/between 1 and 5/i);
    await expect(saveOrderRating(order(), 5, 9)).rejects.toThrow(/between 1 and 5/i);
  });

  it("still succeeds when the review mirror fails", async () => {
    vi.mocked(Review.create).mockRejectedValueOnce(new Error("db down"));
    const saved = await saveOrderRating(order(), 4, 4);
    expect(saved.rating?.food).toBe(4);
  });
});
