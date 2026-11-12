"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Candidate = {
  id: string;
  createdAt: string;
  fio: string;
  city?: string | null;
  age?: number | null;
  contact: string;
  email?: string | null;
  callTime?: string | null;
  education?: string | null;
  lastJob?: string | null;
  totalExp?: string | null;
  salesExp?: string | null;
  itExp?: string | null;
  crm?: string | null;
  b2bExp?: string | null;
  coldCalls?: string | null;
  callsPerDay?: string | null;
  products?: string | null;
  plan?: string | null;
  dealSize?: string | null;
  rejections?: string | null;
  priceObjection?: string | null;
  commScore?: number | null;
  phoneComfort?: string | null;
  callsReady?: string | null;
  motivation?: string | null;
  successCase?: string | null;
  difficultClient?: string | null;
  remoteReady?: string | null;
  device?: string | null;
  internet?: string | null;
  phone?: string | null;
  salaryOk?: string | null;
  learning?: string | null;
  salaryExpect?: string | null;
  startDate?: string | null;
  whyIt?: string | null;
  aboutCompany?: string | null;
  questions?: string | null;
  score: number;
  scoreLabel?: string | null;
  status: string;
  notes?: string | null;
  telegramSent: boolean;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "Новый", cls: "bg-blue-100 text-blue-700" },
  contacted: { label: "Связались", cls: "bg-amber-100 text-amber-700" },
  interview: { label: "Собеседование", cls: "bg-violet-100 text-violet-700" },
  hired: { label: "Нанят", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Отклонён", cls: "bg-slate-200 text-slate-600" },
};

function scoreColor(s: number): string {
  if (s >= 75) return "bg-rose-500";
  if (s >= 55) return "bg-emerald-500";
  if (s >= 35) return "bg-amber-500";
  return "bg-slate-400";
}

export default function AdminPage() {
  const [pwd, setPwd] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("asimo_admin_pwd") ?? "" : ""));
  const [pwdInput, setPwdInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [needPwd, setNeedPwd] = useState(true);
  const [items, setItems] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [msg, setMsg] = useState("");

  // telegram settings
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [tgInfo, setTgInfo] = useState<any>(null);
  const [tgSaving, setTgSaving] = useState(false);

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (pwd) h["x-admin-password"] = pwd;
    return h;
  }, [pwd]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { headers });
      const data = await res.json();
      if (res.ok) {
        setTgInfo(data);
        if (data.chatId) setChatId(data.chatId);
        setNeedPwd(false);
        setAuthed(true);
      } else if (res.status === 401) {
        setNeedPwd(true);
        setAuthed(false);
      }
    } catch {
      // ignore
    }
  }, [headers]);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/applications?${params.toString()}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Ошибка загрузки");
      setItems(data.items ?? []);
      setNeedPwd(false);
      setAuthed(true);
    } catch (e: any) {
      if (String(e?.message ?? "").includes("пароль")) {
        setNeedPwd(true);
        setAuthed(false);
      } else {
        setMsg(e?.message ?? "Ошибка");
      }
    } finally {
      setLoading(false);
    }
  }, [headers, q, statusFilter]);

  useEffect(() => {
    loadSettings().then(() => load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected) setNotesDraft(selected.notes ?? "");
  }, [selected]);

  function login() {
    localStorage.setItem("asimo_admin_pwd", pwdInput);
    setPwd(pwdInput);
    setTimeout(() => {
      loadSettings().then(() => load());
    }, 100);
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });
    setItems((arr) => arr.map((c) => (c.id === id ? { ...c, status } : c)));
    if (selected?.id === id) setSelected({ ...selected, status });
  }

  async function saveNotes() {
    if (!selected) return;
    await fetch(`/api/applications/${selected.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ notes: notesDraft }),
    });
    setItems((arr) => arr.map((c) => (c.id === selected.id ? { ...c, notes: notesDraft } : c)));
    setSelected({ ...selected, notes: notesDraft });
    setMsg("Заметка сохранена ✓");
    setTimeout(() => setMsg(""), 2000);
  }

  async function remove(id: string) {
    if (!confirm("Удалить анкету?")) return;
    await fetch(`/api/applications/${id}`, { method: "DELETE", headers });
    setItems((arr) => arr.filter((c) => c.id !== id));
    setSelected(null);
  }

  async function resend(id: string) {
    setMsg("Отправляем в Telegram…");
    const res = await fetch(`/api/applications/${id}`, { method: "POST", headers });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "✓ Отправлено в Telegram" : `Ошибка: ${data?.error ?? "?"}`);
    if (res.ok) load();
    setTimeout(() => setMsg(""), 3000);
  }

  async function saveTelegram() {
    setTgSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers,
        body: JSON.stringify({ botToken, chatId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Ошибка");
      setMsg("✓ Настройки Telegram сохранены");
      setBotToken("");
      loadSettings();
    } catch (e: any) {
      setMsg(e?.message ?? "Ошибка");
    } finally {
      setTgSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  }

  async function testTelegram() {
    setTgSaving(true);
    setMsg("Проверяем…");
    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers,
        body: JSON.stringify(botToken || chatId ? { botToken, chatId } : {}),
      });
      const data = await res.json();
      setMsg(res.ok ? "✓ Тестовое сообщение отправлено в Telegram!" : `Ошибка: ${data?.error ?? "?"}`);
    } catch (e: any) {
      setMsg(e?.message ?? "Ошибка");
    } finally {
      setTgSaving(false);
      setTimeout(() => setMsg(""), 4000);
    }
  }

  function exportCsv() {
    const head = ["Дата", "ФИО", "Город", "Возраст", "Контакт", "Email", "Скоринг", "Статус", "Холодные", "Звонков/день", "Готов к объёму", "ЗП ожидания", "Старт"];
    const rows = items.map((c) => [
      new Date(c.createdAt).toLocaleString("ru-RU"),
      c.fio,
      c.city ?? "",
      c.age ?? "",
      c.contact,
      c.email ?? "",
      `${c.score}`,
      STATUS[c.status]?.label ?? c.status,
      c.coldCalls ?? "",
      c.callsPerDay ?? "",
      c.callsReady ?? "",
      c.salaryExpect ?? "",
      c.startDate ?? "",
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `asimo-candidates-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const stats = useMemo(() => {
    const total = items.length;
    const today = items.filter((c) => new Date(c.createdAt).toDateString() === new Date().toDateString()).length;
    const ready = items.filter((c) => c.callsReady === "Да").length;
    const cold = items.filter((c) => c.coldCalls === "Да").length;
    const avg = total ? Math.round(items.reduce((s, c) => s + (c.score ?? 0), 0) / total) : 0;
    return { total, today, ready, cold, avg };
  }, [items]);

  if (needPwd && !authed) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white">A</div>
          <h1 className="mt-4 text-center text-xl font-extrabold">HR-панель ASIMO.BY</h1>
          <p className="mt-1 text-center text-sm text-slate-500">Введите пароль администратора (ADMIN_PASSWORD)</p>
          <input
            type="password"
            value={pwdInput}
            onChange={(e) => setPwdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Пароль"
            className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
          <button onClick={login} className="mt-3 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700">
            Войти →
          </button>
          <a href="/" className="mt-4 block text-center text-xs text-slate-400 underline">
            ← Вернуться к анкете
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef2f7]">
      <header className="border-b bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 font-black">A</div>
            <div>
              <div className="text-sm font-extrabold">ASIMO.BY • HR-панель</div>
              <div className="text-[11px] text-slate-400">Кандидаты — Business Development Manager</div>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="/" className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold hover:bg-white/10">
              Анкета →
            </a>
            <button
              onClick={() => {
                localStorage.removeItem("asimo_admin_pwd");
                setPwd("");
                setAuthed(false);
                setNeedPwd(true);
              }}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {msg && (
          <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">{msg}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Всего анкет", stats.total, "📥"],
            ["Сегодня", stats.today, "🆕"],
            ["Готовы к звонкам", stats.ready, "📞"],
            ["С опытом холодных", stats.cold, "❄️"],
            ["Средний скоринг", stats.avg, "⭐"],
          ].map(([l, v, i]) => (
            <div key={l as string} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="text-xl">{i}</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{v as number}</div>
              <div className="text-xs text-slate-500">{l as string}</div>
            </div>
          ))}
        </div>

        {/* Telegram setup */}
        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-extrabold">📨 Telegram-бот для уведомлений</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                tgInfo?.botTokenSet && tgInfo?.chatId ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {tgInfo?.botTokenSet && tgInfo?.chatId ? `● Подключён ${tgInfo.botTokenMasked}` : "○ Не настроен"}
            </span>
          </div>
          <div className="mt-2 text-[13px] leading-relaxed text-slate-600">
            <b>Как подключить за 2 минуты:</b> 1) Напишите <b>@BotFather</b> в Telegram → <code className="rounded bg-slate-100 px-1">/newbot</code> →
            получите токен вида <code className="rounded bg-slate-100 px-1">123456:ABC…</code> 2) Напишите <b>@userinfobot</b> → получите свой{" "}
            <b>chat_id</b> (или добавьте бота в HR-группу и узнайте id группы через @getmyid_bot). 3) Вставьте ниже и нажмите «Сохранить и
            проверить».
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_220px_auto_auto]">
            <input
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder={tgInfo?.botTokenMasked ? `Токен уже сохранён (${tgInfo.botTokenMasked}) — вставьте новый для замены` : "Токен бота, например 8123456789:AAH…"}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />
            <input
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="chat_id, например 123456789"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />
            <button
              onClick={saveTelegram}
              disabled={tgSaving}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {tgSaving ? "…" : "Сохранить"}
            </button>
            <button
              onClick={testTelegram}
              disabled={tgSaving}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Проверить ✈️
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="🔍 Поиск: имя, телефон, email, город…"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
          >
            <option value="">Все статусы</option>
            {Object.entries(STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <button onClick={load} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
            {loading ? "…" : "Найти"}
          </button>
          <button onClick={exportCsv} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
            ⬇ CSV
          </button>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {items.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">📭</div>
              <div className="mt-3 font-bold text-slate-700">Пока нет анкет</div>
              <div className="mt-1 text-sm text-slate-500">
                Отправьте кандидатам ссылку на анкету — ответы будут приходить сюда и в Telegram.
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(window.location.origin + "/")}
                className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"
              >
                Скопировать ссылку на анкету
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Кандидат</th>
                    <th className="px-4 py-3">Контакт</th>
                    <th className="px-4 py-3">Скоринг</th>
                    <th className="px-4 py-3">Ключевое</th>
                    <th className="px-4 py-3">Статус</th>
                    <th className="px-4 py-3">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="cursor-pointer border-b border-slate-50 transition last:border-0 hover:bg-blue-50/50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{c.fio}</div>
                        <div className="text-xs text-slate-500">
                          {[c.city, c.age ? `${c.age} лет` : ""].filter(Boolean).join(" • ") || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{c.contact}</div>
                        <div className="text-xs text-slate-500">{c.email ?? ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black text-white ${scoreColor(c.score)}`}>
                            {c.score}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">{c.scoreLabel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div>
                          Холодные: <b>{c.coldCalls ?? "—"}</b> ({c.callsPerDay ?? "—"}/день)
                        </div>
                        <div>
                          Готов: <b>{c.callsReady ?? "—"}</b> • {c.commScore ?? "—"}/10
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={c.status}
                          onChange={(e) => setStatus(c.id, e.target.value)}
                          className={`rounded-full px-2.5 py-1 text-xs font-bold outline-none ${STATUS[c.status]?.cls ?? "bg-slate-100"}`}
                        >
                          {Object.entries(STATUS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                        {!c.telegramSent && <div className="mt-1 text-[11px] text-amber-600">⚠ не в TG</div>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {new Date(c.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-6" onClick={() => setSelected(null)}>
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">{selected.fio}</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  {selected.city ?? "—"} • {selected.contact} • {selected.email ?? "без email"}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-black text-white ${scoreColor(selected.score)}`}>
                {selected.score}/100 • {selected.scoreLabel}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS[selected.status]?.cls}`}>{STATUS[selected.status]?.label}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {selected.telegramSent ? "📨 в Telegram ✓" : "⚠ не доставлено в TG"}
              </span>
            </div>

            <div className="mt-5 grid gap-4 text-sm">
              {[
                ["👤 Общая информация", [["Город", selected.city], ["Возраст", selected.age], ["Контакт", selected.contact], ["Email", selected.email], ["Созвон", selected.callTime]]],
                ["🎓 Опыт", [["Образование", selected.education], ["Должность", selected.lastJob], ["Стаж", selected.totalExp], ["В продажах", selected.salesExp], ["IT", selected.itExp], ["CRM", selected.crm], ["B2B", selected.b2bExp]]],
                ["📞 Холодные продажи", [["Опыт", selected.coldCalls], ["Звонков/день", selected.callsPerDay], ["Продукты", selected.products], ["План", selected.plan], ["Чек", selected.dealSize], ["Отказы", selected.rejections], ["«Дорого»", selected.priceObjection]]],
                ["💬 Коммуникация", [["Коммуникабельность", selected.commScore ? `${selected.commScore}/10` : null], ["Телефон", selected.phoneComfort], ["Готов к объёму", selected.callsReady], ["Мотивация", selected.motivation], ["Кейс", selected.successCase], ["Сложный клиент", selected.difficultClient]]],
                ["✅ Условия", [["Удалёнка", selected.remoteReady], ["Техника", selected.device], ["Интернет", selected.internet], ["Телефон", selected.phone], ["Оклад 850 BYN", selected.salaryOk], ["Обучение", selected.learning], ["Ожидания ЗП", selected.salaryExpect], ["Старт", selected.startDate]]],
                ["➕ Дополнительно", [["Почему IT", selected.whyIt], ["О компании", selected.aboutCompany], ["Вопросы", selected.questions]]],
              ].map(([title, rows]) => (
                <div key={title as string} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="text-[13px] font-extrabold text-slate-800">{title as string}</div>
                  <dl className="mt-2 space-y-1.5">
                    {(rows as [string, unknown][]).map(([k, v]) =>
                      String(v ?? "").trim() ? (
                        <div key={k} className="grid grid-cols-[130px_1fr] gap-2 text-[13px]">
                          <dt className="text-slate-500">{k}</dt>
                          <dd className="whitespace-pre-wrap font-medium text-slate-800">{String(v)}</dd>
                        </div>
                      ) : null
                    )}
                  </dl>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="text-xs font-bold text-slate-600">Заметка HR (видна только здесь)</label>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Например: созвон 13.11 в 15:00, сильный кандидат…"
                className="mt-1 min-h-[70px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={saveNotes} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white">
                  Сохранить заметку
                </button>
                <button onClick={() => resend(selected.id)} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white">
                  ✈️ Отправить в TG повторно
                </button>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(selected.contact)}&text=${encodeURIComponent(`Кандидат ${selected.fio}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
                >
                  Поделиться
                </a>
                <button onClick={() => remove(selected.id)} className="ml-auto rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600">
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
