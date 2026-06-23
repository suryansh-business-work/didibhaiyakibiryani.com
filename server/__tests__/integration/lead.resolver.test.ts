import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { useTestDb, ctxFor } from "../helpers/db";
import { leadResolvers } from "../../src/graphql/resolvers/lead";

useTestDb();
const adminCtx = ctxFor("admin1", "ADMIN");
const Q = leadResolvers.Query;
const M = leadResolvers.Mutation;

describe("lead resolver", () => {
  it("creates, lists (with/without search), updates and deletes contacts", async () => {
    const full = await M.createLead(
      null,
      { name: "Asha Verma", phone: "98100", email: "Asha@B.com", note: "VIP", address: "A-1 Street", society: "Prestige", block: "B", flat: "101" },
      adminCtx
    );
    expect(full.email).toBe("asha@b.com");
    expect(full.note).toBe("VIP");
    expect(full.society).toBe("Prestige");
    expect(full.flat).toBe("101");

    const sparse = await M.createLead(null, { name: "Ravi", phone: "98200" }, adminCtx);
    expect(sparse.email).toBeUndefined();
    expect(sparse.note).toBeUndefined();

    expect((await Q.leads(null, {}, adminCtx)).length).toBe(2);
    expect((await Q.leads(null, { search: "asha" }, adminCtx)).length).toBe(1);

    // Set every field (truthy values).
    const u1 = await M.updateLead(
      null,
      { id: full.id, name: "Asha V", phone: "99999", email: "AV@B.com", note: "gold", address: "A-2", society: "Lakeside", block: "C", flat: "202" },
      adminCtx
    );
    expect(u1.name).toBe("Asha V");
    expect(u1.email).toBe("av@b.com");
    expect(u1.society).toBe("Lakeside");

    // Omit optional fields — they stay unchanged.
    const u2 = await M.updateLead(null, { id: full.id }, adminCtx);
    expect(u2.name).toBe("Asha V");
    expect(u2.society).toBe("Lakeside");

    // Clear optional fields (empty → undefined).
    const u3 = await M.updateLead(null, { id: full.id, email: "", note: "", address: "", society: "", block: "", flat: "" }, adminCtx);
    expect(u3.email).toBeUndefined();
    expect(u3.note).toBeUndefined();
    expect(u3.society).toBeUndefined();

    expect(await M.deleteLead(null, { id: sparse.id }, adminCtx)).toBe(true);
    expect((await Q.leads(null, {}, adminCtx)).length).toBe(1);
  });

  it("rejects updates/deletes for unknown ids", async () => {
    const ghost = new Types.ObjectId().toString();
    await expect(M.updateLead(null, { id: ghost, name: "x" }, adminCtx)).rejects.toThrow(/not found/i);
    await expect(M.deleteLead(null, { id: ghost }, adminCtx)).rejects.toThrow(/not found/i);
  });
});
