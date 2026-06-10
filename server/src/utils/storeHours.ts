/**
 * Store open/close logic. Times are admin-configured "HH:mm" strings evaluated
 * in the store's IANA timezone, so the answer is correct no matter where the
 * server runs. Overnight windows (e.g. 18:00 → 02:00) are supported.
 */

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** Parse "HH:mm" into minutes since midnight, or null when malformed. */
export function parseTimeToMinutes(value: string): number | null {
  const m = TIME_RE.exec(value.trim());
  if (!m) return null;
  return Number.parseInt(m[1], 10) * 60 + Number.parseInt(m[2], 10);
}

/** Minutes since midnight for `now` in the given timezone. */
export function minutesNowInZone(timezone: string, now: Date = new Date()): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const hour = Number.parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = Number.parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return hour * 60 + minute;
}

/**
 * Whether the store is open at `now`. Identical open/close means "always
 * open"; malformed times also resolve to open so a config typo never blocks
 * live ordering.
 */
export function isStoreOpen(
  openTime: string,
  closeTime: string,
  timezone: string,
  now: Date = new Date()
): boolean {
  const open = parseTimeToMinutes(openTime);
  const close = parseTimeToMinutes(closeTime);
  if (open === null || close === null || open === close) return true;

  const current = minutesNowInZone(timezone, now);
  if (open < close) {
    return current >= open && current < close;
  }
  // Overnight window, e.g. 18:00 → 02:00
  return current >= open || current < close;
}
