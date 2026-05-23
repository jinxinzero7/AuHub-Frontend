"use client";

import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SIDEBAR_LINKS = [
  { href: "/admin/moderation", label: "Модерация" },
  { href: "/admin/frozen", label: "Замороженные" },
  { href: "/admin/disputes", label: "Споры" },
  { href: "/admin/banned", label: "Пользователи" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) return null;

  if (!isAuthenticated || user?.role !== 1) {
    return (
      <>
        <Header />
        <main className="bg-bg min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-heading text-[28px] text-text mb-2">Доступ запрещён</h1>
            <p className="text-text2 text-[14px] font-light">Только администраторы</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-bg min-h-screen">
        <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-10 flex gap-8">
          <nav className="w-[180px] shrink-0">
            <div className="space-y-1 sticky top-[74px]">
              {SIDEBAR_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-2 rounded-[7px] text-[13px] font-medium transition-colors font-ui ${
                    pathname === link.href
                      ? "bg-gold text-[#FFF8E8]"
                      : "text-text2 hover:bg-bg2 hover:text-text"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </main>
    </>
  );
}
