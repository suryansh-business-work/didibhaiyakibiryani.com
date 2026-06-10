import { GraphQLError } from "graphql";
import { User } from "../../models/index.js";
import {
  signToken,
  hashPassword,
  comparePassword,
  requireAuth,
  type Context,
} from "../../utils/auth.js";

interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

interface AddressInput {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

export const authResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.user) return null;
      return User.findById(ctx.user.id);
    },
  },

  Mutation: {
    register: async (_: unknown, { input }: { input: RegisterInput }) => {
      const email = input.email.toLowerCase().trim();
      const existing = await User.findOne({ email });
      if (existing) {
        throw new GraphQLError("An account with this email already exists.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      if (input.password.length < 6) {
        throw new GraphQLError("Password must be at least 6 characters.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      const user = await User.create({
        name: input.name.trim(),
        email,
        phone: input.phone,
        passwordHash: await hashPassword(input.password),
        role: "CUSTOMER",
      });
      const token = signToken({ id: user.id, role: user.role });
      return { token, user };
    },

    login: async (
      _: unknown,
      { emailOrPhone, password }: { emailOrPhone: string; password: string }
    ) => {
      const id = emailOrPhone.toLowerCase().trim();
      const user = await User.findOne({
        $or: [{ email: id }, { phone: emailOrPhone.trim() }],
      });
      if (!user || !(await comparePassword(password, user.passwordHash))) {
        throw new GraphQLError("Incorrect email/phone or password.", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      if (!user.isActive) {
        throw new GraphQLError("This account has been disabled.", {
          extensions: { code: "FORBIDDEN" },
        });
      }
      const token = signToken({ id: user.id, role: user.role });
      return { token, user };
    },

    updateProfile: async (
      _: unknown,
      { name, phone }: { name?: string; phone?: string },
      ctx: Context
    ) => {
      const u = requireAuth(ctx);
      const update: Record<string, unknown> = {};
      if (name !== undefined) update.name = name.trim();
      if (phone !== undefined) update.phone = phone.trim();
      return User.findByIdAndUpdate(u.id, update, { new: true });
    },

    addAddress: async (_: unknown, { input }: { input: AddressInput }, ctx: Context) => {
      const u = requireAuth(ctx);
      const user = await User.findById(u.id);
      if (!user) throw new GraphQLError("User not found.");
      if (input.isDefault) {
        user.addresses.forEach((a) => (a.isDefault = false));
      }
      user.addresses.push({
        label: input.label || "Home",
        line1: input.line1,
        line2: input.line2,
        city: input.city,
        pincode: input.pincode,
        lat: input.lat,
        lng: input.lng,
        isDefault: input.isDefault ?? user.addresses.length === 0,
      });
      await user.save();
      return user;
    },

    removeAddress: async (_: unknown, { addressId }: { addressId: string }, ctx: Context) => {
      const u = requireAuth(ctx);
      const user = await User.findById(u.id);
      if (!user) throw new GraphQLError("User not found.");
      user.addresses = user.addresses.filter((a) => String(a._id) !== addressId);
      await user.save();
      return user;
    },
  },
};
