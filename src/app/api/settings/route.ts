import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function checkAdmin(req: NextRequest): boolean {
  const required = (process.env.ADMIN_PASSWORD ?? "").trim();
  if (!required) return true;
  const got =
    req.headers.get("x-admin-password") ??
    new URL(req.url).searchParams.get("pwd") ??
    "";
  return got === required;
}

function mask(token: string): string {
  if (!token) return "";
  if (token.length <= 8) return "••••";
  return token.slice(0, 4) + "••••" + token.slice(-4);
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }
  try {
    const rows = await db.select().from(appSettings);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
    let botToken = "";
    let chatId = "";
    if (map["telegram"]) {
      try {
        const p = JSON.parse(map["telegram"]);
        botToken = p.botToken ?? "";
        chatId = p.chatId ?? "";
      } catch {
        // ignore
      }
    }
    if (map["telegram_bot_token"]) botToken = map["telegram_bot_token"];
    if (map["telegram_chat_id"]) chatId = map["telegram_chat_id"];

    const envToken = (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
    const envChat = (process.env.TELEGRAM_CHAT_ID ?? "").trim();

    return NextResponse.json({
      botTokenSet: Boolean(botToken || envToken),
      botTokenMasked: mask(botToken || envToken),
      chatId: chatId || envChat,
      hasDbConfig: Boolean(botToken || chatId),
      hasEnvConfig: Boolean(envToken && envChat),
      adminPasswordSet: Boolean((process.env.ADMIN_PASSWORD ?? "").trim()),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "DB error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as {
      botToken?: string;
      chatId?: string;
    };
    const botToken = (body.botToken ?? "").trim();
    const chatId = (body.chatId ?? "").trim();

    const value = JSON.stringify({ botToken, chatId });
    const existing = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, "telegram"))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(appSettings).values({ key: "telegram", value });
    } else {
      await db.update(appSettings).set({ value, updatedAt: new Date() }).where(eq(appSettings.key, "telegram"));
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "DB error" }, { status: 500 });
  }
}
