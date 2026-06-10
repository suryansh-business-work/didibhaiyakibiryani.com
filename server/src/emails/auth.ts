import { emailShell, cardSection, ctaButton, type EmailBrand } from "./layout.js";
import { OTP_TTL_MINUTES } from "../utils/otp.js";

export interface EmailContent {
  subject: string;
  mjml: string;
}

export function otpEmail(brand: EmailBrand, name: string, code: string): EmailContent {
  const body = cardSection(`
    <mj-text color="#f5ece0" font-size="18px" font-weight="700">Hi ${name},</mj-text>
    <mj-text color="#cdbfb0">Use this one-time password to reset your ${brand.brandName} account password. It expires in ${OTP_TTL_MINUTES} minutes.</mj-text>
    <mj-text align="center" color="${brand.primaryColor}" font-size="34px" font-weight="800" letter-spacing="10px" padding="18px 0">${code}</mj-text>
    <mj-text color="#8d8073" font-size="12px">Didn't request this? You can safely ignore this email — your password stays unchanged.</mj-text>
  `);
  return {
    subject: `${code} is your ${brand.brandName} OTP`,
    mjml: emailShell(brand, body),
  };
}

export function signupEmail(brand: EmailBrand, name: string, orderUrl: string): EmailContent {
  const body = cardSection(`
    <mj-text color="#f5ece0" font-size="18px" font-weight="700">Welcome to the family, ${name}! 🎉</mj-text>
    <mj-text color="#cdbfb0">Your account is ready. Hot, dum-cooked, 100% veg biryani is now just a few taps away.</mj-text>
    <mj-text color="#cdbfb0">Pro tip: use code <strong style="color:${brand.primaryColor}">FIRST20</strong> for 20% off your first order.</mj-text>
    ${ctaButton(brand, "Order your first biryani", orderUrl)}
  `);
  return {
    subject: `Welcome to ${brand.brandName}, ${name}!`,
    mjml: emailShell(brand, body),
  };
}

export function loginAlertEmail(brand: EmailBrand, name: string, when: Date): EmailContent {
  const ts = when.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const support = brand.supportEmail || brand.supportPhone || "our support team";
  const body = cardSection(`
    <mj-text color="#f5ece0" font-size="18px" font-weight="700">New sign-in to your account</mj-text>
    <mj-text color="#cdbfb0">Hi ${name}, your ${brand.brandName} account was just signed in to on <strong>${ts}</strong>.</mj-text>
    <mj-text color="#8d8073" font-size="12px">If this was you, no action is needed. If not, reset your password immediately and contact ${support}.</mj-text>
  `);
  return {
    subject: `New sign-in to your ${brand.brandName} account`,
    mjml: emailShell(brand, body),
  };
}

export function passwordChangedEmail(brand: EmailBrand, name: string): EmailContent {
  const support = brand.supportEmail || brand.supportPhone || "our support team";
  const body = cardSection(`
    <mj-text color="#f5ece0" font-size="18px" font-weight="700">Your password was changed</mj-text>
    <mj-text color="#cdbfb0">Hi ${name}, the password for your ${brand.brandName} account has just been reset successfully.</mj-text>
    <mj-text color="#8d8073" font-size="12px">If you didn't do this, contact ${support} right away.</mj-text>
  `);
  return {
    subject: `Your ${brand.brandName} password was changed`,
    mjml: emailShell(brand, body),
  };
}
