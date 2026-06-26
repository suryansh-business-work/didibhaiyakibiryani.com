import { GraphQLError } from "graphql";
import { User, Otp, Lead } from "../../models/index.js";
import {
  signToken,
  hashPassword,
  comparePassword,
  requireAuth,
  type Context,
} from "../../utils/auth.js";
import { sendMail, sendMailAsync } from "../../utils/mailer.js";
import { signupEmail, loginAlertEmail, verifyEmailOtp } from "../../emails/auth.js";
import { loadEmailBrand } from "../../emails/marketing.js";
import {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  otpExpiry,
  isExpired,
  OTP_MAX_ATTEMPTS,
} from "../../utils/otp.js";
import { ORDER_PUBLIC_URL } from "../../utils/links.js";
import { logger } from "../../utils/logger.js";

const SIGNUP_OTP = "EMAIL_VERIFY" as const;

function notifySignup(email: string, name: string): void {
  loadEmailBrand()
    .then((brand) => sendMailAsync({ to: email, ...signupEmail(brand, name, ORDER_PUBLIC_URL) }))
    .catch(() => undefined);
}

function notifyLogin(email: string, name: string): void {
  loadEmailBrand()
    .then((brand) => sendMailAsync({ to: email, ...loginAlertEmail(brand, name, new Date()) }))
    .catch(() => undefined);
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  otp: string;
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
      return User.findById(ctx.user.id).exec();
    },
  },

  Mutation: {
    /**
     * Step 1 of email-only signup: email a 6-digit verification code.
     * Rejects emails that already have an account so people log in instead.
     */
    requestSignupOtp: async (
      _: unknown,
      { email, name }: { email: string; name: string }
    ) => {
      const id = email.toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) {
        throw new GraphQLError("Please enter a valid email address.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      const existing = await User.findOne({ email: id }).exec();
      if (existing) {
        throw new GraphQLError("An account with this email already exists. Please log in.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      const code = generateOtp();
      await Otp.findOneAndUpdate(
        { identifier: id, purpose: SIGNUP_OTP },
        { codeHash: hashOtp(code, id), attempts: 0, expiresAt: otpExpiry() },
        { upsert: true }
      ).exec();

      const brand = await loadEmailBrand();
      const sent = await sendMail({ to: id, ...verifyEmailOtp(brand, code) });
      if (!sent) {
        throw new GraphQLError("Could not send the verification email. Please try again later.", {
          extensions: { code: "MAIL_NOT_CONFIGURED" },
        });
      }
      logger.info({ email: id, name }, "Signup OTP issued");
      return true;
    },

    /** Step 2 of email-only signup: verify the OTP, then create the account. */
    register: async (_: unknown, { input }: { input: RegisterInput }) => {
      const email = input.email.toLowerCase().trim();
      if (input.password.length < 6) {
        throw new GraphQLError("Password must be at least 6 characters.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      const existing = await User.findOne({ email });
      if (existing) {
        throw new GraphQLError("An account with this email already exists.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const record = await Otp.findOne({ identifier: email, purpose: SIGNUP_OTP }).exec();
      if (!record || isExpired(record.expiresAt)) {
        throw new GraphQLError("Verification code expired. Please request a new one.", {
          extensions: { code: "OTP_INVALID" },
        });
      }
      if (record.attempts >= OTP_MAX_ATTEMPTS) {
        await record.deleteOne();
        throw new GraphQLError("Too many attempts. Please request a new code.", {
          extensions: { code: "OTP_LOCKED" },
        });
      }
      if (!verifyOtpHash(input.otp.trim(), email, record.codeHash)) {
        record.attempts += 1;
        await record.save();
        throw new GraphQLError("Incorrect verification code.", {
          extensions: { code: "OTP_INVALID" },
        });
      }

      const user = await User.create({
        name: input.name.trim(),
        email,
        passwordHash: await hashPassword(input.password),
        role: "CUSTOMER",
      });
      await record.deleteOne();
      // Once they have an account, drop any matching non-signup contact.
      await Lead.deleteMany({ email });
      const token = signToken({ id: user.id, role: user.role });
      notifySignup(user.email, user.name);
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
      notifyLogin(user.email, user.name);
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
      return User.findByIdAndUpdate(u.id, update, { new: true }).exec();
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
