"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Plus, Search, Sun, User } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const isAdmin = user?.role === 1;

  const handleSearch = () => {
    const q = searchQuery.trim();
    router.push(q ? `/?search=${encodeURIComponent(q)}` : "/");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-surface/95 border-b border-border backdrop-blur transition-colors duration-250">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 h-[64px] flex items-center gap-4">
        <Link href="/" className="text-[22px] font-bold tracking-[-0.2px] shrink-0">
          <span className="text-gold">Au</span>
          <span className="text-text">Hub</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 ml-2">
          <Link href="/" className="text-[14px] text-text2 hover:text-text transition-colors duration-150">
            Аукционы
          </Link>
          {isAuthenticated && user?.role === 1 && (
            <Link href="/admin" className="text-[14px] text-text2 hover:text-text transition-colors duration-150">
              Админ
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 bg-bg2 border border-border rounded-[8px] px-3 py-2 w-[260px] lg:w-[340px] transition-colors focus-within:border-gold focus-within:bg-surface">
            <Search className="w-4 h-4 text-text3 shrink-0 cursor-pointer" onClick={handleSearch} />
            <input
              type="text"
              placeholder="Поиск лотов"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-[14px] text-text placeholder:text-text3 w-full font-ui"
            />
          </div>

          {isAuthenticated && !isAdmin && (
            <Link
              href="/lots/create"
              className="hidden md:inline-flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-2 rounded-[8px] border border-gold bg-gold text-white hover:bg-gold-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              Лот
            </Link>
          )}

          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-[8px] border border-border bg-surface text-text2 hover:bg-bg2 hover:border-border2 transition-colors flex items-center justify-center"
            aria-label="Переключить тему"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {isAuthenticated ? (
            <>
              <NotificationBell />
              <Link
                href="/profile"
                className="w-9 h-9 rounded-[8px] border border-border bg-surface text-text2 hover:bg-bg2 hover:border-border2 transition-colors flex items-center justify-center"
                aria-label="Профиль"
              >
                <User className="w-4 h-4" />
              </Link>
              <button
                onClick={logout}
                className="text-[13px] font-medium px-3.5 py-2 rounded-[8px] border border-border bg-transparent text-text hover:bg-bg2 transition-colors font-ui"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-border bg-bg2 text-text transition-colors hover:border-border2 hover:bg-surface sm:w-auto sm:px-3.5 sm:py-2 sm:text-[13px] sm:font-medium sm:font-ui"
                aria-label="Войти"
              >
                <User className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Войти</span>
              </Link>
              <Link
                href="/register"
                className="text-[13px] font-medium px-3.5 py-2 rounded-[8px] border border-gold bg-gold text-white hover:bg-gold-hover transition-colors font-ui whitespace-nowrap"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
