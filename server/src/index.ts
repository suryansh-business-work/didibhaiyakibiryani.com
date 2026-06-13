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
import { ratingRouter } from "./routes/rating.js";
import { healthRouter } from "./routes/health.js";
import { typeDefs } from "./graphql/typeDefs.js";
import { resolvers } from "./graphql/resolvers/index.js";
import { getUserFromAuthHeader, type Context } from "./utils/auth.js";

const PORT = Number(process.env.PORT) || 3001;
const ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Capacitor/Cordova WebViews (the delivery & consumer APKs) send these origins.
// They must be allowed regardless of CORS_ORIGINS, or on-device login fails.
const NATIVE_APP_ORIGINS = new Set([
  "capacitor://localhost",
  "ionic://localhost",
  "https://localhost",
  "http://localhost",
]);

/** Allow configured web origins + native app WebViews + origin-less requests. */
function corsOrigin(
  origin: string | undefined,
  cb: (err: Error | null, allow?: boolean) => void
): void {
  if (!origin || !ORIGINS.length) return cb(null, true);
  if (ORIGINS.includes(origin) || NATIVE_APP_ORIGINS.has(origin)) return cb(null, true);
  cb(new Error(`Origin ${origin} not allowed by CORS`));
}

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

  // Public post-delivery rating survey (linked from the delivered email).
  app.use(ratingRouter);

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
