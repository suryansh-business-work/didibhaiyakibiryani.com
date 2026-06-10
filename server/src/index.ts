import "dotenv/config";
import express from "express";
import http from "node:http";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import { logger } from "./utils/logger.js";
import { connectDB } from "./config/db.js";
import { razorpayWebhook } from "./webhooks/razorpay.js";
import { typeDefs } from "./graphql/typeDefs.js";
import { resolvers } from "./graphql/resolvers/index.js";
import { getUserFromAuthHeader, type Context } from "./utils/auth.js";

const PORT = Number(process.env.PORT) || 3001;
const ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function start() {
  await connectDB(process.env.MONGODB_URI || "");

  const app = express();
  const httpServer = http.createServer(app);

  // Structured request logging (quiet for health checks).
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === "/health" },
    })
  );

  const apollo = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });
  await apollo.start();

  app.get("/", (_req, res) =>
    res.json({ ok: true, service: "ddb-server", graphql: "/graphql", health: "/health" })
  );
  app.get("/health", (_req, res) => res.json({ ok: true, service: "ddb-server" }));

  // Razorpay webhook — raw body so the HMAC covers the exact bytes sent.
  app.post(
    "/webhooks/razorpay",
    express.raw({ type: "application/json", limit: "1mb" }),
    razorpayWebhook
  );

  app.use(
    "/graphql",
    cors<cors.CorsRequest>({
      origin: ORIGINS.length ? ORIGINS : true,
      credentials: true,
    }),
    express.json({ limit: "1mb" }),
    expressMiddleware(apollo, {
      context: async ({ req }): Promise<Context> => ({
        user: getUserFromAuthHeader(req.headers.authorization),
      }),
    })
  );

  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  logger.info({ port: PORT }, "GraphQL server ready");
}

start().catch((err) => {
  logger.fatal({ err: err.message }, "Failed to start server");
  process.exit(1);
});
