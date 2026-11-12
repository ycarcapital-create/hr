import CandidateForm from "@/components/CandidateForm";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f2f5f9]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-lg font-black">
              A
            </div>
            <div>
              <div className="text-[15px] font-extrabold tracking-tight">ASIMO.BY</div>
              <div className="text-[11px] text-slate-400">IT-компания • Разработка и продвижение</div>
            </div>
          </div>
          <a
            href="/admin"
            className="rounded-lg border border-white/15 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
          >
            HR-вход →
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 pb-10 pt-10 text-white sm:pt-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(600px 300px at 20% 0%, rgba(37,99,235,.45), transparent), radial-gradient(500px 280px at 90% 20%, rgba(34,211,238,.3), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-cyan-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Набираем в команду • Удалённая работа
          </div>
          <h1 className="mt-4 max-w-2xl text-[clamp(1.8rem,5vw,3rem)] font-black leading-[1.05] tracking-tight">
            Опрос кандидата —<br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Business Development Manager
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-300">
            Продажа IT-услуг, холодные звонки, B2B-коммуникация. Заполните анкету за 5–7 минут — ответы сразу прилетят HR в
            Telegram, и мы свяжемся с вами.
          </p>
          <div className="mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["💰", "850 BYN + бонусы", "оклад + % от сделок"],
              ["🏠", "Удалённо", "вся работа онлайн"],
              ["📞", "20–50 звонков", "в день, тёплая база + холод"],
              ["🚀", "Рост до BDM", "обучение за наш счёт"],
            ].map(([icon, t, d]) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                <div className="text-xl">{icon}</div>
                <div className="mt-1 text-[13px] font-bold">{t}</div>
                <div className="text-[11px] text-slate-400">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form card */}
      <section className="mx-auto -mt-2 max-w-5xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_24px_60px_rgba(16,24,40,0.12)] sm:p-8">
          <CandidateForm />
        </div>
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs text-slate-400 sm:flex-row">
          <span>© 2026 ASIMO.BY • Минск • asimo.by</span>
          <span className="flex gap-4">
            <a href="/admin" className="underline hover:text-slate-600">
              Панель HR
            </a>
            <a href="https://asimo.by" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">
              О компании
            </a>
          </span>
        </div>
      </section>
    </main>
  );
}
