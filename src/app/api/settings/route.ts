import { NextRequest, NextResponse } from "next/server";
import { getDbForApi } from "@/lib/db-api";
import { ensureDatabaseReady } from "@/db/migrate";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  adminGuardResponse,
  checkAdminRequest,
  isAdminPasswordConfigured,
  isProductionDeploy,
} from "@/lib/admin-auth";
import { readEnv } from "@/lib/env";
import { getTelegramConfig } from "@/lib/telegram";

export const dynamic = "force-dynamic";

function mask(token: string): string {
  if (!token) return "";
  if (token.length <= 8) return "••••";
  return token.slice(0, 4) + "••••" + token.slice(-4);
}

export async function GET(req: NextRequest) {
  const admin = checkAdminRequest(req);
  if (!admin.ok) return adminGuardResponse(admin);

  const cfg = await getTelegramConfig();

  const payload = {
    botTokenSet: Boolean(cfg.botToken),
    botTokenMasked: mask(cfg.botToken),
    chatId: cfg.chatId,
    telegramSource: cfg.source,
    hasDbConfig: cfg.source === "db" || cfg.source === "mixed",
    hasEnvConfig: Boolean(readEnv("TELEGRAM_BOT_TOKEN", "TELEGRAM_TOKEN") && readEnv("TELEGRAM_CHAT_ID", "TELEGRAM_CHAT_IDS")),
    adminPasswordSet: isAdminPasswordConfigured(),
    adminPasswordRequired: isProductionDeploy(),
  };

  const dbOrResponse = getDbForApi();
  if (dbOrResponse instanceof NextResponse) {
    return NextResponse.json(payload);
  }
  const db = dbOrResponse;

  const migrated = await ensureDatabaseReady();
  if (!migrated.ok) {
    return NextResponse.json({ ...payload, warning: migrated.error });
  }

  try {
    await db.select().from(appSettings).limit(1);
    return NextResponse.json(payload);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "DB error";
    return NextResponse.json({ ...payload, warning: message });
  }
}

export async function POST(req: NextRequest) {
  const admin = checkAdminRequest(req);
  if (!admin.ok) return adminGuardResponse(admin);

  const dbOrResponse = getDbForApi();
  if (dbOrResponse instanceof NextResponse) return dbOrResponse;
  const db = dbOrResponse;

  const migrated = await ensureDatabaseReady();
  if (!migrated.ok) {
    return NextResponse.json({ error: migrated.error }, { status: 500 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      botToken?: string;
      chatId?: string;
    };
    let botToken = (body.botToken ?? "").trim();
    let chatId = (body.chatId ?? "").trim();

    const existing = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, "telegram"))
      .limit(1);

    if (existing[0]?.value) {
      try {
        const parsed = JSON.parse(existing[0].value) as { botToken?: string; chatId?: string };
        if (!botToken) botToken = parsed.botToken?.trim() ?? "";
        if (!chatId) chatId = parsed.chatId?.trim() ?? "";
      } catch {
        // ignore
      }
    }

    const envToken = readEnv("TELEGRAM_BOT_TOKEN", "TELEGRAM_TOKEN");
    const envChat = readEnv("TELEGRAM_CHAT_ID", "TELEGRAM_CHAT_IDS");
    if (!botToken) botToken = envToken;
    if (!chatId) chatId = envChat;

    const value = JSON.stringify({ botToken, chatId });

    if (existing.length === 0) {
      await db.insert(appSettings).values({ key: "telegram", value });
    } else {
      await db.update(appSettings).set({ value, updatedAt: new Date() }).where(eq(appSettings.key, "telegram"));
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "DB error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}