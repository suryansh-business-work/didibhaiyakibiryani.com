import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach } from "vitest";

let mongod: MongoMemoryServer | null = null;

/** Spin up an in-memory MongoDB and wire mongoose to it for a test file. */
export function useTestDb(): void {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });
  afterEach(async () => {
    const { collections } = mongoose.connection;
    await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
  });
  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });
}

/** A fake GraphQL context for a signed-in user of the given role. */
export function ctxFor(id: string, role: "CUSTOMER" | "ADMIN" | "STAFF" | "DELIVERY") {
  return { user: { id, role } };
}
