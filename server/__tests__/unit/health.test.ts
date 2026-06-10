import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/utils/mailer.js", () => ({
  mailConfigured: vi.fn(() => false),
  verifySmtp: vi.fn(async () => undefined),
}));

import { buildHealthReport } from "../../src/routes/health";
import { mailConfigured, verifySmtp } from "../../src/utils/mailer.js";

const realFetch = globalThis.fetch;

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.fetch = vi.fn(async () => new Response("ok", { status: 200 })) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("buildHealthReport", () => {
  it("groups services by category and includes every probe", async () => {
    const report = await buildHealthReport();
    const categories = new Set(report.services.map((s) => s.category));
    expect(categories).toEqual(new Set(["Applications", "Database", "Email", "Integrations"]));
    const keys = report.services.map((s) => s.key);
    for (const key of ["server", "website", "admin", "native", "delivery", "signoz", "mongodb", "smtp", "imagekit", "razorpay"]) {
      expect(keys).toContain(key);
    }
  });

  it("reports SMTP as down when not configured", async () => {
    const report = await buildHealthReport();
    const smtp = report.services.find((s) => s.key === "smtp")!;
    expect(smtp.ok).toBe(false);
    expect(smtp.detail).toMatch(/not configured/i);
  });

  it("reports SMTP ok when verification succeeds", async () => {
    vi.mocked(mailConfigured).mockReturnValue(true);
    const report = await buildHealthReport();
    const smtp = report.services.find((s) => s.key === "smtp")!;
    expect(verifySmtp).toHaveBeenCalled();
    expect(smtp.ok).toBe(true);
  });

  it("marks an app down on non-200 and on network failure", async () => {
    globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes("admin")) return new Response("x", { status: 503 });
      if (String(url).includes("signoz")) throw new Error("connect ECONNREFUSED");
      return new Response("ok", { status: 200 });
    }) as typeof fetch;

    const report = await buildHealthReport();
    expect(report.services.find((s) => s.key === "admin")!.ok).toBe(false);
    const signoz = report.services.find((s) => s.key === "signoz")!;
    expect(signoz.ok).toBe(false);
    expect(signoz.detail).toMatch(/ECONNREFUSED/);
    expect(report.ok).toBe(false);
  });

  it("mongodb reflects the mongoose connection state (disconnected in tests)", async () => {
    const report = await buildHealthReport();
    const mongo = report.services.find((s) => s.key === "mongodb")!;
    expect(mongo.ok).toBe(false);
    expect(mongo.detail).toMatch(/disconnected|connecting/i);
  });
});
