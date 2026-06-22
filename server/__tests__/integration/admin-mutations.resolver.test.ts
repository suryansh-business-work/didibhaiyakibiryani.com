import { describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";
import { useTestDb, ctxFor } from "../helpers/db";
import { makeUser, makeOrder } from "../helpers/fixtures";

const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn(async () => true) }));
vi.mock("../../src/utils/mailer.js", () => ({
  sendMail,
  sendMailAsync: vi.fn(),
  resolveMailConfig: vi.fn(async () => null),
}));

import { orderResolvers } from "../../src/graphql/resolvers/order";
import { deliveryResolvers } from "../../src/graphql/resolvers/delivery";
import { supportResolvers } from "../../src/graphql/resolvers/support";
import { dashboardResolvers } from "../../src/graphql/resolvers/dashboard";
import { integrationResolvers } from "../../src/graphql/resolvers/integrations";
import { SupportTicket, Settings, SETTINGS_KEY } from "../../src/models/index.js";

useTestDb();
const admin = ctxFor("admin1", "ADMIN");
const customer = ctxFor("cust1", "CUSTOMER");
const O = orderResolvers.Mutation;
const D = deliveryResolvers.Mutation;
const MISSING = new Types.ObjectId().toString();

describe("order delete mutations", () => {
  it("deletes a single order and guards missing / non-admin", async () => {
    const cust = await makeUser();
    const order = await makeOrder(cust.id);
    await expect(O.deleteOrder(null, { id: order.id }, customer)).rejects.toThrow();
    expect(await O.deleteOrder(null, { id: order.id }, admin)).toBe(true);
    await expect(O.deleteOrder(null, { id: order.id }, admin)).rejects.toThrow(/not found/i);
  });

  it("bulk-deletes orders (and returns 0 for an empty list)", async () => {
    const cust = await makeUser();
    const a = await makeOrder(cust.id);
    const b = await makeOrder(cust.id);
    expect(await O.deleteOrders(null, { ids: [] }, admin)).toBe(0);
    expect(await O.deleteOrders(null, { ids: [a.id, b.id, MISSING] }, admin)).toBe(2);
  });
});

describe("staff (rider) update + delete mutations", () => {
  async function makeRider(email = "rider@b.com") {
    return D.createStaffUser(
      null,
      { name: "Rider", email, phone: "9", password: "secret1", role: "DELIVERY" },
      admin
    );
  }

  it("updates a rider (with and without a password change) and guards", async () => {
    const rider = await makeRider();
    const cust = await makeUser("CUSTOMER");

    await expect(D.updateStaffUser(null, { id: cust.id, name: "X" }, admin)).rejects.toThrow(/not found/i);
    await expect(D.updateStaffUser(null, { id: MISSING, name: "X" }, admin)).rejects.toThrow(/not found/i);

    const updated = await D.updateStaffUser(
      null,
      { id: rider.id, name: "New Name", phone: "999", isActive: false },
      admin
    );
    expect(updated.name).toBe("New Name");
    expect(updated.isActive).toBe(false);

    const rehashed = await D.updateStaffUser(null, { id: rider.id, password: "freshpass" }, admin);
    expect(rehashed.id).toBe(rider.id);

    await expect(D.updateStaffUser(null, { id: rider.id, password: "123" }, admin)).rejects.toThrow(
      /6 characters/i
    );
  });

  it("deletes a rider and guards missing / wrong role", async () => {
    const rider = await makeRider("rider2@b.com");
    const cust = await makeUser("CUSTOMER");
    await expect(D.deleteStaffUser(null, { id: cust.id }, admin)).rejects.toThrow(/not found/i);
    expect(await D.deleteStaffUser(null, { id: rider.id }, admin)).toBe(true);
    await expect(D.deleteStaffUser(null, { id: rider.id }, admin)).rejects.toThrow(/not found/i);
  });
});

describe("support ticket delete", () => {
  async function makeTicket() {
    const cust = await makeUser("CUSTOMER");
    const order = await makeOrder(cust.id);
    return SupportTicket.create({ order: order._id, user: cust._id, subject: "Help", body: "Issue" });
  }

  it("deletes a ticket and guards missing", async () => {
    const ticket = await makeTicket();
    expect(await supportResolvers.Mutation.deleteSupportTicket(null, { ticketId: ticket.id }, admin)).toBe(true);
    await expect(
      supportResolvers.Mutation.deleteSupportTicket(null, { ticketId: ticket.id }, admin)
    ).rejects.toThrow(/not found/i);
  });
});

describe("customer update + delete", () => {
  const C = dashboardResolvers.Mutation;

  it("updates a customer and guards non-customers / missing", async () => {
    const cust = await makeUser("CUSTOMER");
    const rider = await makeUser("DELIVERY");
    const updated = await C.updateCustomer(null, { id: cust.id, name: "Renamed", phone: "98765" }, admin);
    expect(updated.name).toBe("Renamed");
    expect(updated.phone).toBe("98765");
    await expect(C.updateCustomer(null, { id: rider.id, name: "X" }, admin)).rejects.toThrow(/not found/i);
    await expect(C.updateCustomer(null, { id: MISSING, name: "X" }, admin)).rejects.toThrow(/not found/i);
  });

  it("deletes a customer and guards non-customers", async () => {
    const cust = await makeUser("CUSTOMER");
    const rider = await makeUser("DELIVERY");
    await expect(C.deleteCustomer(null, { id: rider.id }, admin)).rejects.toThrow(/not found/i);
    expect(await C.deleteCustomer(null, { id: cust.id }, admin)).toBe(true);
  });
});

describe("sendTestEmail", () => {
  const I = integrationResolvers.Mutation;

  it("sends to an explicit recipient", async () => {
    sendMail.mockResolvedValueOnce(true);
    expect(await I.sendTestEmail(null, { to: "ops@x.com" }, admin)).toBe(true);
  });

  it("falls back to the support email when no recipient is given", async () => {
    await Settings.findOneAndUpdate({ key: SETTINGS_KEY }, { supportEmail: "ops@x.com" }, { upsert: true });
    sendMail.mockResolvedValueOnce(true);
    expect(await I.sendTestEmail(null, {}, admin)).toBe(true);
  });

  it("rejects when there is no recipient at all", async () => {
    await expect(I.sendTestEmail(null, {}, admin)).rejects.toThrow(/recipient/i);
  });

  it("throws when SMTP send fails", async () => {
    sendMail.mockResolvedValueOnce(false);
    await expect(I.sendTestEmail(null, { to: "ops@x.com" }, admin)).rejects.toThrow(/SMTP/i);
  });
});
