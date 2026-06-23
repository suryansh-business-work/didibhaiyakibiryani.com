import { loginSchema } from "../schemas";
import type { ZodTypeAny } from "zod";

function errs(schema: ZodTypeAny, value: unknown): Record<string, string> {
  const r = schema.safeParse(value);
  if (r.success) return {};
  return Object.fromEntries(r.error.issues.map((i) => [i.path.join("."), i.message]));
}
const ok = (schema: ZodTypeAny, value: unknown) => schema.safeParse(value).success;

describe("delivery loginSchema", () => {
  it("accepts an email/phone + password", () => {
    expect(ok(loginSchema, { emailOrPhone: "rider@b.com", password: "secret" })).toBe(true);
  });
  it("flags empty fields with inline messages", () => {
    expect(errs(loginSchema, { emailOrPhone: "", password: "" })).toEqual({
      emailOrPhone: "Enter your email or phone",
      password: "Enter your password",
    });
  });
});
