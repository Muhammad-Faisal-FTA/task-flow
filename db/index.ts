import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Missing DATABASE_URL");

const globalDb = globalThis as unknown as { pgPool?: Pool };
const pool = globalDb.pgPool ?? new Pool({ connectionString, max: 10 });
if (process.env.NODE_ENV !== "production") globalDb.pgPool = pool;

export const db = drizzle(pool, { schema });
export async function disconnectDB(): Promise<void> { await pool.end(); }
