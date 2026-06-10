import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  imagekitConfigured,
  imagekitUrlEndpoint,
  toBareBase64,
  uploadToImageKit,
} from "../../src/utils/imagekit";

const ENV_KEYS = ["IMAGEKIT_PRIVATE_KEY", "IMAGEKIT_URL_ENDPOINTS"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k];
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.restoreAllMocks();
});

describe("imagekitConfigured", () => {
  it("reflects the private key presence", () => {
    delete process.env.IMAGEKIT_PRIVATE_KEY;
    expect(imagekitConfigured()).toBe(false);
    process.env.IMAGEKIT_PRIVATE_KEY = "private_test";
    expect(imagekitConfigured()).toBe(true);
  });
});

describe("imagekitUrlEndpoint", () => {
  it("returns the first of a comma-separated list", () => {
    process.env.IMAGEKIT_URL_ENDPOINTS = " https://ik.imagekit.io/a , https://ik.imagekit.io/b ";
    expect(imagekitUrlEndpoint()).toBe("https://ik.imagekit.io/a");
  });

  it("returns empty when unset", () => {
    delete process.env.IMAGEKIT_URL_ENDPOINTS;
    expect(imagekitUrlEndpoint()).toBe("");
  });
});

describe("toBareBase64", () => {
  it("strips a data-URI prefix", () => {
    expect(toBareBase64("data:image/png;base64,AAAA")).toBe("AAAA");
  });

  it("passes bare base64 through unchanged", () => {
    expect(toBareBase64("AAAA")).toBe("AAAA");
  });
});

describe("uploadToImageKit", () => {
  it("throws when not configured", async () => {
    delete process.env.IMAGEKIT_PRIVATE_KEY;
    await expect(
      uploadToImageKit({ file: "AAAA", fileName: "x.png" })
    ).rejects.toThrow(/not configured/i);
  });

  it("posts the form and returns the CDN url", async () => {
    process.env.IMAGEKIT_PRIVATE_KEY = "private_test";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ url: "https://ik.imagekit.io/x/y.png", fileId: "f1" }), {
        status: 200,
      })
    );
    const result = await uploadToImageKit({
      file: "data:image/png;base64,AAAA",
      fileName: "y.png",
      folder: "/menu",
    });
    expect(result).toEqual({ url: "https://ik.imagekit.io/x/y.png", fileId: "f1" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("upload.imagekit.io");
    const form = init?.body as FormData;
    expect(form.get("file")).toBe("AAAA");
    expect(form.get("fileName")).toBe("y.png");
    expect(form.get("folder")).toBe("/menu");
    expect(String(init?.headers && (init.headers as Record<string, string>).Authorization)).toMatch(
      /^Basic /
    );
  });

  it("surfaces the ImageKit error message on failure", async () => {
    process.env.IMAGEKIT_PRIVATE_KEY = "private_test";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid file" }), { status: 400 })
    );
    await expect(uploadToImageKit({ file: "AAAA", fileName: "x.png" })).rejects.toThrow(
      "Invalid file"
    );
  });
});
