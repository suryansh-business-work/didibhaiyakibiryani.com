import {
  loginSchema,
  registerSchema,
  addressSchema,
  checkoutAddressSchema,
  partySchema,
  supportSchema,
  ratingSchema,
  OTHER_SUBJECT,
} from "../schemas";
import type { ZodTypeAny } from "zod";

/** Map a failed parse to { fieldPath: message } for easy assertions. */
function errs(schema: ZodTypeAny, value: unknown): Record<string, string> {
  const r = schema.safeParse(value);
  if (r.success) return {};
  return Object.fromEntries(r.error.issues.map((i) => [i.path.join("."), i.message]));
}
const ok = (schema: ZodTypeAny, value: unknown) => schema.safeParse(value).success;

describe("loginSchema", () => {
  it("accepts an email/phone + password", () => {
    expect(ok(loginSchema, { emailOrPhone: "a@b.com", password: "secret" })).toBe(true);
  });
  it("flags empty fields inline", () => {
    expect(errs(loginSchema, { emailOrPhone: "", password: "" })).toEqual({
      emailOrPhone: "Enter your email or phone",
      password: "Enter your password",
    });
  });
});

describe("registerSchema", () => {
  it("accepts valid details", () => {
    expect(ok(registerSchema, { name: "Asha", email: "a@b.com", password: "secret1", otp: "123456" })).toBe(true);
  });
  it("flags a bad email, short password and wrong-length otp", () => {
    const e = errs(registerSchema, { name: "Asha", email: "nope", password: "123", otp: "12" });
    expect(e.email).toBe("Enter a valid email");
    expect(e.password).toBe("At least 6 characters");
    expect(e.otp).toBe("Enter the 6-digit code");
  });
});

describe("addressSchema", () => {
  it("accepts society + numeric flat + a block letter (label optional)", () => {
    expect(ok(addressSchema, { societyId: "s1", flatNumber: "101", block: "A" })).toBe(true);
  });
  it("requires society, a digit-only flat number and a block", () => {
    expect(errs(addressSchema, { societyId: "", flatNumber: "", block: "" })).toEqual({
      societyId: "Select your society",
      flatNumber: "Flat number must be digits only",
      block: "Select your block",
    });
    expect(errs(addressSchema, { societyId: "s1", flatNumber: "12B", block: "A" }).flatNumber).toBe(
      "Flat number must be digits only"
    );
  });
});

describe("checkoutAddressSchema", () => {
  it("accepts society + flat + block + a 10-digit phone", () => {
    expect(ok(checkoutAddressSchema, { societyId: "s1", flatNumber: "101", block: "B", phone: "9876543210" })).toBe(true);
  });
  it("rejects a non-numeric / wrong-length phone", () => {
    expect(errs(checkoutAddressSchema, { societyId: "s1", flatNumber: "101", block: "B", phone: "98765" }).phone).toBe(
      "Enter a valid 10-digit phone number"
    );
  });
});

describe("partySchema", () => {
  const base = {
    name: "Asha",
    phone: "9876543210",
    email: "a@b.com",
    eventDate: "",
    guests: "",
    location: "",
    message: "",
    captchaAnswer: "7",
  };
  it("accepts a valid enquiry (optional fields blank)", () => {
    expect(ok(partySchema, base)).toBe(true);
  });
  it("flags bad name, phone, email, guests and captcha", () => {
    const e = errs(partySchema, { ...base, name: "", phone: "x", email: "no", guests: "ten", captchaAnswer: "" });
    expect(e.name).toBe("Enter your name");
    expect(e.phone).toBe("Enter a valid 10-digit phone number");
    expect(e.email).toBe("Enter a valid email");
    expect(e.guests).toBe("Guests must be a number");
    expect(e.captchaAnswer).toBe("Solve the captcha");
  });
});

describe("supportSchema", () => {
  it("accepts a chosen subject + body", () => {
    expect(ok(supportSchema, { subject: "Food quality issue", customSubject: "", body: "It was cold" })).toBe(true);
  });
  it("requires a subject and body", () => {
    const e = errs(supportSchema, { subject: "", customSubject: "", body: "" });
    expect(e.subject).toBe("Choose what you need help with");
    expect(e.body).toBe("Describe the issue");
  });
  it("requires a custom subject when 'Other' is chosen", () => {
    expect(errs(supportSchema, { subject: OTHER_SUBJECT, customSubject: "", body: "x" }).customSubject).toBe(
      "Enter a subject"
    );
    expect(ok(supportSchema, { subject: OTHER_SUBJECT, customSubject: "Refund", body: "x" })).toBe(true);
  });
});

describe("ratingSchema", () => {
  it("accepts 1–5 stars for food and delivery", () => {
    expect(ok(ratingSchema, { food: 5, delivery: 4, comment: "" })).toBe(true);
  });
  it("requires both ratings to be tapped", () => {
    const e = errs(ratingSchema, { food: 0, delivery: 0 });
    expect(e.food).toBe("Tap to rate the food");
    expect(e.delivery).toBe("Tap to rate the delivery");
  });
});
