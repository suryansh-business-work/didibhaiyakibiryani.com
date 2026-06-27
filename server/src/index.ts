import "./instrumentation.js";
import "dotenv/config";
import express from "express";
import http from "node:http";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import { logger } from "./utils/logger.js";
import { connectDBWithRetry } from "./config/db.js";
import { razorpayWebhook } from "./webhooks/razorpay.js";
import { receiptRouter } from "./routes/receipt.js";
import { exportRouter } from "./routes/export.js";
import { healthRouter } from "./routes/health.js";
import { typeDefs } from "./graphql/typeDefs.js";
import { resolvers } from "./graphql/resolvers/index.js";
import { getUserFromAuthHeader, type Context } from "./utils/auth.js";
import { makeCorsOrigin, parseOrigins } from "./utils/cors.js";

const PORT = Number(process.env.PORT) || 3001;
// Allow configured web origins + native app WebViews (delivery/consumer apps).
const corsOrigin = makeCorsOrigin(parseOrigins(process.env.CORS_ORIGINS));

async function start() {
  // Non-fatal: HTTP (health/status) stays up while Mongo reconnects.
  connectDBWithRetry(process.env.MONGODB_URI || "");

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

  // Aggregated platform health for the public /status page.
  app.use(healthRouter);

  // Razorpay webhook — raw body so the HMAC covers the exact bytes sent.
  app.post(
    "/webhooks/razorpay",
    express.raw({ type: "application/json", limit: "1mb" }),
    razorpayWebhook
  );

  // Public token-gated receipt PDF (download link). The customer survey + live
  // tracking pages are now standalone React apps (survey./track. subdomains)
  // that read the public surveyOrder/trackOrder GraphQL queries by order number.
  app.use(receiptRouter);

  // Admin-only Excel/PDF exports. CORS + Authorization header (the admin fetches
  // these as a blob), so they need the same cross-origin handling as /graphql.
  app.use(
    "/export",
    cors<cors.CorsRequest>({ origin: corsOrigin, credentials: true }),
    exportRouter
  );

  app.use(
    "/graphql",
    cors<cors.CorsRequest>({
      origin: corsOrigin,
      credentials: true,
    }),
    // 12mb: admin image uploads travel as base64 through the uploadImage mutation.
    express.json({ limit: "12mb" }),
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
