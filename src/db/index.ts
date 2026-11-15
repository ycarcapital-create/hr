import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type AppDb = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  __asimoPgPool?: Pool;
  __asimoDrizzle?: AppDb;
};

const DATABASE_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
] as const;

export function resolveDatabaseUrl(): string | undefined {
  for (const key of DATABASE_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function isBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-export"
  );
}

function poolSsl(connectionString: string) {
  if (/localhost|127\.0\.0\.1/i.test(connectionString)) return undefined;
  if (process.env.PGSSLMODE === "disable") return undefined;
  return { rejectUnauthorized: false } as const;
}

export function getPool(): Pool | null {
  if (isBuildPhase() && !resolveDatabaseUrl()) {
    return null;
  }

  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    return null;
  }

  if (!globalForDb.__asimoPgPool) {
    globalForDb.__asimoPgPool = new Pool({
      connectionString,
      ssl: poolSsl(connectionString),
      max: process.env.VERCEL ? 3 : 10,
    });
  }

  return globalForDb.__asimoPgPool;
}

export function getDb(): AppDb | null {
  if (isBuildPhase() && !resolveDatabaseUrl()) {
    return null;
  }

  const activePool = getPool();
  if (!activePool) {
    return null;
  }

  if (!globalForDb.__asimoDrizzle) {
    globalForDb.__asimoDrizzle = drizzle(activePool, { schema });
  }

  return globalForDb.__asimoDrizzle;
}

export { getPool as pool };