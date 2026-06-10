import { logger } from "./logger.js";

const UPLOAD_API = "https://upload.imagekit.io/api/v1/files/upload";

export interface UploadedImage {
  url: string;
  fileId: string;
}

export function imagekitConfigured(): boolean {
  return Boolean(process.env.IMAGEKIT_PRIVATE_KEY);
}

/** First configured URL endpoint (env holds a comma-separated list). */
export function imagekitUrlEndpoint(): string {
  const raw = process.env.IMAGEKIT_URL_ENDPOINTS || "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean)[0] ?? "";
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
  if (!imagekitConfigured()) {
    throw new Error("Image upload is not configured (IMAGEKIT_PRIVATE_KEY missing).");
  }
  const form = new FormData();
  form.set("file", toBareBase64(args.file));
  form.set("fileName", args.fileName);
  form.set("folder", args.folder || "/ddb");
  form.set("useUniqueFileName", "true");

  const auth = Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString("base64");
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
