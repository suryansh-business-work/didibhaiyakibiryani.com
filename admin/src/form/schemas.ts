import { z } from "zod";

/** Validation schemas for the admin panel forms. Pure Zod (no UI imports) so
 * they're unit-testable and shared by each page. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Valid 10-digit Indian mobile number. */
const PHONE_RE = /^[6-9]\d{9}$/;
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

const optionalPincode = z
  .string()
  .optional()
  .refine((v) => !v || /^\d{6}$/.test(v), "Enter a 6-digit pincode");

export const societySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  area: z.string().optional(),
  line1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: optionalPincode,
  lat: z.number().optional(),
  lng: z.number().optional(),
  sortOrder,
  isActive: z.boolean(),
});

export const expenseSourceSchema = z
  .object({
    type: z.enum(["PERSON", "ACCOUNT"]),
    name: z.string().trim().min(1, "Name is required"),
    phone: z.string().optional(),
    email: z.string().trim().optional().refine((v) => !v || EMAIL_RE.test(v), "Enter a valid email"),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifsc: z.string().optional(),
    note: z.string().optional(),
    isActive: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.type === "PERSON" && !d.phone?.trim()) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Phone is required" });
    }
    if (d.type !== "ACCOUNT") return;
    if (!d.bankName?.trim()) {
      ctx.addIssue({ code: "custom", path: ["bankName"], message: "Bank name is required" });
    }
    if (!d.accountNumber?.trim()) {
      ctx.addIssue({ code: "custom", path: ["accountNumber"], message: "Account number is required" });
    }
  });

export const expenseSchema = z.object({
  sourceId: z.string().min(1, "Select an expense source"),
  title: z.string().trim().min(1, "Title is required"),
  amount: z.coerce.number().positive("Enter an amount above 0"),
  note: z.string().optional(),
  invoiceUrl: z.string().optional(),
  date: z.string().optional(),
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

export const paymentSchema = z.object({
  orderId: z.string().min(1, "Select an order"),
  amount: z.coerce.number().positive("Enter an amount"),
  method: z.string().optional(),
  status: z.enum(["CAPTURED", "CREATED", "FAILED"]),
  reference: z.string().optional(),
  note: z.string().optional(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().optional(),
});

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  email: z.string().trim().optional().refine((v) => !v || EMAIL_RE.test(v), "Enter a valid email"),
  note: z.string().optional(),
  addressMode: z.enum(["ADDRESS", "SOCIETY"]),
  address: z.string().optional(),
  society: z.string().optional(),
  block: z.string().optional(),
  flat: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: optionalPincode,
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const partyOrderSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().regex(PHONE_RE, "Enter a valid 10-digit mobile number"),
  email: z.string().trim().regex(EMAIL_RE, "Enter a valid email"),
  eventDate: z.string().trim().min(1, "Event date is required"),
  eventTime: z.string().trim().min(1, "Event time is required"),
  guests: z
    .union([z.literal(""), z.coerce.number().int().positive("Enter a valid count").max(100000, "Too large")])
    // Annotate `boolean` so TS doesn't infer a type-guard that narrows out "".
    .refine((v): boolean => v !== "", "Guests is required"),
  line1: z.string().trim().min(1, "Address line is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: optionalPincode,
  message: z.string().optional(),
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
  makingCost: z.coerce.number().min(0, "Must be 0 or more"),
  categoryId: z.string().min(1, "Pick a category"),
  spiceSelectable: z.boolean(),
  spiceLevel: z.coerce.number().int().min(0).max(3),
  serves: z.string().optional(),
  badge: z.enum(["NONE", "BESTSELLER", "NEW"]),
  tags: z.string().optional(),
  isAvailable: z.boolean(),
});

export const manualOrderItemSchema = z
  .object({
    menuItemId: z.string().optional(),
    name: z.string().optional(),
    price: z.coerce.number().min(0),
    qty: z.coerce.number().int().positive("Qty must be at least 1"),
    spiceLevel: z.coerce.number().int().min(0).max(3),
    complimentary: z.boolean().optional(),
  })
  .superRefine((it, ctx) => {
    if (it.menuItemId) return;
    if (!it.name?.trim()) ctx.addIssue({ code: "custom", path: ["name"], message: "Name required" });
    if (!(it.price > 0)) ctx.addIssue({ code: "custom", path: ["price"], message: "Price above 0" });
  });

export const manualOrderSchema = z
  .object({
    orderType: z.enum(["DELIVERY", "TAKEAWAY"]),
    customerMode: z.enum(["WALKIN", "EXISTING", "CONTACT"]),
    userId: z.string().optional(),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    items: z.array(manualOrderItemSchema).min(1, "Add at least one item"),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    phone: z.string().optional(),
    couponCode: z.string().optional(),
    discount: z.coerce.number().min(0),
    deliveryFee: z.coerce.number().min(0),
    paymentMethod: z.enum(["COD", "ONLINE"]),
    paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]),
    status: z.enum(["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
    placedAt: z.string().optional(),
    surveyUrl: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.customerMode === "EXISTING" && !d.userId) {
      ctx.addIssue({ code: "custom", path: ["userId"], message: "Pick a customer" });
    }
    // Walk-in and Contact both carry a name/phone snapshot.
    if (d.customerMode !== "EXISTING" && !d.customerName?.trim()) {
      ctx.addIssue({ code: "custom", path: ["customerName"], message: "Enter a customer name" });
    }
    if (d.orderType !== "DELIVERY") return;
    if (!d.line1?.trim()) ctx.addIssue({ code: "custom", path: ["line1"], message: "Street line required" });
    if (!d.city?.trim()) ctx.addIssue({ code: "custom", path: ["city"], message: "City required" });
  });

export type CouponForm = z.infer<typeof couponSchema>;
export type ManualOrderForm = z.infer<typeof manualOrderSchema>;
export type ManualOrderItemForm = z.infer<typeof manualOrderItemSchema>;
export type MenuForm = z.infer<typeof menuItemSchema>;
export type AdminLoginForm = z.infer<typeof adminLoginSchema>;
export type RecoverForm = z.infer<typeof recoverSchema>;
export type CategoryForm = z.infer<typeof categorySchema>;
export type SocietyForm = z.infer<typeof societySchema>;
export type ExpenseSourceForm = z.infer<typeof expenseSourceSchema>;
export type ExpenseForm = z.infer<typeof expenseSchema>;
export type SliderForm = z.infer<typeof sliderSchema>;
export type CustomerForm = z.infer<typeof customerSchema>;
export type ProfileForm = z.infer<typeof profileSchema>;
export type PaymentForm = z.infer<typeof paymentSchema>;
export type LeadForm = z.infer<typeof leadSchema>;
export type PartyOrderForm = z.infer<typeof partyOrderSchema>;
export type RiderForm = z.infer<typeof riderSchema>;
