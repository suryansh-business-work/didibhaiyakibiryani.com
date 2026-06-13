import { describe, it, expect, vi } from "vitest";
import { ctxFor } from "../helpers/db";

vi.mock("../../src/utils/imagekit.js", () => ({
  imagekitConfigured: vi.fn(async () => true),
  uploadToImageKit: vi.fn(async (a: { fileName: string }) => ({ url: `https://ik/${a.fileName}`, fileId: "f1" })),
}));

import { uploadResolvers } from "../../src/graphql/resolvers/upload";
import { imagekitConfigured } from "../../src/utils/imagekit.js";

const adminCtx = ctxFor("admin1", "ADMIN");
const custCtx = ctxFor("cust1", "CUSTOMER");

describe("upload resolver", () => {
  it("uploadImage (admin) + uploadSupportImage (auth) + guards", async () => {
    await expect(uploadResolvers.Mutation.uploadImage(null, { file: "data:image/png;base64,AAAA", fileName: "a.png" }, custCtx)).rejects.toThrow();
    const res = await uploadResolvers.Mutation.uploadImage(null, { file: "data:image/png;base64,AAAA", fileName: "a.png", folder: "/menu" }, adminCtx);
    expect(res.url).toContain("a.png");

    const sup = await uploadResolvers.Mutation.uploadSupportImage(null, { file: "AAAA", fileName: "s.png" }, custCtx);
    expect(sup.url).toContain("s.png");

    await expect(uploadResolvers.Mutation.uploadImage(null, { file: "", fileName: "x.png" }, adminCtx)).rejects.toThrow(/missing|larger/i);

    vi.mocked(imagekitConfigured).mockResolvedValueOnce(false);
    await expect(uploadResolvers.Mutation.uploadImage(null, { file: "AAAA", fileName: "x.png" }, adminCtx)).rejects.toThrow(/not configured/i);
  });
});
