import { Schema, model, Document, Types } from "mongoose";

export type CampaignChannel = "EMAIL" | "WHATSAPP";
export type CampaignStatus = "DRAFT" | "SENDING" | "SENT" | "FAILED";

export interface ICampaign extends Document {
  name: string;
  channel: CampaignChannel;
  subject: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  status: CampaignStatus;
  audienceCount: number;
  sentCount: number;
  failedCount: number;
  createdBy?: Types.ObjectId;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    channel: { type: String, enum: ["EMAIL", "WHATSAPP"], default: "EMAIL" },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    ctaLabel: String,
    ctaUrl: String,
    status: {
      type: String,
      enum: ["DRAFT", "SENDING", "SENT", "FAILED"],
      default: "DRAFT",
      index: true,
    },
    audienceCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    sentAt: Date,
  },
  { timestamps: true }
);

export const Campaign = model<ICampaign>("Campaign", campaignSchema);
