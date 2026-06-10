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
