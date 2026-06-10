import mongoose from "mongoose";

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
  console.log("✅ MongoDB connected:", mongoose.connection.name);

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB error:", err.message);
  });
}
