import { GraphQLError } from "graphql";
import { Category, MenuItem } from "../../models/index.js";
import { requireRole, type Context } from "../../utils/auth.js";
import { slugify } from "../../utils/helpers.js";

interface CategoryInput {
  name: string;
  description?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface MenuItemInput {
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  spiceLevel?: number;
  serves?: string;
  badge?: "NONE" | "BESTSELLER" | "NEW";
  tags?: string[];
  isAvailable?: boolean;
}

export const menuResolvers = {
  Query: {
    categories: async (_: unknown, { activeOnly }: { activeOnly?: boolean }) => {
      const filter = activeOnly ? { isActive: true } : {};
      return Category.find(filter).sort({ sortOrder: 1, name: 1 });
    },

    menuItems: async (
      _: unknown,
      {
        categoryId,
        search,
        availableOnly,
      }: { categoryId?: string; search?: string; availableOnly?: boolean }
    ) => {
      const filter: Record<string, unknown> = {};
      if (categoryId) filter.category = categoryId;
      if (availableOnly) filter.isAvailable = true;
      if (search) filter.$text = { $search: search };
      return MenuItem.find(filter).sort({ createdAt: -1 });
    },

    menuItem: async (_: unknown, { id, slug }: { id?: string; slug?: string }) => {
      if (id) return MenuItem.findById(id);
      if (slug) return MenuItem.findOne({ slug });
      return null;
    },
  },

  Mutation: {
    createCategory: async (_: unknown, { input }: { input: CategoryInput }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      return Category.create({ ...input, slug: slugify(input.name) });
    },

    updateCategory: async (
      _: unknown,
      { id, input }: { id: string; input: CategoryInput },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN");
      const update: Record<string, unknown> = { ...input };
      if (input.name) update.slug = slugify(input.name);
      const cat = await Category.findByIdAndUpdate(id, update, { new: true });
      if (!cat) throw new GraphQLError("Category not found.");
      return cat;
    },

    deleteCategory: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const count = await MenuItem.countDocuments({ category: id });
      if (count > 0) {
        throw new GraphQLError(
          `Cannot delete: ${count} item(s) still use this category.`,
          { extensions: { code: "BAD_USER_INPUT" } }
        );
      }
      await Category.findByIdAndDelete(id);
      return true;
    },

    createMenuItem: async (_: unknown, { input }: { input: MenuItemInput }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const { categoryId, ...rest } = input;
      return MenuItem.create({
        ...rest,
        category: categoryId,
        slug: slugify(input.name),
      });
    },

    updateMenuItem: async (
      _: unknown,
      { id, input }: { id: string; input: MenuItemInput },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN");
      const { categoryId, ...rest } = input;
      const update: Record<string, unknown> = { ...rest, category: categoryId };
      if (input.name) update.slug = slugify(input.name);
      const item = await MenuItem.findByIdAndUpdate(id, update, { new: true });
      if (!item) throw new GraphQLError("Menu item not found.");
      return item;
    },

    deleteMenuItem: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      await MenuItem.findByIdAndDelete(id);
      return true;
    },

    toggleItemAvailability: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN", "STAFF");
      const item = await MenuItem.findById(id);
      if (!item) throw new GraphQLError("Menu item not found.");
      item.isAvailable = !item.isAvailable;
      await item.save();
      return item;
    },
  },

  // Field resolvers
  Category: {
    itemCount: (parent: { id: string }) => MenuItem.countDocuments({ category: parent.id }),
  },

  MenuItem: {
    category: (parent: { category: unknown }) => {
      const c = parent.category as { name?: string } | string | null;
      // already populated (a Category doc has a `name`)
      if (c && typeof c === "object" && "name" in c && c.name) return c;
      return c ? Category.findById(c as string) : null;
    },
  },
};
