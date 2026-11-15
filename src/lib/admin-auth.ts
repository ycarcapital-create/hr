import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export function isProductionDeploy(): boolean {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export function getAdminPassword(): string {
  return (process.env.ADMIN_PASSWORD ?? "").trim();
}

export function isAdminPasswordConfigured(): boolean {
  return getAdminPassword().length > 0;
}

function passwordsMatch(expected: string, provided: string): boolean {
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

export type AdminCheckResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

export function checkAdminRequest(req: NextRequest): AdminCheckResult {
  const required = getAdminPassword();

  if (!required) {
    if (isProductionDeploy()) {
      return {
        ok: false,
        status: 503,
        error:
          "Админка недоступна: задайте переменную ADMIN_PASSWORD в Vercel (Production) и выполните Redeploy.",
      };
    }
    return { ok: true };
  }

  const got =
    req.headers.get("x-admin-password") ??
    new URL(req.url).searchParams.get("pwd") ??
    "";

  if (!passwordsMatch(required, got)) {
    return { ok: false, status: 401, error: "Неверный пароль администратора" };
  }

  return { ok: true };
}

export function adminGuardResponse(result: Extract<AdminCheckResult, { ok: false }>) {
  return NextResponse.json({ error: result.error }, { status: result.status });
}