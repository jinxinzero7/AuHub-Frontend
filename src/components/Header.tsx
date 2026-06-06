"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Search, User } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q) {
      router.push(`/?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border transition-colors duration-250">
      <div className="max-w-[960px] mx-auto px-4 sm:px-8 h-[58px] flex items-center gap-4">
        <Link href="/" className="font-heading text-[22px] font-semibold tracking-[-0.5px] shrink-0">
          <span className="text-gold">Au</span>
          <span className="text-text">Hub</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 ml-4">
          <Link href="/" className="text-[13.5px] text-text2 hover:text-text border-b-2 border-transparent hover:border-gold transition-colors duration-150">
            Аукционы
          </Link>
          {isAuthenticated && (
            <Link href="/lots/create" className="text-[13.5px] text-text2 hover:text-text border-b-2 border-transparent hover:border-gold transition-colors duration-150">
              Создать лот
            </Link>
          )}
          {isAuthenticated && user?.role === 1 && (
            <Link href="/admin" className="text-[13.5px] text-text2 hover:text-text border-b-2 border-transparent hover:border-gold transition-colors duration-150">
              Админ
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 bg-bg2 border border-border rounded-[7px] px-3 py-1.5 w-[210px] transition-colors focus-within:border-gold">
            <Search className="w-[15px] h-[15px] text-text3 shrink-0 cursor-pointer" onClick={handleSearch} />
            <input
              type="text"
              placeholder="Поиск лотов…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-[13px] text-text placeholder:text-text3 w-full font-ui"
            />
          </div>

          <button
            onClick={toggleTheme}
            className="w-[34px] h-[34px] rounded-[7px] border border-border bg-surface text-text2 hover:bg-bg2 hover:border-border2 transition-colors flex items-center justify-center"
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
                className="w-[34px] h-[34px] rounded-[7px] border border-border bg-surface text-text2 hover:bg-bg2 hover:border-border2 transition-colors flex items-center justify-center"
                aria-label="Профиль"
              >
                <User className="w-4 h-4" />
              </Link>
              <button
                onClick={logout}
                className="text-[13px] font-normal px-4 py-1.5 rounded-[7px] border border-border bg-transparent text-text hover:bg-bg2 transition-colors font-ui"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[13px] font-normal px-4 py-1.5 rounded-[7px] border border-border bg-transparent text-text hover:bg-bg2 transition-colors font-ui whitespace-nowrap"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="text-[13px] font-medium px-4 py-1.5 rounded-[7px] border-none bg-gold text-[#FFF8E8] hover:bg-gold-hover transition-colors font-ui whitespace-nowrap"
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
