import { NextRequest, NextResponse } from "next/server";
import { getDbForApi } from "@/lib/db-api";
import { ensureDatabaseReady } from "@/db/migrate";
import { candidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { adminGuardResponse, checkAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function resolveDb() {
  const dbOrResponse = getDbForApi();
  if (dbOrResponse instanceof NextResponse) return dbOrResponse;
  const migrated = await ensureDatabaseReady();
  if (!migrated.ok) {
    return NextResponse.json({ error: migrated.error }, { status: 500 });
  }
  return dbOrResponse;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = checkAdminRequest(req);
  if (!admin.ok) return adminGuardResponse(admin);
  const { id } = await params;
  const dbOrResponse = await resolveDb();
  if (dbOrResponse instanceof NextResponse) return dbOrResponse;
  const db = dbOrResponse;
  try {
    const body = (await req.json().catch(() => ({}))) as { status?: string; notes?: string };
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.status === "string") patch.status = body.status;
    if (typeof body.notes === "string") patch.notes = body.notes;
    await db.update(candidates).set(patch as any).where(eq(candidates.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "DB error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = checkAdminRequest(req);
  if (!admin.ok) return adminGuardResponse(admin);
  const { id } = await params;
  const dbOrResponse = await resolveDb();
  if (dbOrResponse instanceof NextResponse) return dbOrResponse;
  const db = dbOrResponse;
  try {
    await db.delete(candidates).where(eq(candidates.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "DB error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // resend to telegram
  const admin = checkAdminRequest(req);
  if (!admin.ok) return adminGuardResponse(admin);
  const { id } = await params;
  const dbOrResponse = await resolveDb();
  if (dbOrResponse instanceof NextResponse) return dbOrResponse;
  const db = dbOrResponse;
  try {
    const { getTelegramConfig, buildTelegramMessage, sendToTelegram } = await import("@/lib/telegram");
    const rows = await db.select().from(candidates).where(eq(candidates.id, id)).limit(1);
    const row = rows[0];
    if (!row) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    const cfg = await getTelegramConfig();
    if (!cfg.botToken || !cfg.chatId) {
      return NextResponse.json({ error: "Telegram не настроен" }, { status: 400 });
    }
    const raw = (row.raw as Record<string, any>) ?? {
      fio: row.fio,
      contact: row.contact,
      city: row.city,
    };
    const html = buildTelegramMessage(raw, row.score ?? 0, row.scoreLabel ?? "");
    const res = await sendToTelegram(cfg.botToken, cfg.chatId, html);
    if (res.ok) {
      await db
        .update(candidates)
        .set({ telegramSent: true, telegramMessageId: res.messageId ?? null, updatedAt: new Date() })
        .where(eq(candidates.id, id));
    }
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
