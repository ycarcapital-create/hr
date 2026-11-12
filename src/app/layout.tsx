import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Опрос кандидата — Business Development Manager | ASIMO.BY",
  description:
    "Анкета кандидата на вакансию Business Development Manager в ASIMO.BY. Удалённая работа, продажа IT-услуг. Ответы мгновенно приходят HR в Telegram.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
