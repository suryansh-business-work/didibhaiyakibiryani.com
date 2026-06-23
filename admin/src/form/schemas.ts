import { z } from "zod";

/** Validation schemas for the admin panel forms. Pure Zod (no UI imports) so
 * they're unit-testable and shared by each page. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sortOrder = z.coerce.number().int("Whole number").min(0, "Must be 0 or more");

export const adminLoginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email or phone"),
  password: z.string().min(1, "Enter your password"),
});

export const recoverSchema = z.object({
  email: z.string().trim().regex(EMAIL_RE, "Enter a valid email"),
  answer: z.string().trim().min(1, "Solve the captcha"),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().optional(),
  sortOrder,
  isActive: z.boolean(),
});

export const societySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  area: z.string().optional(),
  pincode: z.string().optional(),
  sortOrder,
  isActive: z.boolean(),
});

export const sliderSchema = z.object({
  imageUrl: z.string().min(1, "Upload an image for the slide"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  linkUrl: z.string().optional(),
  sortOrder,
  isActive: z.boolean(),
});

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().optional(),
});

export const riderSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().regex(EMAIL_RE, "Enter a valid email"),
  phone: z.string().optional(),
  password: z.string().min(6, "At least 6 characters"),
  isActive: z.boolean(),
});

/** Edit variant: email is fixed, the password is optional (only checked if set). */
export const riderEditSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 6, "At least 6 characters"),
  isActive: z.boolean(),
});

export const couponSchema = z
  .object({
    code: z.string().trim().min(1, "Code is required"),
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().optional(),
    type: z.enum(["PERCENT", "FLAT", "FREE_DELIVERY", "FREE_ITEM"]),
    value: z.coerce.number().min(0),
    maxDiscount: z.coerce.number().min(0),
    minOrder: z.coerce.number().min(0),
    usageLimit: z.coerce.number().int().min(0),
    freeItemId: z.string().optional(),
    appOnly: z.boolean(),
    firstOrderOnly: z.boolean(),
    isActive: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.type === "FREE_ITEM" && !d.freeItemId) {
      ctx.addIssue({ code: "custom", path: ["freeItemId"], message: "Pick the free item" });
    }
    if ((d.type === "PERCENT" || d.type === "FLAT") && d.value <= 0) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Enter an amount above 0" });
    }
  });

export const menuItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().optional(),
  image: z.string().optional(),
  price: z.coerce.number().positive("Enter a price above 0"),
  categoryId: z.string().min(1, "Pick a category"),
  spiceLevel: z.coerce.number().int().min(0).max(3),
  serves: z.string().optional(),
  badge: z.enum(["NONE", "BESTSELLER", "NEW"]),
  tags: z.string().optional(),
  isAvailable: z.boolean(),
});

export type CouponForm = z.infer<typeof couponSchema>;
export type MenuForm = z.infer<typeof menuItemSchema>;
export type AdminLoginForm = z.infer<typeof adminLoginSchema>;
export type RecoverForm = z.infer<typeof recoverSchema>;
export type CategoryForm = z.infer<typeof categorySchema>;
export type SocietyForm = z.infer<typeof societySchema>;
export type SliderForm = z.infer<typeof sliderSchema>;
export type CustomerForm = z.infer<typeof customerSchema>;
export type RiderForm = z.infer<typeof riderSchema>;
