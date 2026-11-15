const stripQuotes = (value: string) => value.trim().replace(/^['"]+|['"]+$/g, "");

/** Первое непустое значение из списка переменных окружения. */
export function readEnv(...keys: string[]): string {
  for (const key of keys) {
    const raw = process.env[key];
    if (raw == null) continue;
    const cleaned = stripQuotes(raw);
    if (cleaned) return cleaned;
  }
  return "";
}