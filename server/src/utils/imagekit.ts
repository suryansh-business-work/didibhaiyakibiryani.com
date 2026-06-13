import mongoose from "mongoose";
import { logger } from "./logger.js";
import { getOrCreateSettings } from "../models/Settings.js";
import type { ISettings } from "../models/Settings.js";

const UPLOAD_API = "https://upload.imagekit.io/api/v1/files/upload";

/** Read the settings doc only when Mongo is connected; otherwise env-only. */
async function settingsOrNull(): Promise<ISettings | null> {
  if (mongoose.connection.readyState !== 1) return null;
  try {
    return await getOrCreateSettings();
  } catch {
    return null;
  }
}

export interface UploadedImage {
  url: string;
  fileId: string;
}

export interface ImageKitConfig {
  privateKey: string;
  urlEndpoint: string;
}

/**
 * Resolve ImageKit credentials: admin-entered values (Settings doc) win, with
 * the server environment as a fallback. The private key is a secret — it lives
 * in the DB or host env, never in source.
 */
export async function resolveImageKitConfig(): Promise<ImageKitConfig | null> {
  const s = await settingsOrNull();
  const privateKey = s?.imagekitPrivateKey || process.env.IMAGEKIT_PRIVATE_KEY || "";
  if (!privateKey) return null;
  const endpoints = s?.imagekitUrlEndpoint || process.env.IMAGEKIT_URL_ENDPOINTS || "";
  const urlEndpoint = endpoints.split(",").map((x) => x.trim()).filter(Boolean)[0] ?? "";
  return { privateKey, urlEndpoint };
}

export async function imagekitConfigured(): Promise<boolean> {
  return (await resolveImageKitConfig()) !== null;
}

/** First configured URL endpoint (admin setting or env list). */
export async function imagekitUrlEndpoint(): Promise<string> {
  const cfg = await resolveImageKitConfig();
  return cfg?.urlEndpoint ?? "";
}

export interface UploadImageArgs {
  /** base64 payload — bare or as a data: URI */
  file: string;
  fileName: string;
  folder?: string;
}

/** Strip an optional data-URI prefix, returning the bare base64 payload. */
export function toBareBase64(file: string): string {
  const comma = file.indexOf(",");
  if (file.startsWith("data:") && comma !== -1) {
    return file.slice(comma + 1);
  }
  return file;
}

/**
 * Upload an image to ImageKit (media delivery CDN) via its REST API.
 * Returns the CDN URL to store on menu items / branding.
 */
export async function uploadToImageKit(args: UploadImageArgs): Promise<UploadedImage> {
  const cfg = await resolveImageKitConfig();
  if (!cfg) {
    throw new Error("Image upload is not configured (ImageKit private key missing).");
  }
  const form = new FormData();
  form.set("file", toBareBase64(args.file));
  form.set("fileName", args.fileName);
  form.set("folder", args.folder || "/ddb");
  form.set("useUniqueFileName", "true");

  const auth = Buffer.from(`${cfg.privateKey}:`).toString("base64");
  const res = await fetch(UPLOAD_API, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}` },
    body: form,
  });
  const body = (await res.json()) as { url?: string; fileId?: string; message?: string };
  if (!res.ok || !body.url) {
    logger.error({ status: res.status, message: body.message }, "ImageKit upload failed");
    throw new Error(body.message || "Image upload failed — please try again.");
  }
  logger.info({ fileId: body.fileId }, "Image uploaded to ImageKit");
  return { url: body.url, fileId: body.fileId ?? "" };
}
