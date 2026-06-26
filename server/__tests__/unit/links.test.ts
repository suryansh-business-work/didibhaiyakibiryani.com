import { describe, it, expect, vi, afterEach } from "vitest";
import {
  resolvePublicUrl,
  SURVEY_PUBLIC_URL,
  TRACK_PUBLIC_URL,
  SERVER_PUBLIC_URL,
} from "../../src/utils/links";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolvePublicUrl", () => {
  it("prefers a trimmed explicit override over the environment defaults", () => {
    expect(resolvePublicUrl("  https://custom.test  ", "http://localhost:1", "https://prod")).toBe(
      "https://custom.test"
    );
  });

  it("falls back to the localhost dev url when not in production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(resolvePublicUrl(undefined, "http://localhost:3006", "https://prod")).toBe("http://localhost:3006");
    // A blank/whitespace override is ignored (treated as "not set").
    expect(resolvePublicUrl("   ", "http://localhost:3006", "https://prod")).toBe("http://localhost:3006");
  });

  it("uses the production domain when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(resolvePublicUrl(undefined, "http://localhost:3006", "https://survey.prod")).toBe("https://survey.prod");
  });
});

describe("public base urls (dev defaults)", () => {
  it("point at localhost in the test/dev environment", () => {
    expect(SURVEY_PUBLIC_URL).toBe("http://localhost:3006");
    expect(TRACK_PUBLIC_URL).toBe("http://localhost:3007");
    expect(SERVER_PUBLIC_URL).toBe("http://localhost:3001");
  });
});
