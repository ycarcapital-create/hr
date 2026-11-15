# ASIMO.BY — HR анкета (BDM)

Next.js-приложение: анкета кандидата, скоринг, HR-панель и уведомления в Telegram.

## Локальный запуск

```bash
npm ci
cp .env.example .env.local
# поднимите PostgreSQL и задайте DATABASE_URL
npm run db:migrate
npm run dev
```

- Анкета: http://localhost:3000
- HR-панель: http://localhost:3000/admin

## Деплой на Vercel

1. Импортируйте репозиторий в Vercel (команда `asimo`, проект `hr`).
2. **Production branch:** задеплойте ветку `main` (на `master` старая сборка без фиксов БД) или смержите PR `main → master`.
3. Подключите **Vercel Postgres** — переменные `POSTGRES_URL` / `DATABASE_URL` подставятся автоматически.
4. В **Environment Variables** задайте при необходимости:
   - `ADMIN_PASSWORD` — пароль HR-панели
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — или настройте бота в `/admin`
5. После деплоя откройте `/api/health` — должно быть `{"ok":true}` (миграции применяются автоматически).

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | dev-сервер |
| `npm run build` | production-сборка |
| `npm run db:migrate` | применить SQL-миграции Drizzle |
| `npm run db:generate` | сгенерировать миграцию из `src/db/schema.ts` |