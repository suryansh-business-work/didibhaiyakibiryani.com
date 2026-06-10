import { Router } from "express";
import cors from "cors";
import { dbState } from "../config/db.js";
import { mailConfigured, verifySmtp } from "../utils/mailer.js";
import { imagekitConfigured } from "../utils/imagekit.js";

export interface ServiceHealth {
  key: string;
  name: string;
  category: string;
  ok: boolean;
  detail: string;
  latencyMs: number | null;
  url: string | null;
}

const DOMAIN = "didibhaiyakibiryani.com";

/** Public apps probed over HTTP (env-overridable so local dev works too). */
const APP_PROBES: ReadonlyArray<{ key: string; name: string; envUrl?: string; url: string }> = [
  { key: "website", name: "Website", url: `https://${DOMAIN}` },
  { key: "admin", name: "Admin panel", url: `https://admin.${DOMAIN}` },
  { key: "native", name: "Customer app (native)", url: `https://native.${DOMAIN}` },
  { key: "delivery", name: "Delivery rider app", url: `https://delivery.${DOMAIN}` },
  { key: "signoz", name: "Signoz observability", url: `https://signoz.${DOMAIN}` },
];

function probeUrl(key: string): string {
  return process.env[`HEALTH_URL_${key.toUpperCase()}`] || APP_PROBES.find((p) => p.key === key)!.url;
}

async function checkApp(key: string, name: string): Promise<ServiceHealth> {
  const url = probeUrl(key);
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    clearTimeout(timer);
    const latencyMs = Date.now() - started;
    return {
      key, name, category: "Applications", url, latencyMs,
      ok: res.ok,
      detail: res.ok ? `HTTP ${res.status} in ${latencyMs}ms` : `HTTP ${res.status}`,
    };
  } catch (err: unknown) {
    return {
      key, name, category: "Applications", url, latencyMs: null,
      ok: false,
      detail: err instanceof Error ? err.message : "unreachable",
    };
  }
}

async function checkSmtp(): Promise<ServiceHealth> {
  const base = { key: "smtp", name: "Email (SMTP)", category: "Email", url: null };
  if (!mailConfigured()) {
    return { ...base, ok: false, latencyMs: null, detail: "SMTP not configured" };
  }
  const started = Date.now();
  try {
    await verifySmtp();
    const latencyMs = Date.now() - started;
    return { ...base, ok: true, latencyMs, detail: `SMTP login verified in ${latencyMs}ms` };
  } catch (err: unknown) {
    return {
      ...base, ok: false, latencyMs: null,
      detail: err instanceof Error ? err.message : "SMTP verification failed",
    };
  }
}

function checkMongo(): ServiceHealth {
  const db = dbState();
  return {
    key: "mongodb", name: "MongoDB connection", category: "Database",
    ok: db.ok, latencyMs: null, url: null,
    detail: db.ok ? "Connected" : `State: ${db.state}`,
  };
}

function checkIntegrations(): ServiceHealth[] {
  const razorpayOk = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  return [
    {
      key: "imagekit", name: "ImageKit (media CDN)", category: "Integrations",
      ok: imagekitConfigured(), latencyMs: null, url: null,
      detail: imagekitConfigured() ? "Keys configured" : "IMAGEKIT_PRIVATE_KEY missing",
    },
    {
      key: "razorpay", name: "Razorpay (payments)", category: "Integrations",
      ok: razorpayOk, latencyMs: null, url: null,
      detail: razorpayOk ? "Keys configured" : "RAZORPAY keys missing",
    },
  ];
}

export interface HealthReport {
  ok: boolean;
  checkedAt: string;
  services: ServiceHealth[];
}

/** Full platform report (exported for tests; the route adds caching). */
export async function buildHealthReport(): Promise<HealthReport> {
  const apiSelf: ServiceHealth = {
    key: "server", name: "Server (GraphQL API)", category: "Applications",
    ok: true, latencyMs: 0, url: `https://server.${DOMAIN}`, detail: "This API is responding",
  };
  const [apps, smtp] = await Promise.all([
    Promise.all(APP_PROBES.map((p) => checkApp(p.key, p.name))),
    checkSmtp(),
  ]);
  const services: ServiceHealth[] = [apiSelf, ...apps, checkMongo(), smtp, ...checkIntegrations()];
  return {
    ok: services.every((s) => s.ok),
    checkedAt: new Date().toISOString(),
    services,
  };
}

// SMTP verify is slow-ish; cache the full report briefly so the status page
// can poll without hammering upstreams.
let cache: { at: number; body: HealthReport } | null = null;
const CACHE_MS = 30_000;

export const healthRouter = Router();

healthRouter.get("/health/full", cors(), async (_req, res) => {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    res.json(cache.body);
    return;
  }
  const body = await buildHealthReport();
  cache = { at: Date.now(), body };
  res.json(body);
});
