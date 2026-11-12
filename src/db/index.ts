import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

const isBuildTime = process.env.NEXT_PHASE === "phase-production-build" || process.env.NODE_ENV === "test";

const getPool = () => {
  if (!databaseUrl) {
    if (!isBuildTime) {
      throw new Error("DATABASE_URL is required");
    }
    // Return a mock pool for build time
    return null as unknown as Pool;
  }

  return (
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
    })
  );
};

export const pool = getPool();

if (!isBuildTime && databaseUrl) {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = databaseUrl ? drizzle(pool) : null as any;
