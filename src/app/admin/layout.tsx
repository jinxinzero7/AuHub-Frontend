"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import { EmptyState, LoadingState } from "@/components/UiState";
import { useAuth } from "@/contexts/AuthContext";

const SIDEBAR_LINKS = [
  { href: "/admin/moderation", label: "Модерация" },
  { href: "/admin/frozen", label: "Замороженные" },
  { href: "/admin/disputes", label: "Споры" },
  { href: "/admin/documents", label: "Документы" },
  { href: "/admin/banned", label: "Пользователи" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <>
        <Header />
        <main id="main-content" className="min-h-screen bg-bg px-4 py-10">
          <div className="mx-auto max-w-[960px]">
            <LoadingState />
          </div>
        </main>
      </>
    );
  }

  if (!isAuthenticated || user?.role !== 1) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex min-h-screen items-center justify-center bg-bg px-4">
          <div className="max-w-[460px]">
            <EmptyState
              title="Доступ закрыт"
              description="Админ-панель доступна только сотрудникам платформы."
              actionHref="/login"
              actionLabel="Войти"
            />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-bg">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
          <nav className="w-full shrink-0 lg:w-[190px]" aria-label="Админ-разделы">
            <div className="flex gap-2 overflow-x-auto rounded-[8px] border border-border bg-surface p-2 lg:sticky lg:top-[78px] lg:block lg:space-y-1">
              {SIDEBAR_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block whitespace-nowrap rounded-[7px] px-4 py-2 text-[13px] font-medium transition-colors ${
                    pathname === link.href
                      ? "bg-gold text-white"
                      : "text-text2 hover:bg-bg2 hover:text-text"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
    </>
  );
}
