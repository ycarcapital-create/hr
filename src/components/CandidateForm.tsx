"use client";

import { useMemo, useState } from "react";

type Form = Record<string, string>;

const initialForm: Form = {
  fio: "",
  city: "",
  age: "",
  contact: "",
  email: "",
  call_time: "",
  education: "",
  last_job: "",
  total_exp: "",
  sales_exp: "",
  it_exp: "Нет",
  crm: "",
  b2b_exp: "Нет",
  cold_calls: "Нет",
  calls_per_day: "",
  products: "",
  plan: "",
  deal_size: "",
  rejections: "",
  price_objection: "",
  comm_score: "8",
  phone_comfort: "Да",
  calls_ready: "Да",
  motivation: "",
  success_case: "",
  difficult_client: "",
  remote_ready: "Да",
  device: "Да",
  internet: "Да",
  phone: "Да",
  salary_ok: "Да",
  learning: "Да",
  salary_expect: "",
  start_date: "",
  why_it: "",
  about_company: "",
  questions: "",
};

const STEPS = [
  { id: 0, title: "Общая информация", icon: "👤", desc: "Как с вами связаться" },
  { id: 1, title: "Опыт", icon: "🎓", desc: "Образование и бэкграунд" },
  { id: 2, title: "Холодные продажи", icon: "📞", desc: "Ключевой блок вакансии" },
  { id: 3, title: "Коммуникация", icon: "💬", desc: "Мотивация и кейсы" },
  { id: 4, title: "Условия", icon: "✅", desc: "Готовность и техника" },
  { id: 5, title: "Финал", icon: "🚀", desc: "Пара слов о себе" },
];

function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-1 text-[13px] font-semibold text-slate-800">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";
const selectCls =
  "w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[14px] text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

export default function CandidateForm() {
  const [form, setForm] = useState<Form>(initialForm);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<null | {
    score: number;
    scoreLabel: string;
    telegramSent: boolean;
    telegramError?: string;
  }>(null);
  const [submitError, setSubmitError] = useState("");

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => {
      if (!e[k]) return e;
      const n = { ...e };
      delete n[k];
      return n;
    });
  };

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  function validateStep(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (form.fio.trim().length < 2) e.fio = "Укажите ФИО";
      if (form.contact.trim().length < 3) e.contact = "Укажите телефон или Telegram";
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Похоже, в email опечатка";
      if (form.age && (Number(form.age) < 14 || Number(form.age) > 90)) e.age = "Проверьте возраст";
    }
    if (s === 3) {
      const n = Number(form.comm_score);
      if (form.comm_score && (n < 1 || n > 10)) e.comm_score = "От 1 до 10";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validateStep(step)) {
      document.getElementById("form-top")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    if (!validateStep(0) || !validateStep(step)) {
      // проверяем обязательные
      if (form.fio.trim().length < 2 || form.contact.trim().length < 3) {
        setStep(0);
        validateStep(0);
        return;
      }
    }
    setSending(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Ошибка отправки");
      setResult({
        score: data.score ?? 0,
        scoreLabel: data.scoreLabel ?? "",
        telegramSent: Boolean(data.telegramSent),
        telegramError: data.telegramError,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setSubmitError(e?.message ?? "Не удалось отправить. Попробуйте ещё раз.");
    } finally {
      setSending(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-xl sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-4xl text-white shadow-lg shadow-emerald-500/30">
          ✓
        </div>
        <h2 className="mt-6 text-2xl font-extrabold text-slate-900">Спасибо, {form.fio.split(" ")[0] || "кандидат"}!</h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-slate-600">
          Ваша анкета отправлена в <b>ASIMO.BY</b>. HR-менеджер свяжется с вами в ближайшее время по указанному контакту.
        </p>
        <div className="mx-auto mt-6 grid max-w-md gap-3">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-500">Ваш контакт</span>
            <b className="text-slate-900">{form.contact}</b>
          </div>
          <div
            className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm ${
              result.telegramSent ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
            }`}
          >
            <span className="text-lg">{result.telegramSent ? "📨" : "⏳"}</span>
            <span>
              {result.telegramSent
                ? "Анкета мгновенно доставлена HR в Telegram."
                : `Анкета сохранена. Telegram-уведомление: ${result.telegramError ?? "настраивается"}. Мы всё равно её получим.`}
            </span>
          </div>
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="https://asimo.by"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Перейти на ASIMO.BY →
          </a>
          <button
            onClick={() => {
              setForm(initialForm);
              setResult(null);
              setStep(0);
            }}
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Заполнить ещё одну анкету
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="form-top">
      {/* Прогресс */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">
            Шаг {step + 1} из {STEPS.length}
          </span>
          <span className="text-blue-600">{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 hidden grid-cols-6 gap-2 md:grid">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => {
                if (i <= step) setStep(i);
              }}
              className={`rounded-xl border px-2 py-2.5 text-left transition ${
                i === step
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : i < step
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-slate-100 bg-slate-50/50 opacity-70"
              }`}
            >
              <div className="text-base leading-none">{i < step ? "✅" : s.icon}</div>
              <div className={`mt-1.5 text-[11px] font-bold leading-tight ${i === step ? "text-blue-700" : "text-slate-700"}`}>
                {s.title}
              </div>
            </button>
          ))}
        </div>
        {/* мобильные шаги */}
        <div className="mt-3 flex items-center gap-2 md:hidden">
          <span className="text-2xl">{STEPS[step].icon}</span>
          <div>
            <div className="text-sm font-bold text-slate-900">{STEPS[step].title}</div>
            <div className="text-xs text-slate-500">{STEPS[step].desc}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {step === 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ФИО" required>
                <input
                  className={inputCls}
                  placeholder="Иванов Иван Иванович"
                  value={form.fio}
                  onChange={(e) => set("fio", e.target.value)}
                />
                {errors.fio && <span className="mt-1 block text-xs font-semibold text-rose-500">{errors.fio}</span>}
              </Field>
              <Field label="Телефон / Telegram" required hint="Как с вами быстрее связаться?">
                <input
                  className={inputCls}
                  placeholder="+375 29 123-45-67 / @username"
                  value={form.contact}
                  onChange={(e) => set("contact", e.target.value)}
                />
                {errors.contact && <span className="mt-1 block text-xs font-semibold text-rose-500">{errors.contact}</span>}
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Город проживания">
                <input className={inputCls} placeholder="Минск" value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label="Возраст">
                <input
                  className={inputCls}
                  type="number"
                  min={14}
                  max={90}
                  placeholder="25"
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                />
                {errors.age && <span className="mt-1 block text-xs font-semibold text-rose-500">{errors.age}</span>}
              </Field>
              <Field label="Email">
                <input
                  className={inputCls}
                  type="email"
                  placeholder="you@mail.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
                {errors.email && <span className="mt-1 block text-xs font-semibold text-rose-500">{errors.email}</span>}
              </Field>
            </div>
            <Field label="Удобное время для созвона" hint="Например: будни 10:00–18:00">
              <input
                className={inputCls}
                placeholder="Будни после 15:00"
                value={form.call_time}
                onChange={(e) => set("call_time", e.target.value)}
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Образование">
                <input
                  className={inputCls}
                  placeholder="ВУЗ, специальность"
                  value={form.education}
                  onChange={(e) => set("education", e.target.value)}
                />
              </Field>
              <Field label="Текущая / последняя должность">
                <input
                  className={inputCls}
                  placeholder="Менеджер по продажам"
                  value={form.last_job}
                  onChange={(e) => set("last_job", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Общий стаж работы (лет)">
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  placeholder="3"
                  value={form.total_exp}
                  onChange={(e) => set("total_exp", e.target.value)}
                />
              </Field>
              <Field label="Опыт в продажах (лет)">
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  placeholder="2"
                  value={form.sales_exp}
                  onChange={(e) => set("sales_exp", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Опыт в IT / продажах IT-услуг">
                <select className={selectCls} value={form.it_exp} onChange={(e) => set("it_exp", e.target.value)}>
                  <option>Нет</option>
                  <option>Есть</option>
                </select>
              </Field>
              <Field label="Опыт с партнёрами / B2B">
                <select className={selectCls} value={form.b2b_exp} onChange={(e) => set("b2b_exp", e.target.value)}>
                  <option>Нет</option>
                  <option>Есть</option>
                </select>
              </Field>
              <Field label="CRM (какими пользовались)">
                <input
                  className={inputCls}
                  placeholder="Bitrix24, AmoCRM…"
                  value={form.crm}
                  onChange={(e) => set("crm", e.target.value)}
                />
              </Field>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
              ⚡ Это ключевой блок для вакансии BDM — предстоит делать <b>20–50 холодных звонков в день</b>. Отвечайте честно.
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Есть ли опыт холодных звонков">
                <select className={selectCls} value={form.cold_calls} onChange={(e) => set("cold_calls", e.target.value)}>
                  <option>Нет</option>
                  <option>Да</option>
                </select>
              </Field>
              <Field label="Сколько звонков в день делали в среднем">
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  placeholder="30"
                  value={form.calls_per_day}
                  onChange={(e) => set("calls_per_day", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Какие продукты / услуги продавали">
              <textarea
                className={`${inputCls} min-h-[80px]`}
                placeholder="Опишите продукты, ниши, средний чек…"
                value={form.products}
                onChange={(e) => set("products", e.target.value)}
              />
            </Field>
            <Field label="Какой был личный план и выполняли ли его">
              <textarea
                className={`${inputCls} min-h-[80px]`}
                placeholder="План в цифрах и % выполнения"
                value={form.plan}
                onChange={(e) => set("plan", e.target.value)}
              />
            </Field>
            <Field label="Средний чек / цикл сделки">
              <input
                className={inputCls}
                placeholder="Например: $2000, цикл 2–3 недели"
                value={form.deal_size}
                onChange={(e) => set("deal_size", e.target.value)}
              />
            </Field>
            <Field label="Как справляетесь с отказами клиентов">
              <textarea
                className={`${inputCls} min-h-[80px]`}
                value={form.rejections}
                onChange={(e) => set("rejections", e.target.value)}
              />
            </Field>
            <Field label="Что делаете, если клиент говорит «дорого» или «нам не нужно»">
              <textarea
                className={`${inputCls} min-h-[80px]`}
                placeholder="Ваш скрипт работы с возражениями"
                value={form.price_objection}
                onChange={(e) => set("price_objection", e.target.value)}
              />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Коммуникабельность (1–10)">
                <input
                  className={inputCls}
                  type="number"
                  min={1}
                  max={10}
                  value={form.comm_score}
                  onChange={(e) => set("comm_score", e.target.value)}
                />
                {errors.comm_score && <span className="mt-1 block text-xs font-semibold text-rose-500">{errors.comm_score}</span>}
              </Field>
              <Field label="Комфортно много говорить по телефону">
                <select className={selectCls} value={form.phone_comfort} onChange={(e) => set("phone_comfort", e.target.value)}>
                  <option>Да</option>
                  <option>Скорее да</option>
                  <option>Скорее нет</option>
                  <option>Нет</option>
                </select>
              </Field>
              <Field label="Готовы делать 20–50 звонков в день">
                <select className={selectCls} value={form.calls_ready} onChange={(e) => set("calls_ready", e.target.value)}>
                  <option>Да</option>
                  <option>Нет</option>
                </select>
              </Field>
            </div>
            <Field label="Что мотивирует вас в продажах">
              <textarea
                className={`${inputCls} min-h-[80px]`}
                placeholder="Деньги, азарт, развитие…"
                value={form.motivation}
                onChange={(e) => set("motivation", e.target.value)}
              />
            </Field>
            <Field label="Пример успешной сделки / достижения">
              <textarea
                className={`${inputCls} min-h-[80px]`}
                value={form.success_case}
                onChange={(e) => set("success_case", e.target.value)}
              />
            </Field>
            <Field label="Пример сложного клиента и как вы с ним работали">
              <textarea
                className={`${inputCls} min-h-[80px]`}
                value={form.difficult_client}
                onChange={(e) => set("difficult_client", e.target.value)}
              />
            </Field>
          </>
        )}

        {step === 4 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["remote_ready", "Готовы работать удалённо"],
                ["device", "Есть ноутбук / ПК / планшет для CRM"],
                ["internet", "Есть стабильный интернет"],
                ["phone", "Есть телефон для рабочих звонков"],
              ].map(([k, l]) => (
                <Field key={k} label={l}>
                  <select className={selectCls} value={form[k]} onChange={(e) => set(k, e.target.value)}>
                    <option>Да</option>
                    <option>Нет</option>
                  </select>
                </Field>
              ))}
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <Field label="Готовы к окладу 850 BYN + бонусы за клиентов и % от сделок">
                <select className={selectCls} value={form.salary_ok} onChange={(e) => set("salary_ok", e.target.value)}>
                  <option>Да</option>
                  <option>Нет</option>
                </select>
              </Field>
              <div className="mt-4">
                <Field label="Готовы к обучению в направлении Business Development">
                  <select className={selectCls} value={form.learning} onChange={(e) => set("learning", e.target.value)}>
                    <option>Да</option>
                    <option>Нет</option>
                  </select>
                </Field>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="На какую зарплату рассчитываете">
                <input
                  className={inputCls}
                  placeholder="Например: 2000 BYN + %"
                  value={form.salary_expect}
                  onChange={(e) => set("salary_expect", e.target.value)}
                />
              </Field>
              <Field label="Когда готовы приступить">
                <input
                  className={inputCls}
                  placeholder="Сразу / с 1 декабря…"
                  value={form.start_date}
                  onChange={(e) => set("start_date", e.target.value)}
                />
              </Field>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <Field label="Почему хотите работать именно в IT-сфере">
              <textarea
                className={`${inputCls} min-h-[90px]`}
                value={form.why_it}
                onChange={(e) => set("why_it", e.target.value)}
              />
            </Field>
            <Field label="Что знаете о компании ASIMO.BY">
              <textarea
                className={`${inputCls} min-h-[80px]`}
                placeholder="Что видели на сайте, в соцсетях…"
                value={form.about_company}
                onChange={(e) => set("about_company", e.target.value)}
              />
            </Field>
            <Field label="Есть ли вопросы к нам">
              <textarea
                className={`${inputCls} min-h-[80px]`}
                value={form.questions}
                onChange={(e) => set("questions", e.target.value)}
              />
            </Field>
            <div className="rounded-2xl bg-slate-900 p-4 text-[13px] leading-relaxed text-slate-200">
              Нажимая «Отправить анкету», вы соглашаетесь на обработку персональных данных для рассмотрения кандидатуры в
              ASIMO.BY. Данные попадут только HR-отделу — в Telegram и внутреннюю базу.
            </div>
          </>
        )}
      </div>

      {submitError && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {submitError}
        </div>
      )}

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          onClick={back}
          disabled={step === 0 || sending}
          className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition enabled:hover:bg-slate-50 disabled:opacity-40"
        >
          ← Назад
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
          >
            Далее →
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={sending}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:opacity-90 disabled:opacity-60"
          >
            {sending ? "Отправляем в Telegram… ⏳" : "📨 Отправить анкету"}
          </button>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">
        Ответы мгновенно приходят HR-менеджеру в Telegram • ASIMO.BY
      </p>
    </div>
  );
}
