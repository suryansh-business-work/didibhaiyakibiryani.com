#!/usr/bin/env node
/**
 * Waits for every local dev server to come up, then prints the stack table
 * (Name | Local Host Path | Deployed Path). Runs as the "status" task inside
 * `npm run all`.
 */

const SERVICES = [
  { name: "Website", local: "http://localhost:3000", deployed: "https://didibhaiyakibiryani.com" },
  { name: "Server (GraphQL)", local: "http://localhost:3001/health", deployed: "https://server.didibhaiyakibiryani.com" },
  { name: "Admin", local: "http://localhost:3002", deployed: "https://admin.didibhaiyakibiryani.com" },
  { name: "Native (Expo web)", local: "http://localhost:3003", deployed: "https://native.didibhaiyakibiryani.com" },
  { name: "Delivery (rider)", local: "http://localhost:3004", deployed: "https://delivery.didibhaiyakibiryani.com" },
  { name: "Survey", local: "http://localhost:3006", deployed: "https://survey.didibhaiyakibiryani.com" },
  { name: "Track", local: "http://localhost:3007", deployed: "https://track.didibhaiyakibiryani.com" },
  { name: "Signoz", local: "— (shared, VPS only)", deployed: "https://signoz.didibhaiyakibiryani.com" },
];

const TIMEOUT_MS = 180_000;
const POLL_MS = 2_000;

async function isUp(url) {
  if (!url.startsWith("http")) return true; // not locally hosted
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res.status < 500;
  } catch {
    return false;
  }
}

function pad(text, width) {
  return String(text).padEnd(width);
}

function printTable(rows) {
  const headers = ["Name", "Local Host Path", "Deployed Path"];
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i]).length))
  );
  const line = (l, m, r) => l + widths.map((w) => "─".repeat(w + 2)).join(m) + r;
  console.log(line("┌", "┬", "┐"));
  console.log("│ " + headers.map((h, i) => pad(h, widths[i])).join(" │ ") + " │");
  console.log(line("├", "┼", "┤"));
  for (const row of rows) {
    console.log("│ " + row.map((c, i) => pad(c, widths[i])).join(" │ ") + " │");
  }
  console.log(line("└", "┴", "┘"));
}

async function main() {
  console.log("⏳ Waiting for all local apps to come up…");
  const pending = new Set(SERVICES.filter((s) => s.local.startsWith("http")).map((s) => s.name));
  const deadline = Date.now() + TIMEOUT_MS;

  while (pending.size > 0 && Date.now() < deadline) {
    await Promise.all(
      SERVICES.filter((s) => pending.has(s.name)).map(async (s) => {
        if (await isUp(s.local)) {
          pending.delete(s.name);
          console.log(`  ✅ ${s.name} is up (${s.local})`);
        }
      })
    );
    if (pending.size > 0) {
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  }

  console.log("");
  if (pending.size > 0) {
    console.log(`⚠ Not up after ${TIMEOUT_MS / 1000}s: ${[...pending].join(", ")}`);
  } else {
    console.log("🎉 All apps are running:");
  }
  printTable(SERVICES.map((s) => [s.name, s.local.replace("/health", ""), s.deployed]));
}

main().catch((err) => {
  console.error("stack-status failed:", err.message);
});
