import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDb } from "./index";

let migrationPromise: Promise<void> | null = null;

export async function ensureDatabaseReady(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const database = getDb();
  if (!database) {
    return { ok: false, error: "Database not configured" };
  }

  if (!migrationPromise) {
    migrationPromise = migrate(database, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    }).catch((err: unknown) => {
      migrationPromise = null;
      throw err;
    });
  }

  try {
    await migrationPromise;
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Migration failed";
    return { ok: false, error: message };
  }
}