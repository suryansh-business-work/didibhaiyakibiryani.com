import { GraphQLError } from "graphql";
import { Society } from "../../models/index.js";
import { requireRole, type Context } from "../../utils/auth.js";

interface SocietyInput {
  name: string;
  area?: string;
  pincode?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const societyResolvers = {
  Query: {
    societies: async (_: unknown, { activeOnly }: { activeOnly?: boolean }) => {
      const filter = activeOnly ? { isActive: true } : {};
      return Society.find(filter).sort({ sortOrder: 1, name: 1 }).exec();
    },
  },

  Mutation: {
    createSociety: async (_: unknown, { input }: { input: SocietyInput }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      return Society.create(input);
    },

    updateSociety: async (
      _: unknown,
      { id, input }: { id: string; input: SocietyInput },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN");
      const society = await Society.findByIdAndUpdate(id, input, { new: true });
      if (!society) throw new GraphQLError("Society not found.");
      return society;
    },

    deleteSociety: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      await Society.findByIdAndDelete(id);
      return true;
    },
  },
};
