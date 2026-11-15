import { NextRequest, NextResponse } from "next/server";
import { getTelegramConfig, sendToTelegram } from "@/lib/telegram";
import { adminGuardResponse, checkAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = checkAdminRequest(req);
  if (!admin.ok) return adminGuardResponse(admin);

  try {
    const body = (await req.json().catch(() => ({}))) as {
      botToken?: string;
      chatId?: string;
    };
    let botToken = (body.botToken ?? "").trim();
    let chatId = (body.chatId ?? "").trim();
    if (!botToken || !chatId) {
      const cfg = await getTelegramConfig();
      botToken = botToken || cfg.botToken;
      chatId = chatId || cfg.chatId;
    }
    if (!botToken || !chatId) {
      return NextResponse.json(
        {
          error:
            "Укажите TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в Vercel или сохраните в админке. Убедитесь, что вы нажали /start у бота в личке или добавили бота в группу.",
        },
        { status: 400 }
      );
    }
    const html =
      `✅ <b>ASIMO.BY — Telegram подключён!</b>\n\n` +
      `Анкеты кандидатов на вакансию <b>Business Development Manager</b> будут приходить в этот чат.\n` +
      `Время проверки: ${new Date().toLocaleString("ru-RU")}`;
    const res = await sendToTelegram(botToken, chatId, html);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json({ ok: true, messageId: res.messageId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}