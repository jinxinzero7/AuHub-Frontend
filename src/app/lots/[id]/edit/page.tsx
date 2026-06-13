"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { calculateSellerPayout, calculateServiceFee, formatPrice } from "@/lib/utils";
import { validateLotDescription, validateLotTitle, validateStartingPrice } from "@/lib/validation";
import type { Lot } from "@/types";

const DURATION_PRESETS = [
  { label: "24 часа", hours: 24 },
  { label: "48 часов", hours: 48 },
  { label: "72 часа", hours: 72 },
  { label: "7 дней", hours: 168 },
];

const DELIVERY_PROVIDERS = [
  { value: "Cdek", label: "СДЭК" },
  { value: "YandexDelivery", label: "Яндекс Доставка" },
  { value: "RussianPost", label: "Почта России" },
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
      .catch(() => setServerError("Не удалось загрузить лот"))
      .finally(() => setIsLoadingLot(false));
  }, [lotId]);

  const canEdit = lot && user?.id === lot.sellerId && (lot.status === "Draft" || lot.status === "Rejected");

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const titleErr = validateLotTitle(title);
    const descErr = validateLotDescription(description);
    const priceErr = validateStartingPrice(startingPrice);

    if (titleErr) newErrors.title = titleErr;
    if (descErr) newErrors.description = descErr;
    if (priceErr) newErrors.startingPrice = priceErr;
    if (supportedDeliveryProviders.length === 0) {
      newErrors.supportedDeliveryProviders = "Выберите хотя бы одну службу доставки";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      if (err instanceof Error && "response" in err) {
        const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; detail?: string; title?: string } } };
        const data = axiosErr.response?.data;
        setServerError(data?.errors ? Object.values(data.errors).flat().join(", ") : data?.detail ?? data?.title ?? "Ошибка сохранения лота");
      } else {
        setServerError("Ошибка сохранения лота");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClass = (field: string) =>
    `w-full px-3 py-2.5 text-[14px] bg-bg2 border rounded-[7px] text-text placeholder:text-text3 outline-none transition-colors font-ui ${errors[field] ? "border-danger" : "border-border focus:border-gold"}`;

  const toggleDeliveryProvider = (provider: string) => {
    setSupportedDeliveryProviders((prev) =>
      prev.includes(provider)
        ? prev.filter((item) => item !== provider)
        : [...prev, provider]
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
        <main className="bg-bg min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-heading text-[28px] text-text mb-2">Доступ запрещён</h1>
            <p className="text-text2 text-[14px] font-light">Войдите, чтобы редактировать лот</p>
          </div>
        </main>
      </>
    );
  }

  if (isLoadingLot) {
    return (
      <>
        <Header />
        <main className="bg-bg min-h-screen flex items-center justify-center">
          <div className="text-text3 text-[14px]">Загрузка...</div>
        </main>
      </>
    );
  }

  if (!canEdit) {
    return (
      <>
        <Header />
        <main className="bg-bg min-h-screen flex items-center justify-center">
          <div className="text-center max-w-[420px] px-4">
            <h1 className="font-heading text-[28px] text-text mb-2">Редактирование недоступно</h1>
            <p className="text-text2 text-[14px] font-light">
              Изменять можно только свои лоты в статусе черновика или после отклонения модерацией.
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
          <h1 className="font-heading text-[28px] font-semibold text-text mb-2">Редактировать лот</h1>
          <p className="text-[13px] text-text2 mb-6">
            После сохранения отклонённый лот вернётся в черновик. Лот на модерации редактировать нельзя.
          </p>

          <div className="bg-surface border border-border rounded-[10px] p-8">
            <form onSubmit={(event) => event.preventDefault()} className="space-y-5" noValidate>
              {serverError && (
                <div className="text-[13px] text-danger bg-danger-bg border border-danger/20 rounded-[7px] px-4 py-2.5">
                  {serverError}
                </div>
              )}

              {lot.adminComment && (
                <div className="text-[13px] text-text2 bg-bg2 border border-border rounded-[7px] px-4 py-2.5">
                  Причина отклонения: {lot.adminComment}
                </div>
              )}

              <div>
                <label htmlFor="title" className="block text-[13px] font-medium text-text2 mb-1.5">Название</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(event) => { setTitle(event.target.value); setErrors((prev) => ({ ...prev, title: "" })); }}
                  className={fieldClass("title")}
                  placeholder="Название лота"
                />
                {errors.title && <p className="text-[12px] text-danger mt-1">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-[13px] font-medium text-text2 mb-1.5">Описание</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => { setDescription(event.target.value); setErrors((prev) => ({ ...prev, description: "" })); }}
                  rows={4}
                  className={fieldClass("description")}
                  placeholder="Описание лота"
                />
                {errors.description && <p className="text-[12px] text-danger mt-1">{errors.description}</p>}
              </div>

              <div>
                <label htmlFor="startingPrice" className="block text-[13px] font-medium text-text2 mb-1.5">Стартовая цена (₽)</label>
                <input
                  id="startingPrice"
                  type="number"
                  value={startingPrice}
                  onChange={(event) => { setStartingPrice(event.target.value); setErrors((prev) => ({ ...prev, startingPrice: "" })); }}
                  className={fieldClass("startingPrice")}
                  placeholder="1000"
                />
                {errors.startingPrice && <p className="text-[12px] text-danger mt-1">{errors.startingPrice}</p>}
                {hasPayoutPreview && (
                  <div className="mt-2 rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[12px] text-text2">
                    <div>Комиссия сервиса 1%: ₽ {formatPrice(serviceFee)}</div>
                    <div className="mt-0.5 text-text font-medium">
                      С учетом комиссии вы получите ₽ {formatPrice(sellerPayout)}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-medium text-text2 mb-2">Длительность аукциона</label>
                <div className="grid grid-cols-4 gap-2">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.hours}
                      type="button"
                      onClick={() => setDurationHours(preset.hours)}
                      className={`py-2.5 rounded-[7px] text-[13px] font-medium transition-colors font-ui border ${
                        durationHours === preset.hours
                          ? "bg-gold text-[#FFF8E8] border-gold"
                          : "bg-bg2 text-text2 border-border hover:border-gold"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-text2 mb-2">Службы доставки</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {DELIVERY_PROVIDERS.map((provider) => (
                    <label
                      key={provider.value}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-[7px] border text-[13px] font-ui cursor-pointer transition-colors ${
                        supportedDeliveryProviders.includes(provider.value)
                          ? "bg-gold-light text-text border-gold"
                          : "bg-bg2 text-text2 border-border hover:border-gold"
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
                  <p className="text-[12px] text-danger mt-1">{errors.supportedDeliveryProviders}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => save(false)}
                  disabled={isSaving}
                  className="w-full py-2.5 rounded-[7px] border border-border bg-bg2 text-text text-[14px] font-medium cursor-pointer font-ui hover:border-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Сохранение..." : "Сохранить черновик"}
                </button>
                <button
                  type="button"
                  onClick={() => save(true)}
                  disabled={isSaving}
                  className="w-full py-2.5 rounded-[7px] border-none bg-gold text-[#FFF8E8] text-[14px] font-medium cursor-pointer font-ui hover:bg-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Сохранение..." : "Сохранить и отправить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
