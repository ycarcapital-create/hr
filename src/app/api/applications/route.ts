import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";
import { scoreCandidate } from "@/lib/scoring";
import { buildTelegramMessage, getTelegramConfig, sendToTelegram } from "@/lib/telegram";

export const dynamic = "force-dynamic";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}

function checkAdmin(req: NextRequest): boolean {
  const required = (process.env.ADMIN_PASSWORD ?? "").trim();
  if (!required) return true;
  const got = req.headers.get("x-admin-password") ?? "";
  return got === required;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Неверный пароль администратора" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const limit = Math.min(Number(searchParams.get("limit") ?? 200) || 200, 500);

    let rows;
    if (q) {
      rows = await db
        .select()
        .from(candidates)
        .where(
          or(
            ilike(candidates.fio, `%${q}%`),
            ilike(candidates.contact, `%${q}%`),
            ilike(candidates.email, `%${q}%`),
            ilike(candidates.city, `%${q}%`)
          )
        )
        .orderBy(desc(candidates.createdAt))
        .limit(limit);
    } else {
      rows = await db
        .select()
        .from(candidates)
        .orderBy(desc(candidates.createdAt))
        .limit(limit);
    }
    const filtered = status ? rows.filter((r) => r.status === status) : rows;
    return NextResponse.json({ items: filtered });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "DB error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;

    const fio = str(body.fio);
    const contact = str(body.contact);
    if (fio.length < 2) {
      return NextResponse.json({ error: "Укажите ФИО" }, { status: 400 });
    }
    if (contact.length < 3) {
      return NextResponse.json({ error: "Укажите телефон или Telegram для связи" }, { status: 400 });
    }

    const payload = {
      fio,
      city: str(body.city),
      age: str(body.age),
      contact,
      email: str(body.email),
      call_time: str(body.call_time),
      education: str(body.education),
      last_job: str(body.last_job),
      total_exp: str(body.total_exp),
      sales_exp: str(body.sales_exp),
      it_exp: str(body.it_exp) || "Нет",
      crm: str(body.crm),
      b2b_exp: str(body.b2b_exp) || "Нет",
      cold_calls: str(body.cold_calls) || "Нет",
      calls_per_day: str(body.calls_per_day),
      products: str(body.products),
      plan: str(body.plan),
      deal_size: str(body.deal_size),
      rejections: str(body.rejections),
      price_objection: str(body.price_objection),
      comm_score: str(body.comm_score),
      phone_comfort: str(body.phone_comfort) || "Да",
      calls_ready: str(body.calls_ready) || "Нет",
      motivation: str(body.motivation),
      success_case: str(body.success_case),
      difficult_client: str(body.difficult_client),
      remote_ready: str(body.remote_ready) || "Да",
      device: str(body.device) || "Да",
      internet: str(body.internet) || "Да",
      phone: str(body.phone) || "Да",
      salary_ok: str(body.salary_ok) || "Да",
      learning: str(body.learning) || "Да",
      salary_expect: str(body.salary_expect),
      start_date: str(body.start_date),
      why_it: str(body.why_it),
      about_company: str(body.about_company),
      questions: str(body.questions),
    };

    const { score, label } = scoreCandidate(payload as any);

    const ageNum = /^\d+$/.test(payload.age) ? Number(payload.age) : null;
    const commNum = /^\d+$/.test(payload.comm_score) ? Number(payload.comm_score) : null;

    const inserted = await db
      .insert(candidates)
      .values({
        fio: payload.fio,
        city: payload.city || null,
        age: ageNum,
        contact: payload.contact,
        email: payload.email || null,
        callTime: payload.call_time || null,
        education: payload.education || null,
        lastJob: payload.last_job || null,
        totalExp: payload.total_exp || null,
        salesExp: payload.sales_exp || null,
        itExp: payload.it_exp || null,
        crm: payload.crm || null,
        b2bExp: payload.b2b_exp || null,
        coldCalls: payload.cold_calls || null,
        callsPerDay: payload.calls_per_day || null,
        products: payload.products || null,
        plan: payload.plan || null,
        dealSize: payload.deal_size || null,
        rejections: payload.rejections || null,
        priceObjection: payload.price_objection || null,
        commScore: commNum,
        phoneComfort: payload.phone_comfort || null,
        callsReady: payload.calls_ready || null,
        motivation: payload.motivation || null,
        successCase: payload.success_case || null,
        difficultClient: payload.difficult_client || null,
        remoteReady: payload.remote_ready || null,
        device: payload.device || null,
        internet: payload.internet || null,
        phone: payload.phone || null,
        salaryOk: payload.salary_ok || null,
        learning: payload.learning || null,
        salaryExpect: payload.salary_expect || null,
        startDate: payload.start_date || null,
        whyIt: payload.why_it || null,
        aboutCompany: payload.about_company || null,
        questions: payload.questions || null,
        score,
        scoreLabel: label,
        status: "new",
        telegramSent: false,
        raw: payload,
      })
      .returning();

    const row = inserted[0];

    // Отправка в Telegram
    let telegramSent = false;
    let telegramError: string | undefined;
    let telegramMessageId: string | undefined;
    try {
      const cfg = await getTelegramConfig();
      if (!cfg.botToken || !cfg.chatId) {
        telegramError = "Telegram не настроен: задайте токен бота и chat_id в админке (/admin)";
      } else {
        const html = buildTelegramMessage(payload, score, label);
        const res = await sendToTelegram(cfg.botToken, cfg.chatId, html);
        telegramSent = res.ok;
        telegramMessageId = res.messageId;
        telegramError = res.error;
      }
    } catch (e: any) {
      telegramError = e?.message ?? "Telegram send failed";
    }

    if (row) {
      try {
        await db
          .update(candidates)
          .set({
            telegramSent,
            telegramMessageId: telegramMessageId ?? null,
            updatedAt: new Date(),
          })
          .where(eq(candidates.id, row.id));
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      ok: true,
      id: row?.id,
      score,
      scoreLabel: label,
      telegramSent,
      telegramError,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
