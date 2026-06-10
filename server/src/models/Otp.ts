import { Schema, model, Document } from "mongoose";

export type OtpPurpose = "PASSWORD_RESET" | "CAPTCHA";

export interface IOtp extends Document {
  identifier: string; // lowercased email
  purpose: OtpPurpose;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    identifier: { type: String, required: true, lowercase: true, index: true },
    purpose: { type: String, enum: ["PASSWORD_RESET", "CAPTCHA"], required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-purge expired OTPs.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ identifier: 1, purpose: 1 }, { unique: true });

export const Otp = model<IOtp>("Otp", otpSchema);
