// lib/mongoose.ts

import mongoose, { Mongoose } from "mongoose";

// Read connection string from environment for flexibility and security
const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI — add it to .env.local:\nMONGODB_URI=mongodb://localhost:27017/taskflow"
  );
}

// ─── Module-level cache ───────────────────────────────────────────────────────
// Next.js hot-reload creates new module instances in dev.
// Storing on `global` ensures we reuse the same connection.
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};
global._mongooseCache = cache;

// ─── Connect ──────────────────────────────────────────────────────────────────
export async function connectDB(): Promise<Mongoose> {
  // 1. Already connected — return immediately (performance: no re-connect)
  if (cache.conn) return cache.conn;

  // 2. Connection in progress — wait for it (handles concurrent requests)
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false, // Fail fast — don't queue ops if disconnected
        maxPoolSize: 10, // Up to 10 concurrent DB operations
        serverSelectionTimeoutMS: 8000, // Fail after 8s if Atlas unreachable
        socketTimeoutMS: 45000, // Close idle sockets after 45s
      })
      .catch((err) => {
        console.error("MongoDB connection failed:", err && err.message ? err.message : err);
        throw err;
      });
  }

  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (err) {
    console.error("connectDB: unable to establish mongoose connection");
    throw err;
  }
}

// ─── Disconnect (used in tests) ───────────────────────────────────────────────
export async function disconnectDB(): Promise<void> {
  if (cache.conn) {
    await mongoose.disconnect();
    cache.conn = null;
    cache.promise = null;
  }
}