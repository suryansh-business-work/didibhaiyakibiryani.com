import { describe, it, expect } from "vitest";
import { signToken, verifyToken, getUserFromAuthHeader } from "../../src/utils/auth";

describe("JWT tokens", () => {
  it("round-trips a payload through sign/verify", () => {
    const token = signToken({ id: "abc123", role: "ADMIN" });
    const decoded = verifyToken(token);
    expect(decoded?.id).toBe("abc123");
    expect(decoded?.role).toBe("ADMIN");
  });

  it("returns null for a malformed token", () => {
    expect(verifyToken("not.a.valid.jwt")).toBeNull();
  });
});

describe("getUserFromAuthHeader", () => {
  it("extracts a payload from a Bearer header", () => {
    const token = signToken({ id: "u1", role: "CUSTOMER" });
    expect(getUserFromAuthHeader(`Bearer ${token}`)?.id).toBe("u1");
  });

  it("returns null for missing or non-Bearer headers", () => {
    expect(getUserFromAuthHeader(undefined)).toBeNull();
    expect(getUserFromAuthHeader("Basic abc")).toBeNull();
    expect(getUserFromAuthHeader("Bearer")).toBeNull();
  });
});
