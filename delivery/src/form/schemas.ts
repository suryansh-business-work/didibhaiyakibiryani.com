import { z } from "zod";

/** Validation schemas for the delivery (rider) app forms. Pure Zod (no React
 * Native imports) so they're trivially unit-testable. */

export const loginSchema = z.object({
  emailOrPhone: z.string().trim().min(1, "Enter your email or phone"),
  password: z.string().min(1, "Enter your password"),
});

export type LoginForm = z.infer<typeof loginSchema>;
