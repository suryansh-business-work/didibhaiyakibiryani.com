import { describe, it, expect } from "vitest";
import { ApolloServer } from "@apollo/server";
import { typeDefs } from "../../src/graphql/typeDefs";
import { resolvers } from "../../src/graphql/resolvers/index";
import type { Context } from "../../src/utils/auth";

/**
 * Integration smoke: the SDL and every resolver compose into a valid,
 * startable executable schema, and auth guards run before any data access.
 */
describe("GraphQL schema integration", () => {
  it("composes and starts a valid executable schema", async () => {
    const server = new ApolloServer<Context>({ typeDefs, resolvers });
    await expect(server.start()).resolves.toBeUndefined();
    await server.stop();
  });

  it("rejects unauthenticated admin mutations before touching the database", async () => {
    const server = new ApolloServer<Context>({ typeDefs, resolvers });
    await server.start();

    const res = await server.executeOperation(
      {
        query: `mutation { updateSettings(input: { brandName: "x" }) { brandName } }`,
      },
      { contextValue: { user: null } }
    );

    expect(res.body.kind).toBe("single");
    if (res.body.kind === "single") {
      expect(res.body.singleResult.errors?.[0]?.extensions?.code).toBe("UNAUTHENTICATED");
    }
    await server.stop();
  });

  it("rejects unauthenticated image uploads", async () => {
    const server = new ApolloServer<Context>({ typeDefs, resolvers });
    await server.start();

    const res = await server.executeOperation(
      {
        query: `mutation { uploadImage(file: "AAAA", fileName: "x.png") { url } }`,
      },
      { contextValue: { user: null } }
    );

    expect(res.body.kind).toBe("single");
    if (res.body.kind === "single") {
      expect(res.body.singleResult.errors?.[0]?.extensions?.code).toBe("UNAUTHENTICATED");
    }
    await server.stop();
  });
});
