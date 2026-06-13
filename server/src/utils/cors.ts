/** Capacitor/Cordova WebViews (the delivery & consumer apps) send these origins. */
export const NATIVE_APP_ORIGINS = new Set([
  "capacitor://localhost",
  "ionic://localhost",
  "https://localhost",
  "http://localhost",
]);

/** Parse a comma-separated CORS_ORIGINS env string into a clean list. */
export function parseOrigins(raw: string | undefined): string[] {
  return (raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Build the `cors` origin callback: allow configured web origins + native app
 * WebViews + origin-less requests (curl, same-origin, server-to-server). When
 * no origins are configured, allow all (dev default).
 */
export function makeCorsOrigin(allowed: string[]) {
  return (
    origin: string | undefined,
    cb: (err: Error | null, allow?: boolean) => void
  ): void => {
    if (!origin || allowed.length === 0) return cb(null, true);
    if (allowed.includes(origin) || NATIVE_APP_ORIGINS.has(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} not allowed by CORS`));
  };
}
