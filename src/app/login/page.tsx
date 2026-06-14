"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { validateEmailOrPhone } from "@/lib/validation";

export default function LoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const nextErrors: Record<string, string> = {};
    const identifierError = validateEmailOrPhone(identifier);
    if (identifierError) nextErrors.identifier = identifierError;
    if (!password) nextErrors.password = "Пароль обязателен";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await login({ identifier, password });
    } catch (err: unknown) {
      if (err instanceof Error && "response" in err) {
        const axiosErr = err as { response?: { data?: { errors?: { generalErrors?: string[] } } } };
        setServerError(axiosErr.response?.data?.errors?.generalErrors?.[0] || "Неверный email, телефон или пароль");
      } else {
        setServerError("Неверный email, телефон или пароль");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass = (field: string) =>
    `w-full rounded-[7px] border bg-bg2 px-3 py-2.5 text-[14px] text-text outline-none transition-colors placeholder:text-text3 ${errors[field] ? "border-danger" : "border-border focus:border-gold"}`;

  return (
    <main id="main-content" className="min-h-screen bg-bg px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-[920px] items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[8px] border border-border bg-surface shadow-sm md:grid-cols-[0.95fr_1.05fr]">
          <section className="border-b border-border bg-surface2 p-6 md:border-b-0 md:border-r md:p-8">
            <Link href="/" className="text-[26px] font-semibold text-text">
              <span className="text-gold">Au</span>Hub
            </Link>
            <h1 className="mt-8 text-[28px] font-semibold leading-tight text-text">
              Вход в аккаунт
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-text2">
              Используйте email или телефон. После входа доступны ставки, баланс, выигрыши и управление лотами.
            </p>
          </section>

          <section className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {serverError && (
                <div
                  className="rounded-[7px] border border-danger/20 bg-danger-bg px-4 py-2.5 text-[13px] text-danger"
                  role="alert"
                >
                  {serverError}
                </div>
              )}

              <div>
                <label htmlFor="identifier" className="mb-1.5 block text-[13px] font-medium text-text2">
                  Email или телефон
                </label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setErrors((prev) => ({ ...prev, identifier: "" }));
                  }}
                  className={fieldClass("identifier")}
                  placeholder="your@email.com или +79990000000"
                  autoComplete="username"
                />
                {errors.identifier && <p className="text-danger mt-1 text-[12px]">{errors.identifier}</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-text2">
                  Пароль
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  className={fieldClass("password")}
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                />
                {errors.password && <p className="text-danger mt-1 text-[12px]">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-[7px] bg-gold py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Входим..." : "Войти"}
              </button>
            </form>

            <p className="mt-6 text-center text-[13px] text-text2">
              Нет аккаунта?{" "}
              <Link href="/register" className="font-medium text-gold transition-colors hover:text-gold-hover">
                Зарегистрироваться
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
