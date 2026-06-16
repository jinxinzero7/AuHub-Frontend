"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { DELIVERY_PROVIDER_OPTIONS } from "@/lib/labels";
import { calculateSellerPayout, calculateServiceFee, formatPrice } from "@/lib/utils";
import { validateLotDescription, validateLotTitle, validateStartingPrice } from "@/lib/validation";

const DURATION_PRESETS = [
  { label: "24 часа", hours: 24 },
  { label: "48 часов", hours: 48 },
  { label: "72 часа", hours: 72 },
  { label: "7 дней", hours: 168 },
];

export default function CreateLotPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [durationHours, setDurationHours] = useState(48);
  const [supportedDeliveryProviders, setSupportedDeliveryProviders] = useState<string[]>(["Cdek"]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex min-h-screen items-center justify-center bg-bg px-4">
          <div className="max-w-[420px] rounded-[8px] border border-border bg-surface p-6 text-center">
            <h1 className="text-[24px] font-semibold text-text">Нужен вход</h1>
            <p className="mt-2 text-[14px] leading-6 text-text2">
              Создавать лоты могут только авторизованные пользователи.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex rounded-[7px] bg-gold px-4 py-2.5 text-[14px] font-medium text-white hover:bg-gold-hover"
            >
              Войти
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (user?.role === 1) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex min-h-screen items-center justify-center bg-bg px-4">
          <div className="max-w-[460px] rounded-[8px] border border-border bg-surface p-6 text-center">
            <h1 className="text-[24px] font-semibold text-text">Создание лотов недоступно администратору</h1>
            <p className="mt-2 text-[14px] leading-6 text-text2">
              Администратор выступает сотрудником платформы: модерирует лоты, пользователей, документы и спорные ситуации. Создание лотов доступно только обычным пользователям.
            </p>
            <Link
              href="/admin"
              className="mt-5 inline-flex rounded-[7px] bg-gold px-4 py-2.5 text-[14px] font-medium text-white hover:bg-gold-hover"
            >
              Перейти в админ-раздел
            </Link>
          </div>
        </main>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const nextErrors: Record<string, string> = {};
    const titleError = validateLotTitle(title);
    const descriptionError = validateLotDescription(description);
    const priceError = validateStartingPrice(startingPrice);

    if (titleError) nextErrors.title = titleError;
    if (descriptionError) nextErrors.description = descriptionError;
    if (priceError) nextErrors.startingPrice = priceError;
    if (supportedDeliveryProviders.length === 0) {
      nextErrors.supportedDeliveryProviders = "Выберите хотя бы одну службу доставки";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await api.post("/api/lots", {
        title,
        description,
        startingPrice: parseFloat(startingPrice),
        durationHours,
        supportedDeliveryProviders,
      });
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error && "response" in err) {
        const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
        const responseErrors = axiosErr.response?.data?.errors;
        setServerError(responseErrors ? Object.values(responseErrors).flat().join(", ") : "Не удалось создать лот");
      } else {
        setServerError("Не удалось создать лот");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass = (field: string) =>
    `w-full rounded-[7px] border bg-bg2 px-3 py-2.5 text-[14px] text-text outline-none transition-colors placeholder:text-text3 ${errors[field] ? "border-danger" : "border-border focus:border-gold"}`;

  const toggleDeliveryProvider = (provider: string) => {
    setSupportedDeliveryProviders((prev) =>
      prev.includes(provider) ? prev.filter((item) => item !== provider) : [...prev, provider],
    );
    setErrors((prev) => ({ ...prev, supportedDeliveryProviders: "" }));
  };

  const startingPriceNumber = Number.parseFloat(startingPrice);
  const hasPayoutPreview = Number.isFinite(startingPriceNumber) && startingPriceNumber > 0;
  const serviceFee = hasPayoutPreview ? calculateServiceFee(startingPriceNumber) : 0;
  const sellerPayout = hasPayoutPreview ? calculateSellerPayout(startingPriceNumber) : 0;

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-bg">
        <div className="mx-auto grid max-w-[1120px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-[8px] border border-border bg-surface p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-[13px] font-medium text-gold">Новый лот</p>
              <h1 className="mt-1 text-[28px] font-semibold text-text">Создать черновик</h1>
              <p className="mt-2 max-w-[720px] text-[14px] leading-6 text-text2">
                После создания лот попадёт в черновики. Его можно отредактировать и отправить на модерацию.
              </p>
            </div>

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
                <label htmlFor="title" className="mb-1.5 block text-[13px] font-medium text-text2">
                  Название
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors((prev) => ({ ...prev, title: "" }));
                  }}
                  className={fieldClass("title")}
                  placeholder="Например: Плёночная камера Olympus"
                />
                {errors.title && <p className="mt-1 text-[12px] text-danger">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="description" className="mb-1.5 block text-[13px] font-medium text-text2">
                  Описание
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors((prev) => ({ ...prev, description: "" }));
                  }}
                  rows={5}
                  className={fieldClass("description")}
                  placeholder="Состояние, комплект, дефекты, город отправки"
                />
                {errors.description && <p className="mt-1 text-[12px] text-danger">{errors.description}</p>}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="startingPrice" className="mb-1.5 block text-[13px] font-medium text-text2">
                    Стартовая цена
                  </label>
                  <input
                    id="startingPrice"
                    type="number"
                    value={startingPrice}
                    onChange={(e) => {
                      setStartingPrice(e.target.value);
                      setErrors((prev) => ({ ...prev, startingPrice: "" }));
                    }}
                    className={fieldClass("startingPrice")}
                    placeholder="1000"
                    min={1}
                    inputMode="decimal"
                  />
                  {errors.startingPrice && <p className="mt-1 text-[12px] text-danger">{errors.startingPrice}</p>}
                </div>

                <div>
                  <span className="mb-1.5 block text-[13px] font-medium text-text2">
                    Длительность
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset.hours}
                        type="button"
                        onClick={() => setDurationHours(preset.hours)}
                        className={`rounded-[7px] border px-3 py-2.5 text-[13px] font-medium transition-colors ${
                          durationHours === preset.hours
                            ? "border-gold bg-gold text-white"
                            : "border-border bg-bg2 text-text2 hover:border-gold"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <span className="mb-2 block text-[13px] font-medium text-text2">
                  Службы доставки
                </span>
                <div className="grid gap-2 sm:grid-cols-3">
                  {DELIVERY_PROVIDER_OPTIONS.map((provider) => (
                    <label
                      key={provider.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-[7px] border px-3 py-2.5 text-[13px] transition-colors ${
                        supportedDeliveryProviders.includes(provider.value)
                          ? "border-gold bg-gold-light text-text"
                          : "border-border bg-bg2 text-text2 hover:border-gold"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={supportedDeliveryProviders.includes(provider.value)}
                        onChange={() => toggleDeliveryProvider(provider.value)}
                        className="h-4 w-4 accent-gold"
                      />
                      <span>{provider.label}</span>
                    </label>
                  ))}
                </div>
                {errors.supportedDeliveryProviders && (
                  <p className="mt-1 text-[12px] text-danger">{errors.supportedDeliveryProviders}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-[7px] bg-gold py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6"
              >
                {isLoading ? "Создаём..." : "Создать черновик"}
              </button>
            </form>
          </section>

          <aside className="h-fit rounded-[8px] border border-border bg-surface p-5">
            <h2 className="text-[17px] font-semibold text-text">Предварительный расчёт</h2>
            <div className="mt-4 space-y-3 text-[13px]">
              <div className="flex justify-between gap-4 border-b border-border pb-3 text-text2">
                <span>Цена лота</span>
                <span className="font-medium text-text">
                  {hasPayoutPreview ? `${formatPrice(startingPriceNumber)} ₽` : "не указана"}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-3 text-text2">
                <span>Комиссия AuHub 1%</span>
                <span className="font-medium text-text">{hasPayoutPreview ? `${formatPrice(serviceFee)} ₽` : "0 ₽"}</span>
              </div>
              <div className="rounded-[7px] bg-gold-light p-3">
                <div className="text-[12px] text-text2">С учётом комиссии вы получите</div>
                <div className="mt-1 text-[22px] font-semibold text-text">
                  {hasPayoutPreview ? `${formatPrice(sellerPayout)} ₽` : "0 ₽"}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
