export type CandidatePayload = {
  fio: string;
  city?: string;
  age?: string;
  contact: string;
  email?: string;
  call_time?: string;
  education?: string;
  last_job?: string;
  total_exp?: string;
  sales_exp?: string;
  it_exp?: string;
  crm?: string;
  b2b_exp?: string;
  cold_calls?: string;
  calls_per_day?: string;
  products?: string;
  plan?: string;
  deal_size?: string;
  rejections?: string;
  price_objection?: string;
  comm_score?: string;
  phone_comfort?: string;
  calls_ready?: string;
  motivation?: string;
  success_case?: string;
  difficult_client?: string;
  remote_ready?: string;
  device?: string;
  internet?: string;
  phone?: string;
  salary_ok?: string;
  learning?: string;
  salary_expect?: string;
  start_date?: string;
  why_it?: string;
  about_company?: string;
  questions?: string;
};

function num(v: unknown): number {
  const n = Number(String(v ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
}

export function scoreCandidate(p: CandidatePayload): {
  score: number;
  label: string;
  reasons: string[];
} {
  let s = 0;
  const reasons: string[] = [];

  // Холодные звонки — ключевой фактор
  if (p.cold_calls === "Да") {
    s += 20;
    reasons.push("Есть опыт холодных звонков (+20)");
  }
  const cpd = num(p.calls_per_day);
  if (cpd >= 40) {
    s += 12;
    reasons.push("40+ звонков/день (+12)");
  } else if (cpd >= 20) {
    s += 8;
    reasons.push("20+ звонков/день (+8)");
  } else if (cpd > 0) {
    s += 3;
  }

  // Готовность к объёму
  if (p.calls_ready === "Да") {
    s += 12;
    reasons.push("Готов к 20–50 звонкам (+12)");
  } else {
    s -= 10;
  }

  // Продажи
  const sales = num(p.sales_exp);
  if (sales >= 3) {
    s += 10;
    reasons.push("Опыт в продажах 3+ года (+10)");
  } else if (sales >= 1) {
    s += 6;
    reasons.push("Опыт в продажах 1+ год (+6)");
  }

  if (p.it_exp === "Есть") {
    s += 8;
    reasons.push("Опыт в IT (+8)");
  }
  if (p.b2b_exp === "Есть") {
    s += 7;
    reasons.push("Опыт B2B (+7)");
  }

  // Коммуникация
  const comm = num(p.comm_score);
  if (comm >= 9) {
    s += 8;
    reasons.push("Коммуникабельность 9–10 (+8)");
  } else if (comm >= 7) {
    s += 5;
    reasons.push("Коммуникабельность 7–8 (+5)");
  } else if (comm > 0 && comm <= 4) {
    s -= 5;
  }

  if (p.phone_comfort === "Да") s += 6;
  else if (p.phone_comfort === "Скорее да") s += 3;
  else if (p.phone_comfort === "Скорее нет") s -= 4;
  else if (p.phone_comfort === "Нет") s -= 10;

  // Техготовность
  if (p.remote_ready === "Да") s += 3;
  if (p.device === "Да") s += 2;
  if (p.internet === "Да") s += 2;
  if (p.phone === "Да") s += 2;
  if (p.salary_ok === "Да") s += 4;
  else s -= 3;
  if (p.learning === "Да") s += 3;

  if ((p.motivation ?? "").trim().length > 30) s += 3;
  if ((p.success_case ?? "").trim().length > 30) s += 3;

  s = Math.max(0, Math.min(100, Math.round(s)));

  let label = "Слабый";
  if (s >= 75) label = "Топ 🔥";
  else if (s >= 55) label = "Сильный ✅";
  else if (s >= 35) label = "Средний ➖";
  else label = "Слабый ⚠️";

  return { score: s, label, reasons };
}

export const STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  contacted: "Связались",
  interview: "Собеседование",
  hired: "Нанят",
  rejected: "Отклонён",
};
