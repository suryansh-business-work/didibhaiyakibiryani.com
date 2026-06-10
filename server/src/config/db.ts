import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

export async function connectDB(uri: string): Promise<void> {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is empty. Paste your MongoDB Atlas connection string into server/.env"
    );
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
  logger.info({ db: mongoose.connection.name }, "MongoDB connected");

  mongoose.connection.on("error", (err) => {
    logger.error({ err: err.message }, "MongoDB error");
  });
}

const RETRY_MS = 5000;

/**
 * Keep trying to connect without crashing the process, so the HTTP server
 * (health endpoints, status page) stays up while the database is unreachable.
 */
export function connectDBWithRetry(uri: string): void {
  connectDB(uri).catch((err: unknown) => {
    logger.error(
      { err: err instanceof Error ? err.message : String(err), retryInMs: RETRY_MS },
      "MongoDB connection failed — retrying"
    );
    setTimeout(() => connectDBWithRetry(uri), RETRY_MS);
  });
}

/** Human-readable mongo connection state for health reporting. */
export function dbState(): { ok: boolean; state: string } {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const code = mongoose.connection.readyState;
  return { ok: code === 1, state: states[code] ?? `unknown(${code})` };
}
