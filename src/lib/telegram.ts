import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { readEnv } from "@/lib/env";

const TOKEN_ENV_KEYS = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_TOKEN", "BOT_TOKEN"] as const;
const CHAT_ENV_KEYS = ["TELEGRAM_CHAT_ID", "TELEGRAM_CHAT_IDS", "CHAT_ID"] as const;

export async function getTelegramConfig(): Promise<{
  botToken: string;
  chatId: string;
  source: "db" | "env" | "mixed" | "none";
}> {
  const envToken = readEnv(...TOKEN_ENV_KEYS);
  const envChat = readEnv(...CHAT_ENV_KEYS);

  let dbToken = "";
  let dbChat = "";

  const db = getDb();
  if (db) {
    try {
      const rows = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, "telegram"));
      const raw = rows[0]?.value;
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { botToken?: string; chatId?: string };
          dbToken = parsed.botToken?.trim() ?? "";
          dbChat = parsed.chatId?.trim() ?? "";
        } catch {
          // ignore
        }
      }
      const [tRow, cRow] = await Promise.all([
        db.select().from(appSettings).where(eq(appSettings.key, "telegram_bot_token")),
        db.select().from(appSettings).where(eq(appSettings.key, "telegram_chat_id")),
      ]);
      if (tRow[0]?.value?.trim()) dbToken = tRow[0].value.trim();
      if (cRow[0]?.value?.trim()) dbChat = cRow[0].value.trim();
    } catch {
      // db may not be migrated yet
    }
  }

  // На Vercel приоритет у env — в БД часто остаётся пустой токен после «Сохранить» без повторного ввода.
  const botToken = envToken || dbToken;
  const chatId = envChat || dbChat;

  let source: "db" | "env" | "mixed" | "none" = "none";
  if (botToken && chatId) {
    const tokenFromEnv = Boolean(envToken);
    const chatFromEnv = Boolean(envChat);
    const tokenFromDb = Boolean(dbToken);
    const chatFromDb = Boolean(dbChat);
    if (tokenFromEnv && chatFromEnv && !tokenFromDb && !chatFromDb) source = "env";
    else if (!tokenFromEnv && !chatFromEnv && tokenFromDb && chatFromDb) source = "db";
    else if (tokenFromEnv || chatFromEnv) source = "mixed";
    else source = "db";
  }

  return { botToken, chatId, source };
}

export function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function row(label: string, value: unknown): string {
  const v = String(value ?? "").trim();
  if (!v) return "";
  return `• <b>${escapeHtml(label)}:</b> ${escapeHtml(v)}\n`;
}

export function buildTelegramMessage(p: Record<string, any>, score: number, label: string): string {
  const lines: string[] = [];
  lines.push(`🧲 <b>Новая анкета — BDM | ASIMO.BY</b>`);
  lines.push(`⭐ <b>Скоринг: ${score}/100 — ${escapeHtml(label)}</b>`);
  lines.push(``);
  lines.push(`<b>👤 1. Общая информация</b>`);
  lines.push(row("ФИО", p.fio));
  lines.push(row("Город", p.city));
  lines.push(row("Возраст", p.age));
  lines.push(row("Контакт", p.contact));
  lines.push(row("Email", p.email));
  lines.push(row("Созвон", p.call_time));
  lines.push(``);
  lines.push(`<b>🎓 2. Опыт</b>`);
  lines.push(row("Образование", p.education));
  lines.push(row("Последняя должность", p.last_job));
  lines.push(row("Общий стаж", p.total_exp));
  lines.push(row("В продажах", p.sales_exp));
  lines.push(row("IT-опыт", p.it_exp));
  lines.push(row("CRM", p.crm));
  lines.push(row("B2B", p.b2b_exp));
  lines.push(``);
  lines.push(`<b>📞 3. Холодные продажи</b>`);
  lines.push(row("Холодные звонки", p.cold_calls));
  lines.push(row("Звонков/день", p.calls_per_day));
  lines.push(row("Продукты", p.products));
  lines.push(row("План", p.plan));
  lines.push(row("Чек / цикл", p.deal_size));
  lines.push(row("Отказы", p.rejections));
  lines.push(row("Возражение «дорого»", p.price_objection));
  lines.push(``);
  lines.push(`<b>💬 4. Коммуникация</b>`);
  lines.push(row("Коммуникабельность", p.comm_score ? `${p.comm_score}/10` : ""));
  lines.push(row("Телефон комфорт", p.phone_comfort));
  lines.push(row("Готов к 20–50 зв.", p.calls_ready));
  lines.push(row("Мотивация", p.motivation));
  lines.push(row("Кейс успеха", p.success_case));
  lines.push(row("Сложный клиент", p.difficult_client));
  lines.push(``);
  lines.push(`<b>✅ 5. Условия</b>`);
  lines.push(row("Удалёнка", p.remote_ready));
  lines.push(row("Ноутбук/CRM", p.device));
  lines.push(row("Интернет", p.internet));
  lines.push(row("Телефон", p.phone));
  lines.push(row("Оклад 850 BYN + %", p.salary_ok));
  lines.push(row("Обучение", p.learning));
  lines.push(row("Ожидания по ЗП", p.salary_expect));
  lines.push(row("Старт", p.start_date));
  lines.push(``);
  lines.push(`<b>➕ 6. Дополнительно</b>`);
  lines.push(row("Почему IT", p.why_it));
  lines.push(row("Что знает о ASIMO", p.about_company));
  lines.push(row("Вопросы", p.questions));

  let text = lines.join("").replace(/\n{3,}/g, "\n\n");
  if (text.length > 3900) {
    text = text.slice(0, 3900) + "\n\n… <i>(обрезано, полный текст в админке)</i>";
  }
  return text;
}

function normalizeChatId(target: string): string | number {
  const t = target.trim();
  if (/^-?\d+$/.test(t)) return Number(t);
  return t;
}

async function sendMessageOnce(
  botToken: string,
  target: string,
  text: string,
  parseMode?: "HTML"
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const chatId = normalizeChatId(target);
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  };
  if (parseMode) body.parse_mode = parseMode;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string; result?: { message_id?: number } };
  if (!res.ok || !data?.ok) {
    return {
      ok: false,
      error: data?.description ?? `Telegram HTTP ${res.status}`,
    };
  }
  return { ok: true, messageId: String(data?.result?.message_id ?? "") };
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export async function sendToTelegram(
  botToken: string,
  chatId: string,
  html: string
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const targets = chatId
    .split(/[,\s;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!botToken) return { ok: false, error: "Не задан TELEGRAM_BOT_TOKEN" };
  if (targets.length === 0) return { ok: false, error: "Не задан TELEGRAM_CHAT_ID" };

  let lastId: string | undefined;
  let lastError: string | undefined;

  for (const target of targets) {
    let attempt = await sendMessageOnce(botToken, target, html, "HTML");
    if (!attempt.ok && attempt.error && /parse entities|can't find end tag/i.test(attempt.error)) {
      attempt = await sendMessageOnce(botToken, target, htmlToPlainText(html));
    }
    if (!attempt.ok) {
      return { ok: false, error: attempt.error ?? lastError };
    }
    lastId = attempt.messageId;
  }
  return { ok: true, messageId: lastId };
}