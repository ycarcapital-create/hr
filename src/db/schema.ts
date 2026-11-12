import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const candidates = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  // 1. Общая информация
  fio: text("fio").notNull(),
  city: text("city"),
  age: integer("age"),
  contact: text("contact").notNull(),
  email: text("email"),
  callTime: text("call_time"),

  // 2. Опыт и образование
  education: text("education"),
  lastJob: text("last_job"),
  totalExp: text("total_exp"),
  salesExp: text("sales_exp"),
  itExp: text("it_exp"),
  crm: text("crm"),
  b2bExp: text("b2b_exp"),

  // 3. Холодные продажи
  coldCalls: text("cold_calls"),
  callsPerDay: text("calls_per_day"),
  products: text("products"),
  plan: text("plan"),
  dealSize: text("deal_size"),
  rejections: text("rejections"),
  priceObjection: text("price_objection"),

  // 4. Коммуникация и мотивация
  commScore: integer("comm_score"),
  phoneComfort: text("phone_comfort"),
  callsReady: text("calls_ready"),
  motivation: text("motivation"),
  successCase: text("success_case"),
  difficultClient: text("difficult_client"),

  // 5. Условия и готовность
  remoteReady: text("remote_ready"),
  device: text("device"),
  internet: text("internet"),
  phone: text("phone"),
  salaryOk: text("salary_ok"),
  learning: text("learning"),
  salaryExpect: text("salary_expect"),
  startDate: text("start_date"),

  // 6. Дополнительно
  whyIt: text("why_it"),
  aboutCompany: text("about_company"),
  questions: text("questions"),

  // служебные
  score: integer("score").default(0).notNull(),
  scoreLabel: text("score_label").default("—"),
  status: text("status").default("new").notNull(),
  notes: text("notes"),
  telegramSent: boolean("telegram_sent").default(false).notNull(),
  telegramMessageId: text("telegram_message_id"),
  raw: jsonb("raw"),
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
