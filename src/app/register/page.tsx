"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
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

    const newErrors: Record<string, string> = {};
    const nameErr = validateName(name);
    const nicknameErr = validateNickname(nickname);
    const phoneErr = validatePhoneNumber(phoneNumber);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    if (nameErr) newErrors.name = nameErr;
    if (nicknameErr) newErrors.nickname = nicknameErr;
    if (phoneErr) newErrors.phoneNumber = phoneErr;
    if (emailErr) newErrors.email = emailErr;
    if (passErr) newErrors.password = passErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await register({ email, phoneNumber, nickname, password, name });
    } catch (err: unknown) {
      if (err instanceof Error && "response" in err) {
        const axiosErr = err as { response?: { data?: { errors?: { generalErrors?: string[] } } } };
        setServerError(axiosErr.response?.data?.errors?.generalErrors?.[0] || "Ошибка регистрации");
      } else {
        setServerError("Ошибка регистрации");
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
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {serverError && (
              <div className="text-[13px] text-danger bg-danger-bg border border-danger/20 rounded-[7px] px-4 py-2.5">
                {serverError}
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
                onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
                className={`w-full px-3 py-2.5 text-[14px] bg-bg2 border rounded-[7px] text-text placeholder:text-text3 outline-none transition-colors font-ui ${errors.name ? "border-danger" : "border-border focus:border-gold"}`}
                placeholder="Ваше имя"
                autoComplete="name"
              />
              {errors.name && <p className="text-[12px] text-danger mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="nickname" className="block text-[13px] font-medium text-text2 mb-1.5">
                Никнейм
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); clearFieldError("nickname"); }}
                className={`w-full px-3 py-2.5 text-[14px] bg-bg2 border rounded-[7px] text-text placeholder:text-text3 outline-none transition-colors font-ui ${errors.nickname ? "border-danger" : "border-border focus:border-gold"}`}
                placeholder="nickname_123"
                autoComplete="username"
              />
              {errors.nickname && <p className="text-[12px] text-danger mt-1">{errors.nickname}</p>}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-[13px] font-medium text-text2 mb-1.5">
                Телефон
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => { setPhoneNumber(e.target.value); clearFieldError("phoneNumber"); }}
                className={`w-full px-3 py-2.5 text-[14px] bg-bg2 border rounded-[7px] text-text placeholder:text-text3 outline-none transition-colors font-ui ${errors.phoneNumber ? "border-danger" : "border-border focus:border-gold"}`}
                placeholder="+79990000000"
                autoComplete="tel"
              />
              {errors.phoneNumber && <p className="text-[12px] text-danger mt-1">{errors.phoneNumber}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-text2 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                className={`w-full px-3 py-2.5 text-[14px] bg-bg2 border rounded-[7px] text-text placeholder:text-text3 outline-none transition-colors font-ui ${errors.email ? "border-danger" : "border-border focus:border-gold"}`}
                placeholder="your@email.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-[12px] text-danger mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-text2 mb-1.5">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                className={`w-full px-3 py-2.5 text-[14px] bg-bg2 border rounded-[7px] text-text placeholder:text-text3 outline-none transition-colors font-ui ${errors.password ? "border-danger" : "border-border focus:border-gold"}`}
                placeholder="Минимум 8 символов"
                autoComplete="new-password"
              />
              {errors.password && <p className="text-[12px] text-danger mt-1">{errors.password}</p>}
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
