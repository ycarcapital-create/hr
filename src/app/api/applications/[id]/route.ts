import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function checkAdmin(req: NextRequest): boolean {
  const required = (process.env.ADMIN_PASSWORD ?? "").trim();
  if (!required) return true;
  return (req.headers.get("x-admin-password") ?? "") === required;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }
  const { id } = await params;
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
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await db.delete(candidates).where(eq(candidates.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "DB error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // resend to telegram
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }
  const { id } = await params;
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
