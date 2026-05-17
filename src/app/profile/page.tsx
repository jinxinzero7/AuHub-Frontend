"use client";

import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { User as UserIcon, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <>
        <Header />
        <main className="bg-bg min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-heading text-[28px] text-text mb-2">Необходима авторизация</h1>
            <p className="text-text2 text-[14px] font-light">
              Войдите, чтобы просмотреть профиль
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-bg min-h-screen">
        <div className="max-w-[640px] mx-auto px-4 sm:px-8 py-10">
          <div className="bg-surface border border-border rounded-[10px] p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-[10px] bg-gold-light border border-gold-border flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h1 className="font-heading text-[22px] font-semibold text-text">
                  {user.name}
                </h1>
                <p className="text-[13px] text-text2 font-light">{user.email}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-[13px] text-text2 font-light">Роль</span>
                <span className="text-[13px] text-text font-medium">
                  {user.role === 1 ? "Администратор" : "Участник"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-[13px] text-text2 font-light">ID</span>
                <span className="text-[13px] text-text font-mono text-[11px]">{user.id}</span>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full py-2.5 rounded-[7px] border border-border bg-transparent text-text text-[14px] font-medium cursor-pointer font-ui hover:bg-bg2 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
