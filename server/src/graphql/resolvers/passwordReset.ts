import { GraphQLError } from "graphql";
import { User, Otp } from "../../models/index.js";
import { hashPassword } from "../../utils/auth.js";
import {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  otpExpiry,
  isExpired,
  OTP_MAX_ATTEMPTS,
} from "../../utils/otp.js";
import { sendMail, sendMailAsync } from "../../utils/mailer.js";
import { otpEmail, passwordChangedEmail } from "../../emails/auth.js";
import { loadEmailBrand } from "../../emails/marketing.js";
import { logger } from "../../utils/logger.js";

export const passwordResetResolvers = {
  Mutation: {
    /**
     * Always resolves true so account existence is never leaked.
     * When the account exists, an OTP is emailed (15 min validity).
     */
    requestPasswordReset: async (_: unknown, { email }: { email: string }) => {
      const id = email.toLowerCase().trim();
      const user = await User.findOne({ email: id }).exec();
      if (!user) return true;

      const code = generateOtp();
      await Otp.findOneAndUpdate(
        { identifier: id, purpose: "PASSWORD_RESET" },
        { codeHash: hashOtp(code, id), attempts: 0, expiresAt: otpExpiry() },
        { upsert: true }
      ).exec();

      const brand = await loadEmailBrand();
      const sent = await sendMail({ to: id, ...otpEmail(brand, user.name, code) });
      if (!sent) {
        throw new GraphQLError("Could not send the OTP email. Please try again later.", {
          extensions: { code: "MAIL_NOT_CONFIGURED" },
        });
      }
      logger.info({ email: id }, "Password reset OTP issued");
      return true;
    },

    resetPassword: async (
      _: unknown,
      { email, otp, newPassword }: { email: string; otp: string; newPassword: string }
    ) => {
      const id = email.toLowerCase().trim();
      if (newPassword.length < 6) {
        throw new GraphQLError("Password must be at least 6 characters.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const record = await Otp.findOne({ identifier: id, purpose: "PASSWORD_RESET" }).exec();
      if (!record || isExpired(record.expiresAt)) {
        throw new GraphQLError("OTP expired or not requested. Request a new one.", {
          extensions: { code: "OTP_INVALID" },
        });
      }
      if (record.attempts >= OTP_MAX_ATTEMPTS) {
        await record.deleteOne();
        throw new GraphQLError("Too many attempts. Request a new OTP.", {
          extensions: { code: "OTP_LOCKED" },
        });
      }
      if (!verifyOtpHash(otp.trim(), id, record.codeHash)) {
        record.attempts += 1;
        await record.save();
        throw new GraphQLError("Incorrect OTP.", { extensions: { code: "OTP_INVALID" } });
      }

      const user = await User.findOne({ email: id }).exec();
      if (!user) throw new GraphQLError("Account not found.");
      user.passwordHash = await hashPassword(newPassword);
      await user.save();
      await record.deleteOne();

      loadEmailBrand()
        .then((brand) => sendMailAsync({ to: id, ...passwordChangedEmail(brand, user.name) }))
        .catch(() => undefined);
      logger.info({ email: id }, "Password reset completed");
      return true;
    },
  },
};
