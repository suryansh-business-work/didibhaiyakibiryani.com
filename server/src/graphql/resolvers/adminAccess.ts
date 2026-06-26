import { User } from "../../models/index.js";
import { hashPassword } from "../../utils/auth.js";
import { issueCaptcha, verifyCaptcha, generatePassword } from "../../utils/captcha.js";
import { adminCredentialsEmail } from "../../emails/auth.js";
import { loadEmailBrand } from "../../emails/marketing.js";
import { sendMailAsync } from "../../utils/mailer.js";
import { logger } from "../../utils/logger.js";
import { ADMIN_PUBLIC_URL } from "../../utils/links.js";
import { GraphQLError } from "graphql";

export const adminAccessResolvers = {
  Query: {
    captcha: async () => issueCaptcha(),
  },

  Mutation: {
    /**
     * Resets the admin's password and emails the fresh credentials to the
     * admin's own registered inbox. Captcha-gated; the response never reveals
     * whether the email exists (no account enumeration).
     */
    emailAdminCredentials: async (
      _: unknown,
      { email, captchaId, captchaAnswer }: { email: string; captchaId: string; captchaAnswer: string }
    ) => {
      const captchaOk = await verifyCaptcha(captchaId, captchaAnswer);
      if (!captchaOk) {
        throw new GraphQLError("Captcha answer is wrong or expired — try again.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const admin = await User.findOne({
        email: email.toLowerCase().trim(),
        role: "ADMIN",
        isActive: true,
      }).exec();
      if (!admin) {
        // Same response either way: callers learn nothing about valid emails.
        logger.warn({ email }, "Admin credential email requested for non-admin address");
        return true;
      }

      const newPassword = generatePassword();
      admin.passwordHash = await hashPassword(newPassword);
      await admin.save();

      const brand = await loadEmailBrand();
      const content = adminCredentialsEmail(brand, admin.name, admin.email, newPassword, ADMIN_PUBLIC_URL);
      sendMailAsync({ to: admin.email, ...content });
      logger.info({ userId: admin.id }, "Admin credentials emailed (password rotated)");
      return true;
    },
  },
};
