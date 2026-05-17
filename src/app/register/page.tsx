"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await register({ email, password, name, role });
    } catch (err: unknown) {
      if (err instanceof Error && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || "Ошибка регистрации");
      } else {
        setError("Ошибка регистрации");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-58px)] flex items-center justify-center px-4 py-12 bg-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-heading text-[28px] font-semibold tracking-[-0.5px]">
            <span className="text-gold">Au</span>
            <span className="text-text">Hub</span>
          </Link>
          <p className="text-text2 mt-2 text-[14px] font-light">Создайте аккаунт</p>
        </div>

        <div className="bg-surface border border-border rounded-[10px] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="text-[13px] text-danger bg-danger-bg border border-danger/20 rounded-[7px] px-4 py-2.5">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-[13px] font-medium text-text2 mb-1.5">
                Имя
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-[14px] bg-bg2 border border-border rounded-[7px] text-text placeholder:text-text3 outline-none focus:border-gold transition-colors font-ui"
                placeholder="Ваше имя"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-text2 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-[14px] bg-bg2 border border-border rounded-[7px] text-text placeholder:text-text3 outline-none focus:border-gold transition-colors font-ui"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-text2 mb-1.5">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2.5 text-[14px] bg-bg2 border border-border rounded-[7px] text-text placeholder:text-text3 outline-none focus:border-gold transition-colors font-ui"
                placeholder="Минимум 8 символов"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-[13px] font-medium text-text2 mb-1.5">
                Роль
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-[14px] bg-bg2 border border-border rounded-[7px] text-text outline-none focus:border-gold transition-colors font-ui cursor-pointer"
              >
                <option value={0}>Участник</option>
                <option value={1}>Администратор</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-[7px] border-none bg-gold text-[#FFF8E8] text-[14px] font-medium cursor-pointer font-ui hover:bg-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Регистрация..." : "Зарегистрироваться"}
            </button>
          </form>

          <div className="mt-6 text-center text-[13px] text-text2">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-gold hover:text-gold-hover transition-colors">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
