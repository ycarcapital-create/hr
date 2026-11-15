import { NextResponse } from "next/server";
import { getDb, type AppDb } from "@/db";

export function databaseUnavailableResponse() {
  return NextResponse.json(
    {
      error:
        "База данных не настроена. Подключите Vercel Postgres или задайте DATABASE_URL / POSTGRES_URL.",
    },
    { status: 503 }
  );
}

export function getDbForApi(): AppDb | NextResponse {
  const database = getDb();
  if (!database) {
    return databaseUnavailableResponse();
  }
  return database;
}