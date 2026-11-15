import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureDatabaseReady } from "@/db/migrate";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = getDb();
  if (!database) {
    return Response.json(
      { ok: false, error: "Database not configured (DATABASE_URL / POSTGRES_URL)" },
      { status: 503 }
    );
  }

  const migrated = await ensureDatabaseReady();
  if (!migrated.ok) {
    return Response.json({ ok: false, error: migrated.error }, { status: 500 });
  }

  try {
    await database.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DB error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}