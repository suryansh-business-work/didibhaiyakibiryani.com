import crypto from "node:crypto";
import { GraphQLError } from "graphql";

const API_BASE = "https://api.razorpay.com/v1";

export function razorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID || "";
}

function razorpayKeySecret(): string {
  return process.env.RAZORPAY_KEY_SECRET || "";
}

export function razorpayConfigured(): boolean {
  return Boolean(razorpayKeyId() && razorpayKeySecret());
}

function requireConfigured(): void {
  if (!razorpayConfigured()) {
    throw new GraphQLError(
      "Online payments are not configured yet. Please pay with COD.",
      { extensions: { code: "PAYMENTS_NOT_CONFIGURED" } }
    );
  }
}

function authHeader(): string {
  const basic = Buffer.from(`${razorpayKeyId()}:${razorpayKeySecret()}`).toString("base64");
  return `Basic ${basic}`;
}

async function rzpFetch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json()) as T & { error?: { description?: string } };
  if (!res.ok) {
    throw new GraphQLError(json.error?.description ?? `Razorpay request failed (${res.status})`, {
      extensions: { code: "PAYMENT_PROVIDER_ERROR" },
    });
  }
  return json;
}

export interface RzpOrder {
  id: string;
  amount: number; // paise
  currency: string;
  status: string;
}

/** Create a Razorpay order. `amountRupees` is converted to paise. */
export async function createProviderOrder(
  amountRupees: number,
  receipt: string
): Promise<RzpOrder> {
  requireConfigured();
  return rzpFetch<RzpOrder>("/orders", {
    amount: Math.round(amountRupees * 100),
    currency: "INR",
    receipt,
  });
}

export interface RzpRefund {
  id: string;
  amount: number; // paise
  status: string;
}

/** Refund a captured payment. Omit `amountRupees` for a full refund. */
export async function refundProviderPayment(
  providerPaymentId: string,
  amountRupees?: number
): Promise<RzpRefund> {
  requireConfigured();
  const body = amountRupees ? { amount: Math.round(amountRupees * 100) } : {};
  return rzpFetch<RzpRefund>(`/payments/${providerPaymentId}/refund`, body);
}

/**
 * Verify the checkout callback signature:
 * HMAC-SHA256(orderId + "|" + paymentId, KEY_SECRET) must equal the signature.
 */
export function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  secret?: string;
}): boolean {
  const secret = params.secret ?? razorpayKeySecret();
  if (!secret || !params.razorpaySignature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");
  return timingSafeEqualHex(expected, params.razorpaySignature);
}

/** Verify a webhook payload signature (HMAC-SHA256 of the raw body). */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret = process.env.RAZORPAY_WEBHOOK_SECRET || ""
): boolean {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqualHex(expected, signature);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
