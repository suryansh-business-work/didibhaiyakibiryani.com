import { randomBytes } from "node:crypto";
import { GraphQLError } from "graphql";
import { Coupon, MenuItem, User, getOrCreateSettings } from "../../models/index.js";
import { requireAuth, type Context } from "../../utils/auth.js";

function badRequest(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}

export const loyaltyResolvers = {
  Query: {
    // The signed-in customer's loyalty snapshot ("Cheesy Rewards").
    myRewards: async (_: unknown, __: unknown, ctx: Context) => {
      const u = requireAuth(ctx);
      const [user, settings] = await Promise.all([User.findById(u.id).exec(), getOrCreateSettings()]);
      const points = user?.loyaltyPoints ?? 0;
      const perReward = Math.max(1, settings.pointsPerReward);
      return {
        enabled: settings.loyaltyEnabled,
        points,
        pointsPerOrder: settings.pointsPerOrder,
        pointsMinOrder: settings.pointsMinOrder,
        pointsPerReward: settings.pointsPerReward,
        rewardsAvailable: Math.floor(points / perReward),
        rewardItem: settings.rewardItem, // resolved by Rewards.rewardItem
      };
    },
  },

  Mutation: {
    // Spend points on a reward → a single-use, hidden FREE_ITEM coupon the
    // customer applies at checkout through the normal coupon flow.
    redeemReward: async (_: unknown, __: unknown, ctx: Context) => {
      const u = requireAuth(ctx);
      const settings = await getOrCreateSettings();
      if (!settings.loyaltyEnabled) {
        throw badRequest("Rewards are not available right now.");
      }
      if (!settings.rewardItem) {
        throw badRequest("No reward item is configured yet.");
      }
      const user = await User.findById(u.id).exec();
      if (!user) {
        throw badRequest("Account not found.");
      }
      const cost = Math.max(1, settings.pointsPerReward);
      if (user.loyaltyPoints < cost) {
        throw badRequest("You don't have enough points to redeem yet.");
      }
      user.loyaltyPoints -= cost;
      await user.save();
      const code = `RWD-${randomBytes(4).toString("hex").toUpperCase()}`;
      await Coupon.create({
        code,
        title: "Loyalty reward",
        type: "FREE_ITEM",
        value: 0,
        minOrder: 0,
        freeItem: settings.rewardItem,
        appOnly: true,
        isReward: true,
        usageLimit: 1,
        usedCount: 0,
        isActive: true,
      });
      return { code, points: user.loyaltyPoints };
    },
  },

  Rewards: {
    rewardItem: (parent: { rewardItem?: unknown }) =>
      parent.rewardItem ? MenuItem.findById(parent.rewardItem as string).exec() : null,
  },
};
