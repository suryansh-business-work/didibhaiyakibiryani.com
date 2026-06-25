import { z } from "zod";

/** Shared validation schemas for every app form. Pure Zod (no React Native
 * imports) so they're trivially unit-testable and reused by each screen. */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Digits only — a 10-digit phone number. */
export const PHONE_RE = /^[0-9]{10}$/;
/** A valid 10-digit Indian mobile number (starts 6-9). */
export const MOBILE_RE = /^[6-9]\d{9}$/;
/** A 6-digit Indian PIN code. */
export const PINCODE_RE = /^\d{6}$/;
export const OTHER_SUBJECT = "Other (custom subject)";

export const loginSchema = z.object({
  emailOrPhone: z.string().trim().min(1, "Enter your email or phone"),
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name"),
  email: z.string().trim().regex(EMAIL_RE, "Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  otp: z.string().trim().length(6, "Enter the 6-digit code"),
});

const flatNumber = z.string().trim().regex(/^\d+$/, "Flat number must be digits only");
const block = z.string().regex(/^[A-Z]$/, "Select your block");

export const addressSchema = z.object({
  label: z.string().trim().optional(),
  societyId: z.string().min(1, "Select your society"),
  flatNumber,
  block,
});

export const checkoutAddressSchema = z.object({
  societyId: z.string().min(1, "Select your society"),
  flatNumber,
  block,
  phone: z.string().trim().regex(PHONE_RE, "Enter a valid 10-digit phone number"),
});

export const partySchema = z.object({
  name: z.string().trim().min(1, "Enter your name"),
  phone: z.string().trim().regex(MOBILE_RE, "Enter a valid 10-digit mobile number"),
  email: z.string().trim().regex(EMAIL_RE, "Enter a valid email"),
  eventDate: z.string().trim().min(1, "Select the event date"),
  eventTime: z.string().trim().min(1, "Select the event time"),
  guests: z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      if (!v) {
        ctx.addIssue({ code: "custom", message: "Enter the number of guests" });
        return;
      }
      if (!/^\d+$/.test(v)) {
        ctx.addIssue({ code: "custom", message: "Guests must be a number" });
        return;
      }
      const n = Number(v);
      if (n < 1 || n > 100000) {
        ctx.addIssue({ code: "custom", message: "Enter between 1 and 100000 guests" });
      }
    }),
  line1: z.string().trim().min(1, "Enter the address line"),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  pincode: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || PINCODE_RE.test(v), "Enter a valid 6-digit PIN code"),
  message: z.string().trim().optional(),
  captchaAnswer: z.string().trim().min(1, "Solve the captcha"),
});

export const supportSchema = z
  .object({
    subject: z.string().min(1, "Choose what you need help with"),
    customSubject: z.string().trim().optional(),
    body: z.string().trim().min(1, "Describe the issue"),
  })
  .superRefine((data, ctx) => {
    if (data.subject === OTHER_SUBJECT && !data.customSubject?.trim()) {
      ctx.addIssue({ code: "custom", path: ["customSubject"], message: "Enter a subject" });
    }
  });

export const ratingSchema = z.object({
  food: z.number().int().min(1, "Tap to rate the food").max(5),
  delivery: z.number().int().min(1, "Tap to rate the delivery").max(5),
  comment: z.string().trim().optional(),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type AddressForm = z.infer<typeof addressSchema>;
export type CheckoutAddressForm = z.infer<typeof checkoutAddressSchema>;
export type PartyForm = z.infer<typeof partySchema>;
export type SupportForm = z.infer<typeof supportSchema>;
export type RatingForm = z.infer<typeof ratingSchema>;
