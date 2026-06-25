import { GraphQLError } from "graphql";
import { Banner } from "../../models/index.js";
import { requireRole, type Context } from "../../utils/auth.js";

interface BannerInput {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const bannerResolvers = {
  Query: {
    banners: async (_: unknown, { activeOnly }: { activeOnly?: boolean }) => {
      const filter = activeOnly ? { isActive: true } : {};
      return Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 }).exec();
    },
  },

  Mutation: {
    createBanner: async (_: unknown, { input }: { input: BannerInput }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      return Banner.create(input);
    },

    updateBanner: async (
      _: unknown,
      { id, input }: { id: string; input: BannerInput },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN");
      const banner = await Banner.findByIdAndUpdate(id, input, { new: true });
      if (!banner) throw new GraphQLError("Slide not found.");
      return banner;
    },

    deleteBanner: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      await Banner.findByIdAndDelete(id);
      return true;
    },

    deleteBanners: async (_: unknown, { ids }: { ids: string[] }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      if (!ids.length) return 0;
      const res = await Banner.deleteMany({ _id: { $in: ids } }).exec();
      /* v8 ignore next -- deletedCount is always present on the driver result */
      return res.deletedCount ?? 0;
    },
  },
};
