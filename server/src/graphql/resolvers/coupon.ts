import { GraphQLError } from "graphql";
import { Coupon, Order, MenuItem, getOrCreateSettings } from "../../models/index.js";
import { requireRole, type Context } from "../../utils/auth.js";
import { paginate, type PageArgs } from "../../utils/pagination.js";
import { evaluateCoupon, computeDeliveryFee } from "../../utils/pricing.js";

interface CouponInput {
  code: string;
  title: string;
  description?: string;
  type: "PERCENT" | "FLAT" | "FREE_DELIVERY" | "FREE_ITEM";
  value?: number;
  maxDiscount?: number;
  minOrder?: number;
  freeItemId?: string;
  appOnly?: boolean;
  firstOrderOnly?: boolean;
  isActive?: boolean;
  usageLimit?: number;
  validFrom?: Date;
  validTo?: Date;
}

function toDoc(input: CouponInput) {
  const { freeItemId, code, ...rest } = input;
  return {
    ...rest,
    code: code.toUpperCase().trim(),
    freeItem: freeItemId || undefined,
  };
}

export const couponResolvers = {
  Query: {
    coupons: async (_: unknown, { activeOnly }: { activeOnly?: boolean }) => {
      // Reward coupons are personal (redeemed via loyalty) — never list them publicly.
      const filter: Record<string, unknown> = { isReward: { $ne: true } };
      if (activeOnly) {
        filter.isActive = true;
      }
      return Coupon.find(filter).sort({ createdAt: -1 }).exec();
    },

    couponsPage: async (
      _: unknown,
      { activeOnly, ...page }: PageArgs & { activeOnly?: boolean },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN");
      return paginate(Coupon, {
        filter: activeOnly ? { isActive: true } : {},
        searchFields: ["code", "title"],
        sortAllow: ["code", "createdAt", "usedCount"],
        ...page,
      });
    },

    validateCoupon: async (
      _: unknown,
      { code, subtotal }: { code: string; subtotal: number },
      ctx: Context
    ) => {
      const [coupon, settings] = await Promise.all([
        Coupon.findOne({ code: code.toUpperCase().trim() }).exec(),
        getOrCreateSettings(),
      ]);
      let isFirstOrder = true;
      if (ctx.user) {
        isFirstOrder = (await Order.countDocuments({ user: ctx.user.id })) === 0;
      }
      const baseDeliveryFee = computeDeliveryFee(subtotal, 0, {
        minDeliveryCost: settings.minDeliveryCost,
        perKmCharge: settings.perKmCharge,
        freeDeliveryAbove: settings.freeDeliveryAbove,
      });
      const result = evaluateCoupon(coupon, subtotal, { isFirstOrder, fromApp: true, baseDeliveryFee });
      return { ...result, coupon: result.valid ? coupon : null };
    },
  },

  Mutation: {
    createCoupon: async (_: unknown, { input }: { input: CouponInput }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const exists = await Coupon.findOne({ code: input.code.toUpperCase().trim() });
      if (exists)
        throw new GraphQLError("A coupon with this code already exists.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      return Coupon.create(toDoc(input));
    },

    updateCoupon: async (
      _: unknown,
      { id, input }: { id: string; input: CouponInput },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN");
      const coupon = await Coupon.findByIdAndUpdate(id, toDoc(input), { new: true });
      if (!coupon) throw new GraphQLError("Coupon not found.");
      return coupon;
    },

    deleteCoupon: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      await Coupon.findByIdAndDelete(id);
      return true;
    },

    deleteCoupons: async (_: unknown, { ids }: { ids: string[] }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      if (!ids.length) return 0;
      const res = await Coupon.deleteMany({ _id: { $in: ids } }).exec();
      /* v8 ignore next -- deletedCount is always present on the driver result */
      return res.deletedCount ?? 0;
    },
  },

  Coupon: {
    freeItem: (parent: { freeItem?: unknown }) =>
      parent.freeItem ? MenuItem.findById(parent.freeItem as string).exec() : null,
  },
};
