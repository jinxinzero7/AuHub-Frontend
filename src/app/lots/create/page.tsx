"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import api from "@/lib/api";
import { validateLotTitle, validateLotDescription, validateStartingPrice } from "@/lib/validation";

export default function CreateLotPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthenticated || user?.role !== 1) {
    return (
      <>
        <Header />
        <main className="bg-bg min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-heading text-[28px] text-text mb-2">Доступ запрещён</h1>
            <p className="text-text2 text-[14px] font-light">
              Только администраторы могут создавать лоты
            </p>
          </div>
        </main>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const newErrors: Record<string, string> = {};
    const titleErr = validateLotTitle(title);
    const descErr = validateLotDescription(description);
    const priceErr = validateStartingPrice(startingPrice);
    if (titleErr) newErrors.title = titleErr;
    if (descErr) newErrors.description = descErr;
    if (priceErr) newErrors.startingPrice = priceErr;
    if (!startTime) newErrors.startTime = "Дата начала обязательна";
    if (!endTime) newErrors.endTime = "Дата окончания обязательна";
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) newErrors.endTime = "Окончание должно быть после начала";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await api.post("/api/lots", {
        title,
        description,
        startingPrice: parseFloat(startingPrice),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error && "response" in err) {
        const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
        const errs = axiosErr.response?.data?.errors;
        if (errs) {
          setServerError(Object.values(errs).flat().join(", "));
        } else {
          setServerError("Ошибка создания лота");
        }
      } else {
        setServerError("Ошибка создания лота");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass = (field: string) =>
    `w-full px-3 py-2.5 text-[14px] bg-bg2 border rounded-[7px] text-text placeholder:text-text3 outline-none transition-colors font-ui ${errors[field] ? "border-danger" : "border-border focus:border-gold"}`;

  return (
    <>
      <Header />
      <main className="bg-bg min-h-screen">
        <div className="max-w-[640px] mx-auto px-4 sm:px-8 py-10">
          <h1 className="font-heading text-[28px] font-semibold text-text mb-6">
            Создать лот
          </h1>

          <div className="bg-surface border border-border rounded-[10px] p-8">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {serverError && (
                <div className="text-[13px] text-danger bg-danger-bg border border-danger/20 rounded-[7px] px-4 py-2.5">
                  {serverError}
                </div>
              )}

              <div>
                <label htmlFor="title" className="block text-[13px] font-medium text-text2 mb-1.5">
                  Название
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: "" })); }}
                  className={fieldClass("title")}
                  placeholder="Название лота"
                />
                {errors.title && <p className="text-[12px] text-danger mt-1">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-[13px] font-medium text-text2 mb-1.5">
                  Описание
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: "" })); }}
                  rows={4}
                  className={fieldClass("description")}
                  placeholder="Описание лота"
                />
                {errors.description && <p className="text-[12px] text-danger mt-1">{errors.description}</p>}
              </div>

              <div>
                <label htmlFor="startingPrice" className="block text-[13px] font-medium text-text2 mb-1.5">
                  Стартовая цена (₽)
                </label>
                <input
                  id="startingPrice"
                  type="number"
                  value={startingPrice}
                  onChange={(e) => { setStartingPrice(e.target.value); setErrors(prev => ({ ...prev, startingPrice: "" })); }}
                  className={fieldClass("startingPrice")}
                  placeholder="1000"
                />
                {errors.startingPrice && <p className="text-[12px] text-danger mt-1">{errors.startingPrice}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-[13px] font-medium text-text2 mb-1.5">
                    Начало
                  </label>
                  <input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => { setStartTime(e.target.value); setErrors(prev => ({ ...prev, startTime: "" })); }}
                    className={fieldClass("startTime")}
                  />
                  {errors.startTime && <p className="text-[12px] text-danger mt-1">{errors.startTime}</p>}
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-[13px] font-medium text-text2 mb-1.5">
                    Окончание
                  </label>
                  <input
                    id="endTime"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => { setEndTime(e.target.value); setErrors(prev => ({ ...prev, endTime: "" })); }}
                    className={fieldClass("endTime")}
                  />
                  {errors.endTime && <p className="text-[12px] text-danger mt-1">{errors.endTime}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-[7px] border-none bg-gold text-[#FFF8E8] text-[14px] font-medium cursor-pointer font-ui hover:bg-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Создание..." : "Создать лот"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
