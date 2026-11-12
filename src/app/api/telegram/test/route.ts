import { NextRequest, NextResponse } from "next/server";
import { getTelegramConfig, sendToTelegram } from "@/lib/telegram";

export const dynamic = "force-dynamic";

function checkAdmin(req: NextRequest): boolean {
  const required = (process.env.ADMIN_PASSWORD ?? "").trim();
  if (!required) return true;
  return (req.headers.get("x-admin-password") ?? "") === required;
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
    let botToken = (body.botToken ?? "").trim();
    let chatId = (body.chatId ?? "").trim();
    if (!botToken || !chatId) {
      const cfg = await getTelegramConfig();
      botToken = botToken || cfg.botToken;
      chatId = chatId || cfg.chatId;
    }
    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: "Укажите токен бота и chat_id" },
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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
