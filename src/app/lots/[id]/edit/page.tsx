"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Alert, EmptyState, LoadingState } from "@/components/UiState";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { getApiErrorMessage } from "@/lib/errors";
import { DELIVERY_PROVIDER_OPTIONS } from "@/lib/labels";
import { calculateSellerPayout, calculateServiceFee, formatPrice } from "@/lib/utils";
import { validateLotDescription, validateLotTitle, validateStartingPrice } from "@/lib/validation";
import type { Lot } from "@/types";

const DURATION_PRESETS = [
  { label: "24 часа", hours: 24 },
  { label: "48 часов", hours: 48 },
  { label: "72 часа", hours: 72 },
  { label: "7 дней", hours: 168 },
];

export default function EditLotPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const lotId = params.id;

  const [lot, setLot] = useState<Lot | null>(null);
  const [isLoadingLot, setIsLoadingLot] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [durationHours, setDurationHours] = useState(48);
  const [supportedDeliveryProviders, setSupportedDeliveryProviders] = useState<string[]>(["Cdek"]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.get<Lot>(API_ENDPOINTS.LOTS.DETAIL(lotId))
      .then((response) => {
        const loadedLot = response.data;
        setLot(loadedLot);
        setTitle(loadedLot.title);
        setDescription(loadedLot.description);
        setStartingPrice(String(loadedLot.startingPrice));
        setDurationHours(loadedLot.durationHours || 48);
        setSupportedDeliveryProviders(loadedLot.supportedDeliveryProviders?.length ? loadedLot.supportedDeliveryProviders : ["Cdek"]);
      })
      .catch((err) => setServerError(getApiErrorMessage(err, "Не удалось загрузить лот")))
      .finally(() => setIsLoadingLot(false));
  }, [lotId]);

  const canEdit = lot && user?.id === lot.sellerId && (lot.status === "Draft" || lot.status === "Rejected");

  const validate = () => {
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

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const save = async (submitForModeration: boolean) => {
    setServerError("");
    if (!validate()) return;

    setIsSaving(true);
    try {
      await api.put(API_ENDPOINTS.LOTS.UPDATE(lotId), {
        title,
        description,
        startingPrice: parseFloat(startingPrice),
        durationHours,
        supportedDeliveryProviders,
        submitForModeration,
      });
      router.push(`/lots/${lotId}`);
    } catch (err: unknown) {
      setServerError(getApiErrorMessage(err, "Не удалось сохранить лот"));
    } finally {
      setIsSaving(false);
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

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex min-h-screen items-center justify-center bg-bg px-4">
          <div className="max-w-[460px]">
            <EmptyState title="Нужен вход" description="Войдите, чтобы редактировать свои лоты." actionHref="/login" actionLabel="Войти" />
          </div>
        </main>
      </>
    );
  }

  if (isLoadingLot) {
    return (
      <>
        <Header />
        <main id="main-content" className="min-h-screen bg-bg px-4 py-10">
          <div className="mx-auto max-w-[760px]">
            <LoadingState />
          </div>
        </main>
      </>
    );
  }

  if (!canEdit) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex min-h-screen items-center justify-center bg-bg px-4">
          <div className="max-w-[520px]">
            <EmptyState
              title="Редактирование недоступно"
              description="Изменять можно только свои лоты в статусе черновика или после отклонения модерацией. Лот на модерации уже заблокирован от изменений."
              actionHref={lot ? `/lots/${lot.id}` : "/"}
              actionLabel="Вернуться к лоту"
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
        <div className="mx-auto grid max-w-[1120px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-[8px] border border-border bg-surface p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-[13px] font-medium text-gold">Редактирование лота</p>
              <h1 className="mt-1 text-[28px] font-semibold text-text">{lot.title}</h1>
              <p className="mt-2 text-[14px] leading-6 text-text2">
                Сохранение без отправки оставит лот черновиком. Отправка передаст его на модерацию.
              </p>
            </div>

            <form onSubmit={(event) => event.preventDefault()} className="space-y-5" noValidate>
              {serverError && <Alert>{serverError}</Alert>}
              {lot.adminComment && <Alert tone="info">Причина отклонения: {lot.adminComment}</Alert>}

              <div>
                <label htmlFor="title" className="mb-1.5 block text-[13px] font-medium text-text2">Название</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setErrors((prev) => ({ ...prev, title: "" }));
                  }}
                  className={fieldClass("title")}
                  placeholder="Название лота"
                />
                {errors.title && <p className="mt-1 text-[12px] text-danger">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="description" className="mb-1.5 block text-[13px] font-medium text-text2">Описание</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setErrors((prev) => ({ ...prev, description: "" }));
                  }}
                  rows={5}
                  className={fieldClass("description")}
                  placeholder="Описание лота"
                />
                {errors.description && <p className="mt-1 text-[12px] text-danger">{errors.description}</p>}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="startingPrice" className="mb-1.5 block text-[13px] font-medium text-text2">Стартовая цена</label>
                  <input
                    id="startingPrice"
                    type="number"
                    value={startingPrice}
                    onChange={(event) => {
                      setStartingPrice(event.target.value);
                      setErrors((prev) => ({ ...prev, startingPrice: "" }));
                    }}
                    className={fieldClass("startingPrice")}
                    placeholder="1000"
                    min={1}
                  />
                  {errors.startingPrice && <p className="mt-1 text-[12px] text-danger">{errors.startingPrice}</p>}
                </div>

                <div>
                  <span className="mb-1.5 block text-[13px] font-medium text-text2">Длительность</span>
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
                <span className="mb-2 block text-[13px] font-medium text-text2">Службы доставки</span>
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

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => save(false)}
                  disabled={isSaving}
                  className="rounded-[7px] border border-border bg-bg2 py-2.5 text-[14px] font-medium text-text transition-colors hover:border-gold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? "Сохранение..." : "Сохранить черновик"}
                </button>
                <button
                  type="button"
                  onClick={() => save(true)}
                  disabled={isSaving}
                  className="rounded-[7px] bg-gold py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? "Сохранение..." : "Сохранить и отправить"}
                </button>
              </div>
            </form>
          </section>

          <aside className="h-fit rounded-[8px] border border-border bg-surface p-5">
            <h2 className="text-[17px] font-semibold text-text">Расчёт выплаты</h2>
            <div className="mt-4 space-y-3 text-[13px]">
              <div className="flex justify-between gap-4 border-b border-border pb-3 text-text2">
                <span>Цена лота</span>
                <span className="font-medium text-text">{hasPayoutPreview ? `${formatPrice(startingPriceNumber)} ₽` : "не указана"}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-3 text-text2">
                <span>Комиссия AuHub 1%</span>
                <span className="font-medium text-text">{hasPayoutPreview ? `${formatPrice(serviceFee)} ₽` : "0 ₽"}</span>
              </div>
              <div className="rounded-[7px] bg-gold-light p-3">
                <div className="text-[12px] text-text2">С учётом комиссии вы получите</div>
                <div className="mt-1 text-[22px] font-semibold text-text">{hasPayoutPreview ? `${formatPrice(sellerPayout)} ₽` : "0 ₽"}</div>
              </div>
            </div>
            <Link href={`/lots/${lotId}`} className="mt-4 inline-flex w-full justify-center rounded-[7px] border border-border px-4 py-2 text-[13px] font-medium text-text hover:border-gold">
              Вернуться к лоту
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}
