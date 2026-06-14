"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  validateEmail,
  validateName,
  validateNickname,
  validatePassword,
  validatePhoneNumber,
} from "@/lib/validation";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const clearFieldError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const nextErrors: Record<string, string> = {};
    const nameError = validateName(name);
    const nicknameError = validateNickname(nickname);
    const phoneError = validatePhoneNumber(phoneNumber);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (nameError) nextErrors.name = nameError;
    if (nicknameError) nextErrors.nickname = nicknameError;
    if (phoneError) nextErrors.phoneNumber = phoneError;
    if (emailError) nextErrors.email = emailError;
    if (passwordError) nextErrors.password = passwordError;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await register({ email, phoneNumber, nickname, password, name });
    } catch (err: unknown) {
      if (err instanceof Error && "response" in err) {
        const axiosErr = err as { response?: { data?: { errors?: { generalErrors?: string[] } } } };
        setServerError(axiosErr.response?.data?.errors?.generalErrors?.[0] || "Не удалось зарегистрироваться");
      } else {
        setServerError("Не удалось зарегистрироваться");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass = (field: string) =>
    `w-full rounded-[7px] border bg-bg2 px-3 py-2.5 text-[14px] text-text outline-none transition-colors placeholder:text-text3 ${errors[field] ? "border-danger" : "border-border focus:border-gold"}`;

  return (
    <main id="main-content" className="min-h-screen bg-bg px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-[980px] items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[8px] border border-border bg-surface shadow-sm lg:grid-cols-[0.85fr_1.15fr]">
          <section className="border-b border-border bg-surface2 p-6 lg:border-b-0 lg:border-r lg:p-8">
            <Link href="/" className="text-[26px] font-semibold text-text">
              <span className="text-gold">Au</span>Hub
            </Link>
            <h1 className="mt-8 text-[28px] font-semibold leading-tight text-text">
              Создание аккаунта
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-text2">
              Профиль нужен для ставок, продажи лотов, рейтинга продавца и подтверждения контактов.
            </p>
          </section>

          <section className="p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
              {serverError && (
                <div
                  className="sm:col-span-2 rounded-[7px] border border-danger/20 bg-danger-bg px-4 py-2.5 text-[13px] text-danger"
                  role="alert"
                >
                  {serverError}
                </div>
              )}

              <div>
                <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium text-text2">
                  Имя
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError("name");
                  }}
                  className={fieldClass("name")}
                  placeholder="Ваше имя"
                  autoComplete="name"
                />
                {errors.name && <p className="text-danger mt-1 text-[12px]">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="nickname" className="mb-1.5 block text-[13px] font-medium text-text2">
                  Никнейм
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    clearFieldError("nickname");
                  }}
                  className={fieldClass("nickname")}
                  placeholder="nickname_123"
                  autoComplete="username"
                />
                {errors.nickname && <p className="text-danger mt-1 text-[12px]">{errors.nickname}</p>}
              </div>

              <div>
                <label htmlFor="phoneNumber" className="mb-1.5 block text-[13px] font-medium text-text2">
                  Телефон
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    clearFieldError("phoneNumber");
                  }}
                  className={fieldClass("phoneNumber")}
                  placeholder="+79990000000"
                  autoComplete="tel"
                />
                {errors.phoneNumber && <p className="text-danger mt-1 text-[12px]">{errors.phoneNumber}</p>}
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-text2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                  className={fieldClass("email")}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
                {errors.email && <p className="text-danger mt-1 text-[12px]">{errors.email}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-text2">
                  Пароль
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  className={fieldClass("password")}
                  placeholder="Минимум 8 символов"
                  autoComplete="new-password"
                />
                {errors.password && <p className="text-danger mt-1 text-[12px]">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="sm:col-span-2 rounded-[7px] bg-gold py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Создаём аккаунт..." : "Зарегистрироваться"}
              </button>
            </form>

            <p className="mt-6 text-center text-[13px] text-text2">
              Уже есть аккаунт?{" "}
              <Link href="/login" className="font-medium text-gold transition-colors hover:text-gold-hover">
                Войти
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
